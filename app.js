/* Sanket — accessible multimodal conversation prototype (single page, offline-first). */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('sanket.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('sanket.' + k, JSON.stringify(v)); } catch (e) {} }
  };

  var DEFAULT_PREFS = {
    name: '', input: ['speech', 'text'], output: ['text', 'audio'],
    lang: 'hi-IN', fontScale: 1, contrast: 'normal', haptics: true, rate: 1
  };
  var prefs = Object.assign({}, DEFAULT_PREFS, store.get('prefs', {}));

  var ME = 'p' + Math.random().toString(36).slice(2, 8);
  var room = null;
  var msgs = [];
  var peers = {};
  var bc = ('BroadcastChannel' in window) ? new BroadcastChannel('sanket-v1') : null;

  /* ---------------- accessibility plumbing ---------------- */
  function announce(t) { var l = $('#live'); if (l) { l.textContent = ''; setTimeout(function () { l.textContent = t; }, 40); } }
  function banner(t) { var b = $('#banner'); if (!b) return; if (t) { b.textContent = t; b.classList.remove('hidden'); } else { b.classList.add('hidden'); } }

  function applyPrefs() {
    var root = document.documentElement;
    root.style.setProperty('--fs', (16 * (prefs.fontScale || 1)).toFixed(2) + 'px');
    root.setAttribute('data-contrast', prefs.contrast === 'high' ? 'high' : 'normal');
    if ($('#f-name')) $('#f-name').value = prefs.name || '';
    if ($('#sel-lang')) $('#sel-lang').value = prefs.lang;
    if ($('#chk-speak')) $('#chk-speak').checked = prefs.input.indexOf('speech') > -1;
    if ($('#chk-sign')) $('#chk-sign').checked = prefs.input.indexOf('sign') > -1;
    if ($('#chk-type')) $('#chk-type').checked = prefs.input.indexOf('text') > -1;
    if ($('#chk-text')) $('#chk-text').checked = prefs.output.indexOf('text') > -1;
    if ($('#chk-audio')) $('#chk-audio').checked = prefs.output.indexOf('audio') > -1;
    if ($('#rng-font')) { $('#rng-font').value = Math.round((prefs.fontScale || 1) * 100); $('#out-font').value = Math.round((prefs.fontScale || 1) * 100) + '%'; }
    if ($('#rng-rate')) { $('#rng-rate').value = prefs.rate; $('#out-rate').value = Number(prefs.rate).toFixed(1) + '\u00d7'; }
    if ($('#chk-contrast')) $('#chk-contrast').checked = prefs.contrast === 'high';
    if ($('#chk-haptics')) $('#chk-haptics').checked = !!prefs.haptics;
    if ($('#out-chip')) $('#out-chip').textContent = prefs.output.length ? prefs.output.join(' + ') : 'text';
    if ($('#lang-chip')) $('#lang-chip').textContent = prefs.lang === 'hi-IN' ? 'हिन्दी' : 'English';
    store.set('prefs', prefs);
  }

  function show(id) {
    $$('.screen').forEach(function (s) { s.classList.add('hidden'); });
    var el = $('#screen-' + id);
    if (!el) return;
    el.classList.remove('hidden');
    var h = el.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id === 'lab') labRender();
  }

  /* ---------------- speech output ---------------- */
  var voices = [];
  function loadVoices() { try { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch (e) { voices = []; } }
  if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

  function pickVoice(lang) {
    if (!voices.length) loadVoices();
    var base = (lang || 'hi-IN').slice(0, 2);
    var exact = voices.filter(function (v) { return v.lang && v.lang.replace('_', '-') === lang; });
    if (exact.length) return exact[0];
    var loose = voices.filter(function (v) { return v.lang && v.lang.slice(0, 2) === base; });
    return loose.length ? loose[0] : null;
  }

  function speak(text, lang, done) {
    if (!('speechSynthesis' in window) || !text) { if (done) done(false); return; }
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang || prefs.lang;
      u.rate = Number(prefs.rate) || 1;
      var v = pickVoice(u.lang);
      if (v) u.voice = v;
      if (done) { u.onend = function () { done(true); }; u.onerror = function () { done(false); }; }
      speechSynthesis.speak(u);
    } catch (e) { if (done) done(false); }
  }

  /* ---------------- translation phrasebook ---------------- */
  var PB = [
    ['नमस्ते', 'Hello'], ['हाँ', 'Yes'], ['नहीं', 'No'], ['धन्यवाद', 'Thank you'],
    ['कृपया', 'Please'], ['मदद', 'Help'], ['पानी', 'Water'], ['डॉक्टर', 'Doctor'],
    ['समझ गया', 'Understood'], ['फिर मिलेंगे', 'See you again'], ['माफ़ कीजिए', 'Sorry'],
    ['मुझे मदद चाहिए', 'I need help'], ['मैं बहरा हूँ', 'I am deaf'],
    ['मैं दृष्टिबाधित हूँ', 'I am blind'], ['धीरे बोलिए', 'Please speak slowly'],
    ['दोबारा बोलिए', 'Please say that again'], ['मुझे डॉक्टर के पास जाना है', 'I need to see a doctor'],
    ['ट्रेन कहाँ है', 'Where is the train'], ['टिकट कितने का है', 'How much is the ticket'],
    ['मेरा नाम', 'My name is'], ['अस्पताल कहाँ है', 'Where is the hospital'],
    ['क्या आप मेरी मदद कर सकते हैं', 'Can you help me'],
    ['मैं ठीक हूँ', 'I am fine'], ['कितना समय लगेगा', 'How long will it take']
  ];
  var HI2EN = {}, EN2HI = {};
  PB.forEach(function (p) { HI2EN[p[0]] = p[1]; EN2HI[p[1].toLowerCase()] = p[0]; });

  function norm(s) { return String(s || '').replace(/[\u0964\u0965।.,!?;:"'()]/g, ' ').replace(/\s+/g, ' ').trim(); }

  function translate(text, from, to) {
    if (!text) return null;
    if ((from || '').slice(0, 2) === (to || '').slice(0, 2)) return null;
    var t = norm(text), low = t.toLowerCase();
    if (HI2EN[t]) return HI2EN[t];
    if (EN2HI[low]) return EN2HI[low];
    var words = t.split(' '), out = [], hit = 0;
    words.forEach(function (w) {
      if (HI2EN[w]) { out.push(HI2EN[w]); hit++; }
      else if (EN2HI[w.toLowerCase()]) { out.push(EN2HI[w.toLowerCase()]); hit++; }
      else out.push(w);
    });
    if (hit === 0 || hit / words.length < 0.5) return null;
    return out.join(' ');
  }

  /* ---------------- WER ---------------- */
  function words(s) { var n = norm(s); return n ? n.toLowerCase().split(' ') : []; }
  function lev(a, b) {
    var m = a.length, n = b.length, prev = [], cur = [], i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur = [i];
      for (j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }
  function accuracy(ref, hyp) {
    var r = words(ref); if (!r.length) return 0;
    var d = lev(r, words(hyp));
    return Math.max(0, Math.min(100, Math.round((1 - d / r.length) * 1000) / 10));
  }

  /* ---------------- speech input ---------------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var rec = null, listening = false;

  function micSupported() { return !!SR; }

  function listen(opts, onInterim) {
    return new Promise(function (resolve, reject) {
      if (!SR) { reject(new Error('unsupported')); return; }
      if (listening) { reject(new Error('busy')); return; }
      var r = new SR();
      r.lang = opts.lang || prefs.lang;
      r.interimResults = !!onInterim;
      r.continuous = false;
      r.maxAlternatives = 3;
      var text = '', conf = 0, finished = false;
      listening = true; rec = r;

      r.onresult = function (ev) {
        var interim = '';
        for (var i = ev.resultIndex; i < ev.results.length; i++) {
          var res = ev.results[i];
          if (res.isFinal) {
            text += res[0].transcript + ' ';
            for (var k = 0; k < res.length; k++) conf = Math.max(conf, res[k].confidence || 0);
          } else { interim += res[0].transcript; }
        }
        if (onInterim) onInterim((text + interim).trim(), false);
      };
      r.onerror = function (e) {
        if (finished) return; finished = true; listening = false;
        reject(new Error(e.error || 'speech-error'));
      };
      r.onend = function () {
        if (finished) return; finished = true; listening = false;
        resolve({ text: text.trim(), confidence: conf });
      };
      try { r.start(); } catch (e) { listening = false; reject(e); }
    });
  }

  function stopListen() { try { if (rec) rec.stop(); } catch (e) {} }

  /* ---------------- session / realtime ---------------- */
  function myCard() { return { id: ME, name: prefs.name || 'Guest', lang: prefs.lang, input: prefs.input, output: prefs.output }; }

  function joinRoom(code) {
    code = String(code || '').trim().toUpperCase();
    if (!code) return false;
    room = code;
    msgs = store.get('room.' + room, []);
    peers = {};
    peers[ME] = myCard();
    if (bc) {
      bc.postMessage({ type: 'hello', room: room, me: myCard() });
      bc.postMessage({ type: 'sync-request', room: room, from: ME });
    }
    $('#room-label').textContent = room;
    render();
    renderPeers();
    show('session');
    announce('Joined room ' + room.split('').join(' ') + '. Conversation screen.');
    return true;
  }

  function leaveRoom() {
    if (bc && room) bc.postMessage({ type: 'bye', room: room, from: ME });
    room = null; msgs = []; peers = {};
    show('home');
    announce('Left the room.');
  }

  function pushMessage(m) {
    if (msgs.some(function (x) { return x.id === m.id; })) return false;
    msgs.push(m);
    if (msgs.length > 200) msgs = msgs.slice(-200);
    store.set('room.' + room, msgs);
    return true;
  }

  function send(payload) {
    if (!room) { announce('Join a room first.'); return; }
    var m = {
      id: ME + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
      from: ME, name: prefs.name || 'Guest', lang: prefs.lang,
      text: payload.text, modality: payload.modality || 'text',
      gloss: payload.gloss || null, confidence: (payload.confidence === 0 || payload.confidence) ? payload.confidence : null,
      ts: Date.now()
    };
    pushMessage(m);
    render();
    if (bc) bc.postMessage({ type: 'msg', room: room, msg: m });
    announce('Message sent.');
  }

  if (bc) {
    bc.onmessage = function (ev) {
      var d = ev.data || {};
      if (!room || d.room !== room) return;
      if (d.type === 'msg' && d.msg && d.msg.from !== ME) {
        if (pushMessage(d.msg)) { render(); deliver(d.msg); }
      } else if (d.type === 'hello' && d.me && d.me.id !== ME) {
        peers[d.me.id] = d.me; renderPeers();
        bc.postMessage({ type: 'here', room: room, me: myCard() });
      } else if (d.type === 'here' && d.me) {
        peers[d.me.id] = d.me; renderPeers();
      } else if (d.type === 'bye') {
        delete peers[d.from]; renderPeers();
      } else if (d.type === 'sync-request' && d.from !== ME) {
        bc.postMessage({ type: 'sync-data', room: room, msgs: msgs.slice(-40) });
      } else if (d.type === 'sync-data' && Array.isArray(d.msgs)) {
        var added = false;
        d.msgs.forEach(function (m) { if (m && m.from !== ME && pushMessage(m)) added = true; });
        if (added) render();
      }
    };
  }

  function deliver(m) {
    var mine = (m.lang || '').slice(0, 2) === prefs.lang.slice(0, 2);
    var speechText = mine ? m.text : (translate(m.text, m.lang, prefs.lang) || m.text);
    if (prefs.output.indexOf('audio') > -1) speak(speechText, prefs.lang);
    if (prefs.haptics && navigator.vibrate) { try { navigator.vibrate([40, 60, 40]); } catch (e) {} }
    announce('New message from ' + m.name + ': ' + m.text);
    var box = $('#messages'); if (box) box.scrollTop = box.scrollHeight;
  }

  /* ---------------- rendering ---------------- */
  var MOD = {
    speech: { icon: '🎙', label: 'speech', cls: 'say' },
    text: { icon: '⌨', label: 'text', cls: '' },
    'sign-card': { icon: '🤟', label: 'ISL gloss', cls: 'sign' },
    'sign-heuristic': { icon: '🖐', label: 'handshape (exp.)', cls: '' }
  };

  function confChip(c, el) {
    if (c === null || c === undefined) return;
    var txt = Number(c).toFixed(2);
    var cls = c >= 0.85 ? 'ok' : (c >= 0.7 ? 'warn' : 'bad');
    var s = document.createElement('span');
    s.className = 'chip ' + cls;
    s.textContent = 'conf ' + txt;
    s.setAttribute('aria-label', 'Recognition confidence ' + txt);
    el.appendChild(s);
  }

  function render() {
    var box = $('#messages');
    if (!box) return;
    box.textContent = '';
    if (!msgs.length) {
      var e = document.createElement('p');
      e.className = 'empty';
      e.textContent = 'No messages yet. Use the composer to send the first one.';
      box.appendChild(e);
      return;
    }
    msgs.forEach(function (m) {
      var mine = m.from === ME;
      var art = document.createElement('article');
      art.className = 'msg ' + (mine ? 'me' : 'peer');
      art.setAttribute('aria-label', (mine ? 'You' : m.name) + ' said');

      var meta = document.createElement('div');
      meta.className = 'meta';
      var mod = MOD[m.modality] || MOD.text;
      var mc = document.createElement('span');
      mc.className = 'chip ' + (mod.cls || '');
      mc.textContent = mod.label;
      meta.appendChild(mc);
      confChip(m.confidence, meta);
      var who = document.createElement('span');
      who.textContent = (mine ? 'You' : m.name) + ' · ' + new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      meta.appendChild(who);
      art.appendChild(meta);

      var body = document.createElement('div');
      body.className = 'body';
      body.textContent = m.text;
      art.appendChild(body);

      var alt = translate(m.text, m.lang, prefs.lang);
      if (alt) {
        var a = document.createElement('div');
        a.className = 'alt';
        a.textContent = (prefs.lang === 'hi-IN' ? 'हिन्दी में: ' : 'In your language: ') + alt;
        art.appendChild(a);
      }

      var acts = document.createElement('div');
      acts.className = 'acts';
      var sp = document.createElement('button');
      sp.type = 'button'; sp.className = 'btn sm ghost';
      sp.textContent = '🔊 Speak';
      sp.setAttribute('aria-label', 'Speak this message aloud');
      sp.onclick = function () { speak(alt || m.text, prefs.lang); };
      acts.appendChild(sp);
      if (m.modality === 'sign-card' && m.gloss) {
        var g = document.createElement('span');
        g.className = 'chip'; g.textContent = 'gloss: ' + m.gloss;
        acts.appendChild(g);
      }
      art.appendChild(acts);
      box.appendChild(art);
    });
    box.scrollTop = box.scrollHeight;
  }

  function renderPeers() {
    var ul = $('#peers'); if (!ul) return;
    ul.textContent = '';
    var ids = Object.keys(peers);
    ids.forEach(function (id) {
      var li = document.createElement('li');
      li.className = 'chip';
      var p = peers[id];
      li.textContent = (id === ME ? '● you' : '● ' + p.name) + ' · ' + (p.output || []).join('+');
      ul.appendChild(li);
    });
    $('#peer-count').textContent = ids.length + (ids.length === 1 ? ' participant' : ' participants');
  }

  /* ---------------- composer tabs ---------------- */
  function tab(id) {
    ['speak', 'type', 'sign'].forEach(function (k) {
      var b = $('#tab-' + k), p = $('#pane-' + k);
      var on = k === id;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      p.classList.toggle('hidden', !on);
    });
  }

  /* ---------------- gloss vocabulary ---------------- */
  var GLOSSES = [
    { id: 'namaste', hi: 'नमस्ते', en: 'Hello', desc: 'Palms joined at chest' },
    { id: 'haan', hi: 'हाँ', en: 'Yes', desc: 'Fist nodding forward' },
    { id: 'nahi', hi: 'नहीं', en: 'No', desc: 'Index finger side-to-side' },
    { id: 'dhanyavad', hi: 'धन्यवाद', en: 'Thank you', desc: 'Fingertips from chin outward' },
    { id: 'kripya', hi: 'कृपया', en: 'Please', desc: 'Flat palm circular on chest' },
    { id: 'madad', hi: 'मदद', en: 'Help', desc: 'Fist on flat palm, lifted' },
    { id: 'paani', hi: 'पानी', en: 'Water', desc: 'W-handshape to lips' },
    { id: 'doctor', hi: 'डॉक्टर', en: 'Doctor', desc: 'Two fingers on wrist pulse' },
    { id: 'samajh', hi: 'समझ गया', en: 'Understood', desc: 'Index from temple forward' },
    { id: 'phir', hi: 'फिर मिलेंगे', en: 'See you again', desc: 'Open hand closing, moving away' },
    { id: 'maafi', hi: 'माफ़ कीजिए', en: 'Sorry', desc: 'Fist circling on chest' },
    { id: 'dhyan', hi: 'ध्यान दीजिए', en: 'Please pay attention', desc: 'Both hands frame face' }
  ];

  function buildGloss() {
    var grid = $('#glossGrid'); if (!grid) return;
    grid.textContent = '';
    GLOSSES.forEach(function (g) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'gcard';
      b.setAttribute('aria-label', g.hi + ', ' + g.en + '. Sign description: ' + g.desc + '. Send as ISL gloss.');
      var a = document.createElement('span'); a.className = 'g-hi'; a.textContent = g.hi;
      var c = document.createElement('span'); c.className = 'g-en'; c.textContent = g.en;
      var d = document.createElement('span'); d.className = 'g-d'; d.textContent = g.desc;
      b.appendChild(a); b.appendChild(c); b.appendChild(d);
      b.onclick = function () {
        send({
          text: prefs.lang === 'hi-IN' ? g.hi : g.en,
          modality: 'sign-card', gloss: g.id, confidence: null
        });
      };
      grid.appendChild(b);
    });
  }

  /* ---------------- speak composer ---------------- */
  var pending = null;

  function setTranscript(t, live) {
    var el = $('#transcript');
    el.textContent = t || 'Your words will appear here…';
    el.classList.toggle('live', !!live);
  }

  function showConfirm(note) {
    var n = $('#confirm-note');
    if (note) { n.textContent = note; n.classList.remove('hidden'); speak(note, prefs.lang); }
    else { n.classList.add('hidden'); }
    $('#speak-actions').classList.remove('hidden');
  }

  function resetSpeak() {
    pending = null;
    setTranscript('', false);
    $('#conf-chip').classList.add('hidden');
    $('#speak-actions').classList.add('hidden');
    $('#confirm-note').classList.add('hidden');
    $('#btn-mic').setAttribute('aria-pressed', 'false');
  }

  function startMic() {
    if (!micSupported()) {
      announce('This browser has no speech recognition. Use Type instead.');
      showConfirm('Speech recognition is unavailable in this browser. Please type your message.');
      return;
    }
    var btn = $('#btn-mic');
    btn.setAttribute('aria-pressed', 'true');
    setTranscript('Listening…', true);
    announce('Listening. Speak now.');

    listen({ lang: prefs.lang }, function (t, fin) { setTranscript(t, true); })
      .then(function (res) {
        btn.setAttribute('aria-pressed', 'false');
        var text = res.text;
        if (!text) {
          setTranscript('', false);
          showConfirm('I did not catch that. Please try again, or type it.');
          return;
        }
        var conf = res.confidence;
        pending = { text: text, confidence: conf > 0 ? conf : null };
        setTranscript(text, false);
        var chip = $('#conf-chip');
        chip.className = 'chip ' + (conf >= 0.85 ? 'ok' : conf >= 0.7 ? 'warn' : 'bad');
        chip.textContent = conf > 0 ? 'confidence ' + conf.toFixed(2) : 'confidence unavailable';
        chip.classList.remove('hidden');

        var unsure = (conf > 0 && conf < 0.72) || words(text).length < 2;
        if (unsure) {
          showConfirm('I am not fully sure of that. Check the text, then send — or edit it first.');
        } else {
          showConfirm(null);
        }
        announce('Recognised: ' + text + '. Press Send to deliver.');
      })
      .catch(function (err) {
        btn.setAttribute('aria-pressed', 'false');
        setTranscript('', false);
        var code = (err && err.message) || 'error';
        var msg = code === 'not-allowed' || code === 'service-not-allowed'
          ? 'Microphone permission was blocked. Allow the mic, or type your message.'
          : code === 'no-speech'
            ? 'No speech detected. Try again, a little louder.'
            : code === 'network'
              ? 'Speech service needs internet. Try Type instead.'
              : 'Speech input did not work (' + code + '). Please type your message.';
        showConfirm(msg);
      });
  }

  /* ---------------- camera handshape (experimental) ---------------- */
  var stream = null, landmarker = null, rafId = null, shapeHist = [], camLoopOn = false;

  function camStatus(t, tone) {
    var s = $('#camStatus');
    s.textContent = t || '';
    s.style.color = tone === 'bad' ? 'var(--bad)' : tone === 'ok' ? 'var(--ok)' : 'var(--muted)';
  }

  function dist(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }

  function classify(lm) {
    if (!lm || lm.length < 21) return null;
    var wrist = lm[0];
    var pairs = [[8, 6], [12, 10], [16, 14], [20, 18]];
    var ext = pairs.map(function (p) { return dist(lm[p[0]], wrist) > dist(lm[p[1]], wrist) * 1.12 ? 1 : 0; });
    var thumb = dist(lm[4], lm[17]) > dist(lm[2], lm[17]) * 1.25 ? 1 : 0;
    var count = ext.reduce(function (a, b) { return a + b; }, 0);
    var label = 'UNKNOWN';
    if (count === 4 && thumb) label = 'OPEN PALM';
    else if (count === 0 && !thumb) label = 'FIST';
    else if (count === 1 && ext[0] && !ext[1] && !ext[2] && !ext[3]) label = 'ONE (index)';
    else if (count === 2 && ext[0] && ext[1] && !ext[2] && !ext[3]) label = 'TWO (peace)';
    else if (count === 0 && thumb) label = 'THUMBS UP';
    else if (count === 3 && ext[0] && ext[1] && ext[2] && !ext[3]) label = 'THREE';
    else label = count + ' FINGERS';
    return { label: label, fingers: count, thumb: thumb };
  }

  function drawLandmarks(lm, canvas, video) {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!lm) return;
    var w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#6ee7ff';
    lm.forEach(function (p) {
      ctx.beginPath(); ctx.arc(p.x * w, p.y * h, 3.2, 0, Math.PI * 2); ctx.fill();
    });
    var edges = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],
      [9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
    ctx.strokeStyle = 'rgba(167,139,250,.9)'; ctx.lineWidth = 2;
    edges.forEach(function (e) {
      ctx.beginPath(); ctx.moveTo(lm[e[0]].x * w, lm[e[0]].y * h); ctx.lineTo(lm[e[1]].x * w, lm[e[1]].y * h); ctx.stroke();
    });
  }

  function loop() {
    if (!camLoopOn) return;
    var video = $('#cam'), canvas = $('#camCanvas');
    if (video && video.readyState >= 2 && landmarker) {
      var res;
      try { res = landmarker.detectForVideo(video, performance.now()); } catch (e) { res = null; }
      var lm = res && res.landmarks && res.landmarks[0] ? res.landmarks[0] : null;
      drawLandmarks(lm, canvas, video);
      var c = classify(lm);
      if (c) {
        shapeHist.push(c.label);
        if (shapeHist.length > 10) shapeHist.shift();
        var counts = {};
        shapeHist.forEach(function (l) { counts[l] = (counts[l] || 0) + 1; });
        var best = null, bv = 0;
        Object.keys(counts).forEach(function (k) { if (counts[k] > bv) { bv = counts[k]; best = k; } });
        var stability = Math.round((bv / shapeHist.length) * 100);
        $('#camLabel').textContent = best + ' · stability ' + stability + '%';
        $('#camActions').classList.remove('hidden');
        $('#camLabel').dataset.shape = best;
        $('#camLabel').dataset.stability = String(stability);
      }
    } else if (!landmarker && video && video.readyState >= 2) {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    rafId = requestAnimationFrame(loop);
  }

  function startCamera() {
    var btn = $('#btn-cam');
    if (stream) { stopCamera(); return; }
    camStatus('Requesting camera…');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640 } })
      .then(function (s) {
        stream = s;
        $('#camWrap').classList.remove('hidden');
        var v = $('#cam'); v.srcObject = s;
        return v.play();
      })
      .then(function () {
        btn.setAttribute('aria-pressed', 'true');
        btn.textContent = 'Stop camera';
        camStatus('Loading hand-landmark model (needs internet)…');
        return import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
      })
      .then(function (vision) {
        return vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm')
          .then(function (fileset) {
            return vision.HandLandmarker.createFromOptions(fileset, {
              baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' },
              numHands: 1, runningMode: 'VIDEO'
            });
          });
      })
      .then(function (hl) {
        landmarker = hl;
        camLoopOn = true;
        loop();
        camStatus('Camera ready. Hold one static handshape in frame. Heuristic reading — confirm before sending.', 'ok');
      })
      .catch(function (err) {
        camLoopOn = false;
        if (rafId) cancelAnimationFrame(rafId);
        var m = (err && err.message) || '';
        if (/Permission|NotAllowed|denied/i.test(m)) camStatus('Camera permission blocked. Gloss cards below still work.', 'bad');
        else camStatus('Hand model could not load (offline or blocked). The validated gloss cards still work.', 'bad');
      });
  }

  function stopCamera() {
    camLoopOn = false;
    if (rafId) cancelAnimationFrame(rafId);
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    $('#camWrap').classList.add('hidden');
    $('#camActions').classList.add('hidden');
    var b = $('#btn-cam'); b.setAttribute('aria-pressed', 'false'); b.textContent = 'Start camera';
    camStatus('Camera stopped.');
  }

  /* ---------------- voice commands ---------------- */
  function voiceCommand() {
    var b = $('#btn-voicecmd');
    if (!micSupported()) { announce('Voice commands need speech recognition. Unavailable here.'); return; }
    b.setAttribute('aria-pressed', 'true');
    announce('Listening for a command.');
    listen({ lang: prefs.lang }, null).then(function (r) {
      b.setAttribute('aria-pressed', 'false');
      var t = (r.text || '').toLowerCase();
      if (!t) { announce('No command heard.'); return; }
      if (/send|भेज|भेजो|पठा/.test(t)) { $('#btn-send-speak').click(); }
      else if (/repeat|दोहरा|फिर से|सुनाओ/.test(t)) {
        var last = msgs[msgs.length - 1];
        if (last) speak(last.text, prefs.lang); else announce('Nothing to repeat.');
      }
      else if (/type|लिख/.test(t)) { tab('type'); $('#txt-input').focus(); announce('Typing mode.'); }
      else if (/sign|इशारा|सांकेत/.test(t)) { tab('sign'); announce('Sign mode.'); }
      else if (/read|पढ़/.test(t)) { render(); announce('Re-reading conversation.'); var box = $('#messages'); if (box) box.scrollTop = box.scrollHeight; }
      else if (/help|मदद/.test(t)) { show('about'); }
      else if (/lab|accuracy/.test(t)) { show('lab'); }
      else if (/leave|बाहर/.test(t)) { leaveRoom(); }
      else { announce('Command not recognised: ' + r.text); }
    }).catch(function () {
      b.setAttribute('aria-pressed', 'false'); announce('Command listening failed.');
    });
  }

  /* ---------------- accuracy lab ---------------- */
  var LAB = {
    'hi-IN': [
      { s: 'मुझे डॉक्टर के पास जाना है', hint: 'I need to see a doctor' },
      { s: 'अस्पताल कहाँ है', hint: 'Where is the hospital' },
      { s: 'कृपया धीरे बोलिए', hint: 'Please speak slowly' },
      { s: 'टिकट कितने का है', hint: 'How much is the ticket' },
      { s: 'मुझे मदद चाहिए', hint: 'I need help' },
      { s: 'मैं बहरा हूँ', hint: 'I am deaf' }
    ],
    'en-IN': [
      { s: 'I need to see a doctor', hint: 'English' },
      { s: 'Where is the hospital', hint: 'English' },
      { s: 'Please speak slowly', hint: 'English' },
      { s: 'How much is the ticket', hint: 'English' },
      { s: 'I need help', hint: 'English' },
      { s: 'I am deaf', hint: 'English' }
    ]
  };
  var labIdx = 0, labResults = [];

  function labRender() {
    var lang = $('#lab-lang').value;
    var set = LAB[lang];
    if (labIdx >= set.length) labIdx = 0;
    var item = set[labIdx];
    $('#lab-sentence').textContent = item.s;
    $('#lab-hint').textContent = 'Sentence ' + (labIdx + 1) + ' of ' + set.length + (item.hint && item.hint !== 'English' ? ' · ' + item.hint : '');
    $('#lab-tbody').textContent = '';
    if (!labResults.length) { $('#lab-results').classList.add('hidden'); return; }
    $('#lab-results').classList.remove('hidden');
    labResults.forEach(function (r, i) {
      var tr = document.createElement('tr');
      [String(i + 1), r.hyp || '(nothing heard)', (Math.round(r.wer * 1000) / 10) + '%', r.acc + '%'].forEach(function (v, ci) {
        var td = document.createElement('td');
        td.textContent = v;
        if (ci === 3) td.className = 'score';
        tr.appendChild(td);
      });
      $('#lab-tbody').appendChild(tr);
    });
    var mean = labResults.reduce(function (a, r) { return a + r.acc; }, 0) / labResults.length;
    $('#lab-agg').textContent = (Math.round(mean * 10) / 10) + '%';
    var langName = lang === 'hi-IN' ? 'Hindi' : 'English (India)';
    $('#lab-meta').textContent = labResults.length + ' sentence' + (labResults.length > 1 ? 's' : '') +
      ' · ' + langName + '\n' + 'this device, this mic, this room';
  }

  function labRecord() {
    var btn = $('#btn-lab-record');
    var lang = $('#lab-lang').value;
    var item = LAB[lang][labIdx];
    if (!micSupported()) { $('#lab-status').textContent = 'Speech recognition unavailable in this browser (try Chrome or Edge over https/localhost).'; return; }
    btn.disabled = true;
    $('#lab-status').textContent = 'Listening — read the sentence exactly as shown…';
    listen({ lang: lang }, null).then(function (r) {
      btn.disabled = false;
      var hyp = r.text || '';
      var w = words(item.s).length;
      var d = lev(words(item.s), words(hyp));
      var acc = accuracy(item.s, hyp);
      labResults.push({ ref: item.s, hyp: hyp, wer: w ? d / w : 1, acc: acc });
      $('#lab-status').textContent = 'Scored: ' + acc + '% word accuracy on this sentence.';
      labIdx = (labIdx + 1) % LAB[lang].length;
      labRender();
      announce('Accuracy ' + acc + ' percent.');
    }).catch(function (e) {
      btn.disabled = false;
      $('#lab-status').textContent = 'Recording failed (' + ((e && e.message) || 'error') + '). Check mic permission.';
    });
  }

  /* ---------------- export ---------------- */
  function exportTranscript() {
    if (!msgs.length) { announce('Nothing to export yet.'); return; }
    var lines = ['Sanket transcript — room ' + room, 'Exported ' + new Date().toISOString(), ''];
    msgs.forEach(function (m) {
      lines.push('[' + new Date(m.ts).toLocaleTimeString() + '] ' + m.name + ' (' + m.modality + '): ' + m.text);
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sanket-' + room + '.txt';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    announce('Transcript downloaded.');
  }

  /* ---------------- wiring ---------------- */
  function wire() {
    $$('[data-go]').forEach(function (b) {
      b.onclick = function () { show(b.getAttribute('data-go')); };
    });

    // onboarding
    $('#rng-font').oninput = function () {
      prefs.fontScale = Number(this.value) / 100;
      $('#out-font').value = this.value + '%';
      document.documentElement.style.setProperty('--fs', (16 * prefs.fontScale).toFixed(2) + 'px');
    };
    $('#rng-rate').oninput = function () {
      prefs.rate = Number(this.value);
      $('#out-rate').value = Number(this.value).toFixed(1) + '\u00d7';
    };
    $('#chk-contrast').onchange = function () {
      document.documentElement.setAttribute('data-contrast', this.checked ? 'high' : 'normal');
      prefs.contrast = this.checked ? 'high' : 'normal';
    };
    $('#btn-save-prefs').onclick = function () {
      prefs.name = $('#f-name').value.trim();
      prefs.lang = $('#sel-lang').value;
      prefs.input = [];
      if ($('#chk-speak').checked) prefs.input.push('speech');
      if ($('#chk-sign').checked) prefs.input.push('sign');
      if ($('#chk-type').checked) prefs.input.push('text');
      prefs.output = [];
      if ($('#chk-text').checked) prefs.output.push('text');
      if ($('#chk-audio').checked) prefs.output.push('audio');
      prefs.haptics = $('#chk-haptics').checked;
      prefs.fontScale = Number($('#rng-font').value) / 100;
      prefs.rate = Number($('#rng-rate').value);
      if (!prefs.input.length) prefs.input = ['text'];
      if (!prefs.output.length) prefs.output = ['text'];
      applyPrefs();
      $('#out-chip').textContent = prefs.output.join(' + ');
      show('home');
      announce('Preferences saved. ' + (prefs.name ? 'Hello ' + prefs.name + '. ' : '') + 'Choose create or join room.');
    };

    // home
    $('#btn-create').onclick = function () {
      var code = 'SANKET-' + Math.floor(10 + Math.random() * 89);
      if (joinRoom(code)) $('#room-code').value = code;
    };
    $('#btn-join').onclick = function () {
      var v = $('#room-code').value.trim();
      if (!v) { $('#home-msg').textContent = 'Enter a room code first.'; $('#room-code').focus(); return; }
      if (!joinRoom(v)) $('#home-msg').textContent = 'Could not join that room.';
    };
    $('#btn-solo').onclick = function () { joinRoom('SOLO-' + Math.floor(100 + Math.random() * 900)); };

    // session
    $('#btn-copy').onclick = function () {
      var t = room || '';
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(function () { announce('Room code copied.'); }, function () {});
      else announce('Room code is ' + t);
    };
    $('#btn-leave').onclick = leaveRoom;
    $('#btn-export').onclick = exportTranscript;
    $('#btn-voicecmd').onclick = voiceCommand;

    // tabs
    $('#tab-speak').onclick = function () { tab('speak'); };
    $('#tab-type').onclick = function () { tab('type'); $('#txt-input').focus(); };
    $('#tab-sign').onclick = function () { tab('sign'); };

    // speak
    $('#btn-mic').onclick = function () {
      if (listening) { stopListen(); return; }
      startMic();
    };
    $('#btn-send-speak').onclick = function () {
      if (!pending || !pending.text) { announce('Nothing to send yet.'); return; }
      send({ text: pending.text, modality: 'speech', confidence: pending.confidence });
      resetSpeak();
      tab('speak');
    };
    $('#btn-edit-speak').onclick = function () {
      if (pending && pending.text) $('#txt-input').value = pending.text;
      tab('type'); $('#txt-input').focus();
    };
    $('#btn-clear-speak').onclick = resetSpeak;

    // type
    $('#btn-send-type').onclick = function () {
      var v = $('#txt-input').value.trim();
      if (!v) { announce('Type a message first.'); $('#txt-input').focus(); return; }
      send({ text: v, modality: 'text', confidence: null });
      $('#txt-input').value = '';
    };
    $('#btn-speak-type').onclick = function () {
      var v = $('#txt-input').value.trim();
      if (v) speak(v, prefs.lang);
    };

    // sign
    $('#btn-cam').onclick = startCamera;
    $('#btn-cam-send').onclick = function () {
      var lab = $('#camLabel');
      var shape = lab.dataset.shape || '';
      var stab = lab.dataset.stability || '';
      if (!shape) return;
      send({
        text: (prefs.lang === 'hi-IN' ? 'हस्त मुद्रा: ' : 'Handshape: ') + shape + ' (' + stab + '%)',
        modality: 'sign-heuristic', confidence: stab ? Number(stab) / 100 : null
      });
    };

    // lab
    $('#lab-lang').onchange = function () { labIdx = 0; labResults = []; labRender(); };
    $('#btn-lab-record').onclick = labRecord;
    $('#btn-lab-next').onclick = function () { var l = $('#lab-lang').value; labIdx = (labIdx + 1) % LAB[l].length; labRender(); };
    $('#btn-lab-reset').onclick = function () { labResults = []; labIdx = 0; $('#lab-status').textContent = ''; labRender(); };

    // keyboard shortcut: alt+s send, alt+m mic
    document.addEventListener('keydown', function (e) {
      if (!e.altKey) return;
      if (e.key === 'm' && room) { e.preventDefault(); $('#btn-mic').click(); }
      if (e.key === 's' && room) { e.preventDefault(); $('#btn-send-speak').click(); }
    });
  }


  function seedDemo() {
    if (msgs.length) return;
    var now = Date.now();
    var demo = [
      { id: 'demo1', from: 'guest-asha', name: 'Asha', lang: 'hi-IN', text: '\u0928\u092e\u0938\u094d\u0924\u0947, \u092e\u0941\u091d\u0947 \u0921\u0949\u0915\u094d\u091f\u0930 \u0915\u0947 \u092a\u093e\u0938 \u091c\u093e\u0928\u093e \u0939\u0948', modality: 'speech', confidence: 0.94, ts: now - 240000 },
      { id: 'demo2', from: ME, name: prefs.name || 'Guest', lang: prefs.lang, text: prefs.lang === 'hi-IN' ? '\u092e\u0926\u0926' : 'Help', modality: 'sign-card', gloss: 'madad', confidence: null, ts: now - 120000 },
      { id: 'demo3', from: 'guest-asha', name: 'Asha', lang: 'hi-IN', text: '\u0905\u0938\u094d\u092a\u0924\u093e\u0932 \u0915\u0939\u093e\u0901 \u0939\u0948', modality: 'speech', confidence: 0.61, ts: now - 60000 }
    ];
    demo.forEach(function (m) { msgs.push(m); });
    store.set('room.' + room, msgs);
    render();
  }

  function boot() {
    applyPrefs();
    buildGloss();
    wire();
    $('#out-chip').textContent = prefs.output.join(' + ');
    $('#txt-input').placeholder = prefs.lang === 'hi-IN' ? 'हिन्दी या English में लिखें…' : 'Type in English or हिन्दी…';

    if (!micSupported()) {
      banner('No speech recognition in this browser — Type mode and the accuracy lab need Chrome/Edge. Speech output still works.');
    } else if (location.protocol === 'file:') {
      banner('Opened as a local file: microphone access is blocked by browsers. Serve it over https or localhost to use speech input.');
    }
    $('#lanag-chip');
    var hash = (location.hash || '').replace('#', '').toLowerCase();
    if (hash === 'session') { joinRoom('SANKET-42'); seedDemo(); return; }
    if (hash === 'lab') { show('lab'); return; }
    if (hash === 'about') { show('about'); return; }
    if (hash === 'home') { show('home'); return; }
    announce('Sanket ready. Choose your communication preferences.');
    show('onboard');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

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
    name: '', input: ['speech', 'text'], output: ['text', 'sign', 'audio'],
    lang: 'hi-IN', fontScale: 1, contrast: 'normal', haptics: true, rate: 1, captions: true
  };
  var prefs = Object.assign({}, DEFAULT_PREFS, store.get('prefs', {}));

  var ME = 'p' + Math.random().toString(36).slice(2, 8);
  var room = null;
  var msgs = [];
  var peers = {};
  var paused = false;
  var ws = null;
  var bc = ('BroadcastChannel' in window) ? new BroadcastChannel('sanket-v1') : null;

  /* ---------------- accessibility plumbing ---------------- */
  function announce(t) { var l = $('#sr-live'); if (l) { l.textContent = ''; setTimeout(function () { l.textContent = t; }, 40); } }
  function banner(t) { if (t) announce(t); }

  function applyPrefs() {
    var root = document.documentElement;
    root.style.setProperty('--fs', (16 * (prefs.fontScale || 1)).toFixed(2) + 'px');
    root.setAttribute('data-contrast', prefs.contrast === 'high' ? 'high' : 'normal');
    if ($('#f-name')) $('#f-name').value = prefs.name || '';
    if (prefs.lang !== 'hi-IN' && prefs.lang !== 'en-IN') prefs.lang = 'hi-IN';
    if ($('#sel-lang')) $('#sel-lang').value = prefs.lang;
    if ($('#studio-lang')) $('#studio-lang').value = prefs.lang;
    if ($('#chk-speak')) $('#chk-speak').checked = prefs.input.indexOf('speech') > -1;
    if ($('#chk-sign')) $('#chk-sign').checked = prefs.input.indexOf('sign') > -1;
    if ($('#chk-type')) $('#chk-type').checked = prefs.input.indexOf('text') > -1;
    if ($('#chk-text')) $('#chk-text').checked = prefs.output.indexOf('text') > -1;
    if ($('#chk-out-sign')) $('#chk-out-sign').checked = prefs.output.indexOf('sign') > -1;
    if ($('#chk-audio')) $('#chk-audio').checked = prefs.output.indexOf('audio') > -1;
    if ($('#rng-font')) { $('#rng-font').value = Math.round((prefs.fontScale || 1) * 100); $('#out-font').value = Math.round((prefs.fontScale || 1) * 100) + '%'; }
    if ($('#rng-rate')) { $('#rng-rate').value = prefs.rate; $('#out-rate').value = Number(prefs.rate).toFixed(1) + '\u00d7'; }
    if ($('#chk-contrast')) $('#chk-contrast').checked = prefs.contrast === 'high';
    if ($('#chk-haptics')) $('#chk-haptics').checked = !!prefs.haptics;
    if ($('#out-chip')) $('#out-chip').textContent = prefs.output.length ? prefs.output.join(' + ') : 'text';
    var LANG_LABELS = { 'hi-IN': 'हिन्दी', 'en-IN': 'English', 'ta-IN': 'தமிழ்', 'te-IN': 'తెలుగు', 'mr-IN': 'मराठी', 'bn-IN': 'বাংলা', 'kn-IN': 'ಕನ್ನಡ', 'gu-IN': 'ગુજરાતી' };
    var ltext = LANG_LABELS[prefs.lang] || prefs.lang;
    if ($('#lang-chip')) $('#lang-chip').textContent = ltext;
    if ($('#home-lang-chip')) $('#home-lang-chip').textContent = '🇮🇳 ' + ltext;
    if ($('#guest-name')) $('#guest-name').textContent = prefs.name || 'Guest User';
    if ($('#guest-avatar')) $('#guest-avatar').textContent = (prefs.name || 'G').slice(0, 1).toUpperCase();
    if ($('#guest-prefs-summary')) $('#guest-prefs-summary').textContent = (prefs.input.join('+') || 'text') + ' · ' + ltext;
    store.set('prefs', prefs);
  }

  function show(id) {
    var target = $('#view-' + id);
    if (!target) return;
    $$('.view').forEach(function (v) { v.classList.add('hidden'); });
    target.classList.remove('hidden');
    $$('[data-nav]').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-nav') === id); });
    var h = target.querySelector('h1, h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      var text = '', lastInterim = '', conf = 0, finished = false;
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
        lastInterim = (text + interim).trim();
        if (onInterim) onInterim(lastInterim, false);
      };
      r.onerror = function (e) {
        if (finished) return; finished = true; listening = false;
        if (lastInterim) resolve({ text: lastInterim, confidence: conf });
        else reject(new Error(e.error || 'speech-error'));
      };
      r.onend = function () {
        if (finished) return; finished = true; listening = false;
        resolve({ text: (text.trim() || lastInterim), confidence: conf });
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
    connectSocket(room);
    if ($('#room-badge')) $('#room-badge').textContent = room;
    if ($('#side-status-text')) $('#side-status-text').textContent = 'Connected · ' + room;
    render();
    renderPeers();
    announce('Joined room ' + room.split('').join(' ') + '.');
    return true;
  }

  function handleIncoming(d) {
    if (!d || !room || d.room !== room) return;
    if (d.type === 'msg' && d.msg && d.msg.from !== ME) {
      if (pushMessage(d.msg)) { render(); deliver(d.msg); }
    } else if (d.type === 'hello' && d.me && d.me.id !== ME) {
      peers[d.me.id] = d.me; renderPeers();
      relay({ type: 'here', room: room, me: myCard() });
    } else if (d.type === 'here' && d.me) {
      peers[d.me.id] = d.me; renderPeers();
    } else if (d.type === 'bye') {
      delete peers[d.from]; renderPeers();
    } else if (d.type === 'sync-request' && d.from !== ME) {
      relay({ type: 'sync-data', room: room, msgs: msgs.slice(-40) });
    } else if (d.type === 'sync-data' && Array.isArray(d.msgs)) {
      var added = false;
      d.msgs.forEach(function (m) { if (m && m.from !== ME && pushMessage(m)) added = true; });
      if (added) render();
    }
  }

  function relay(payload) {
    if (bc) bc.postMessage(payload);
    if (ws && ws.readyState === 1) { try { ws.send(JSON.stringify(payload)); } catch (e) {} }
  }

  function connectSocket(code) {
    if (ws) { try { ws.close(); } catch (e) {} ws = null; }
    if (!/^https?:$/.test(location.protocol) || /github\.io$/i.test(location.hostname)) return;
    try {
      var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(proto + '//' + location.host + '/ws/' + encodeURIComponent(code));
      ws.onopen = function () { relay({ type: 'hello', room: code, me: myCard() }); };
      ws.onmessage = function (ev) { try { handleIncoming(JSON.parse(ev.data)); } catch (e) {} };
      ws.onerror = function () {};
    } catch (e) {}
  }

  function leaveRoom() {
    if (room) relay({ type: 'bye', room: room, from: ME });
    if (ws) { try { ws.close(); } catch (e) {} ws = null; }
    room = null; msgs = []; peers = {};
    if ($('#side-status-text')) $('#side-status-text').textContent = 'Ready to Connect';
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
    if (paused) { announce('Session is paused. Resume to send.'); return; }
    var m = {
      id: ME + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
      from: ME, name: prefs.name || 'Guest', lang: prefs.lang,
      text: payload.text, modality: payload.modality || 'text',
      gloss: payload.gloss || null, confidence: (payload.confidence === 0 || payload.confidence) ? payload.confidence : null,
      ts: Date.now()
    };
    pushMessage(m);
    render();
    relay({ type: 'msg', room: room, msg: m });
    announce('Message sent.');
  }

  if (bc) {
    bc.onmessage = function (ev) { handleIncoming(ev.data || {}); };
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

      var islBtn = document.createElement('button');
      islBtn.type = 'button'; islBtn.className = 'btn sm ghost';
      islBtn.textContent = '🤟 Play ISL';
      islBtn.setAttribute('aria-label', 'Play Indian Sign Language animation for this message');
      acts.appendChild(islBtn);

      if (m.modality === 'sign-card' && m.gloss) {
        var g = document.createElement('span');
        g.className = 'chip'; g.textContent = 'gloss: ' + m.gloss;
        acts.appendChild(g);
      }
      art.appendChild(acts);

      var islHost = document.createElement('div');
      art.appendChild(islHost);
      var autoSign = prefs.output.indexOf('sign') > -1 && m.id === msgs[msgs.length - 1].id;
      islBtn.onclick = function () { mountIslPlayer(islHost, alt || m.text, true); };
      if (autoSign) mountIslPlayer(islHost, m.text, !mine);

      box.appendChild(art);
    });
    if ($('#partner-isl-spotlight') && msgs.length) {
      var latest = msgs[msgs.length - 1];
      mountIslPlayer($('#partner-isl-spotlight'), latest.text, true);
    }
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

  /* ---------------- Text -> ISL Glossifier & Per-Word/Letter SVG Flashcards ---------------- */
  var ISL_STOP = {
    is: 1, am: 1, was: 1, were: 1, the: 1, a: 1, an: 1, to: 1, for: 1, of: 1, in: 1, on: 1, at: 1,
    हूँ: 1, हूं: 1, है: 1, हैं: 1, था: 1, थी: 1, को: 1, का: 1, की: 1, के: 1, में: 1, से: 1, पर: 1, पास: 1
  };

  var ISL_SIGNS = {
    HELLO:      { words: ['hello','hi','namaste','नमस्ते','नमस्कार'], icon: '🙏', hi: 'नमस्ते', desc: 'Join both palms at chest & bow slightly', anim: 'anim-nod', dir: '↕ BOW', pose: 'palms-join' },
    ME:         { words: ['i','me','my','myself','main','mujhe','मैं','मुझे','मेरा'], icon: '👆', hi: 'मैं / मुझे', desc: 'Point index finger toward your chest', anim: 'anim-in', dir: '← CHEST', pose: 'point-self' },
    GO:         { words: ['go','going','jaana','jana','jao','जाना','जाओ','गया'], icon: '🚶', hi: 'जाना', desc: 'Move open hand forward away from body', anim: 'anim-out', dir: '→ GO', pose: 'sweep-out' },
    YES:        { words: ['yes','haan','ok','okay','हाँ','हां'], icon: '👍', hi: 'हाँ', desc: 'Closed fist nodding forward twice', anim: 'anim-nod', dir: '↓ NOD', pose: 'fist-nod' },
    NO:         { words: ['no','not','nahi','nahin','नहीं','ना'], icon: '☝️', hi: 'नहीं', desc: 'Index finger sweeping side-to-side', anim: 'anim-shake', dir: '⇄ SHAKE', pose: 'index-shake' },
    THANK_YOU:  { words: ['thanks','thank','thankyou','dhanyavad','dhanyavaad','शुक्रिया','धन्यवाद'], icon: '🤲', hi: 'धन्यवाद', desc: 'Fingertips from chin moving outward', anim: 'anim-out', dir: '→ OUT', pose: 'chin-out' },
    PLEASE:     { words: ['please','kripya','कृपया'], icon: '🫶', hi: 'कृपया', desc: 'Flat palm circling gently on chest', anim: 'anim-circle', dir: '↻ CIRCLE', pose: 'palm-circle' },
    HELP:       { words: ['help','madad','बचाओ','मदद','सहायता'], icon: '🆘', hi: 'मदद', desc: 'Fist resting on flat palm, lifted together', anim: 'anim-lift', dir: '↑ LIFT', pose: 'fist-on-palm' },
    WATER:      { words: ['water','paani','pani','पानी','जल'], icon: '💧', hi: 'पानी', desc: 'W-handshape tapped near lips twice', anim: 'anim-nod', dir: '👄 LIPS', pose: 'three-lips' },
    DOCTOR:     { words: ['doctor','hospital','clinic','डॉक्टर','अस्पताल'], icon: '🩺', hi: 'डॉक्टर', desc: 'Two fingers tapping wrist pulse', anim: 'anim-pulse', dir: '💓 PULSE', pose: 'wrist-tap' },
    MEDICINE:   { words: ['medicine','dawa','tablet','दवा','दवाई','गोली'], icon: '💊', hi: 'दवा', desc: 'Middle finger circling on opposite palm', anim: 'anim-circle', dir: '↻ PALM', pose: 'palm-circle' },
    HOME:       { words: ['home','house','ghar','घर','मकान'], icon: '🏠', hi: 'घर', desc: 'Fingertips of both hands forming a roof peak', anim: 'anim-pulse', dir: '⌂ ROOF', pose: 'roof-peak' },
    FOOD:       { words: ['food','eat','khana','खाना','भोजन','रोटी'], icon: '🍽️', hi: 'खाना', desc: 'Bunched fingertips brought toward mouth', anim: 'anim-in', dir: '👄 EAT', pose: 'to-mouth' },
    NAME:       { words: ['name','naam','नाम'], icon: '🏷️', hi: 'नाम', desc: 'Two fingers tapping across opposite two fingers', anim: 'anim-nod', dir: '✕ TAP', pose: 'cross-tap' },
    PHONE:      { words: ['phone','call','mobile','फ़ोन','फोन','कॉल'], icon: '📞', hi: 'फ़ोन', desc: 'Thumb & pinky held near ear and mouth', anim: 'anim-pulse', dir: '👂 EAR', pose: 'phone-ear' },
    MONEY:      { words: ['money','rupees','paise','cash','पैसे','रुपये','नकद'], icon: '💵', hi: 'पैसे', desc: 'Rub thumb across fingertips twice', anim: 'anim-shake', dir: '⇄ RUB', pose: 'pinch-rub' },
    UNDERSTOOD: { words: ['understood','understand','samajh','समझ'], icon: '💡', hi: 'समझ गया', desc: 'Index finger moving forward from temple', anim: 'anim-out', dir: '→ TEMPLE', pose: 'temple-out' },
    GOODBYE:    { words: ['bye','goodbye','again','phir','फिर','अलविदा'], icon: '👋', hi: 'फिर मिलेंगे', desc: 'Open hand waving outward', anim: 'anim-shake', dir: '👋 WAVE', pose: 'wave-hand' },
    SORRY:      { words: ['sorry','maaf','maafi','माफ़','माफ'], icon: '✊', hi: 'माफ़ कीजिए', desc: 'Closed fist circling on chest', anim: 'anim-circle', dir: '↻ CHEST', pose: 'fist-circle' },
    ATTENTION:  { words: ['attention','listen','dhyan','ध्यान','सुनो'], icon: '👀', hi: 'ध्यान दीजिए', desc: 'Both flat hands framing sides of face', anim: 'anim-pulse', dir: '👀 FOCUS', pose: 'frame-face' },
    WAIT:       { words: ['wait','ruko','minute','minutes','रुको','मिनट'], icon: '✋', hi: 'रुको', desc: 'Open palm held steady facing forward', anim: 'anim-pulse', dir: '✋ HOLD', pose: 'open-stop' },
    WHERE:      { words: ['where','kahan','कहाँ','कहां'], icon: '❓', hi: 'कहाँ', desc: 'Both palms upturned, side-to-side question', anim: 'anim-shake', dir: '⇄ ASK', pose: 'palms-up' },
    COME:       { words: ['come','aao','aaiye','आओ','आइए'], icon: '🫳', hi: 'आइए', desc: 'Open hand beckoning inward toward chest', anim: 'anim-in', dir: '← IN', pose: 'beckon-in' },
    GATE:       { words: ['gate','door','outside','bahar','गेट','दरवाजा','बाहर'], icon: '🚪', hi: 'गेट / बाहर', desc: 'Both hands swinging open like doors', anim: 'anim-out', dir: '↔ OPEN', pose: 'doors-open' },
    DELIVERY:   { words: ['delivery','order','parcel','package','zomato','swiggy','डिलीवरी','ऑर्डर'], icon: '📦', hi: 'डिलीवरी', desc: 'Both hands holding & handing parcel forward', anim: 'anim-out', dir: '→ HAND', pose: 'box-hand' },
    NEED:       { words: ['need','want','chahiye','चाहिए','ज़रूरत'], icon: '🫴', hi: 'चाहिए', desc: 'Curved palm pulled downward toward body', anim: 'anim-in', dir: '↓ PULL', pose: 'pull-down' },
    GOOD:       { words: ['good','great','accha','thik','theek','अच्छा','ठीक','बढ़िया'], icon: '👌', hi: 'अच्छा / ठीक', desc: 'Thumb & index circle / chin-to-palm out', anim: 'anim-out', dir: '✓ GOOD', pose: 'ok-hand' }
  };

  // Distinct two-handed ISL manual alphabet: [instruction, left-hand pose, right-hand pose, contact/shape type]
  var ISL_ALPHA = {
    A: ['Touch right index tip to left thumb tip', 'thumb-up', 'point', 'tip-touch'],
    B: ['Form two thumb-index circles side-by-side (binoculars)', 'circle', 'circle', 'two-circle'],
    C: ['Curve right thumb & index into an open C-arc', 'rest', 'c-arc', 'c-shape'],
    D: ['Curve right index & thumb onto upright left index', 'index-up', 'c-arc', 'd-loop'],
    E: ['Touch right index tip to upright left index tip', 'index-up', 'point', 'tip-touch'],
    F: ['Cross right index & middle over left index & middle', 'two-up', 'two-cross', 'cross'],
    G: ['Stack closed right fist directly atop closed left fist', 'fist', 'fist', 'stack'],
    H: ['Slide flat right palm across open flat left palm', 'flat-palm', 'flat-palm', 'slide'],
    I: ['Touch right index tip to left middle fingertip', 'mid-up', 'point', 'tip-touch'],
    J: ['Slide right index down left middle finger onto palm', 'flat-palm', 'point', 'trace-down'],
    K: ['Hook bent right index finger onto upright left index', 'index-up', 'hook', 'hook'],
    L: ['Lay right index finger flat across open left palm', 'flat-palm', 'index-flat', 'lay-flat'],
    M: ['Place three right fingers flat onto open left palm', 'flat-palm', 'three-down', 'three-on-palm'],
    N: ['Place two right fingers flat onto open left palm', 'flat-palm', 'two-down', 'two-on-palm'],
    O: ['Touch right index tip to left ring fingertip (O-ring)', 'ring-up', 'point', 'o-ring'],
    P: ['Circle right thumb & index onto upright left index tip', 'index-up', 'circle', 'p-loop'],
    Q: ['Hook right index into left thumb-index circle', 'circle', 'hook', 'q-hook'],
    R: ['Curve right index finger onto open left palm', 'flat-palm', 'hook', 'lay-flat'],
    S: ['Hook right little finger with left little finger', 'pinky-up', 'pinky-hook', 'hook'],
    T: ['Point right index to lower edge of left palm', 'flat-palm', 'point', 'edge-touch'],
    U: ['Point right index tip to left little fingertip', 'pinky-up', 'point', 'tip-touch'],
    V: ['Place right V-fingers (index + middle) on left palm', 'flat-palm', 'v-up', 'v-on-palm'],
    W: ['Interlock open fingers of both hands together', 'spread', 'spread', 'interlock'],
    X: ['Cross both extended index fingers in an X', 'index-up', 'index-cross', 'x-cross'],
    Y: ['Touch right index into web between left thumb & index', 'l-web', 'point', 'web-touch'],
    Z: ['Rest right fingertips against upright left palm', 'flat-palm', 'flat-palm', 't-touch']
  };

  var HINDI_AKSHAR = {
    'अ': 'Open palm facing forward, thumb tucked',
    'आ': 'Open palm moving slightly outward (long vowel)',
    'इ': 'Upright little finger held steady',
    'ई': 'Upright little finger lifted upward',
    'उ': 'Curved U-handshape with thumb & index',
    'ऊ': 'Curved U-handshape swept outward',
    'ए': 'Index & middle fingers together pointing up',
    'ओ': 'Rounded O-handshape held at cheek level',
    'क': 'Thumb & index pinched, three fingers raised',
    'ख': 'Open spread hand with slight outward flick',
    'ग': 'Downward curved fist with index & thumb',
    'घ': 'Curved hand held near throat/chest',
    'च': 'Curved C-handshape facing side',
    'ज': 'Index & middle fingers pointing forward',
    'ट': 'Bent index & middle hooked downward',
    'ड': 'Curved fist rotated slightly',
    'त': 'Index tip touching thumb tip, palm out',
    'द': 'Two fingers extended forward, palm down',
    'न': 'Two fingers resting on opposite palm',
    'प': 'Flat palm facing down, fingers together',
    'फ': 'Open palm flicked outward (aspirated)',
    'ब': 'Flat hand held upright, thumb tucked',
    'भ': 'Both palms cupped slightly forward',
    'म': 'Three fingers resting on opposite palm',
    'य': 'Thumb & little finger extended (Y-frame)',
    'र': 'Crossed index & middle fingers',
    'ल': 'Thumb & index forming an L-angle',
    'व': 'Index & middle spread in a V-shape',
    'श': 'Flat hand sweeping gently side-to-side',
    'स': 'Closed fist with thumb across fingers',
    'ह': 'Flat palm sliding across opposite palm'
  };

  var WORD_TO_GLOSS = {};
  Object.keys(ISL_SIGNS).forEach(function (g) {
    ISL_SIGNS[g].words.forEach(function (w) { WORD_TO_GLOSS[w] = g; });
  });

  function renderFlashcardSvg(item) {
    var label = item.badge || item.gloss.slice(0, 3);
    var shape = item.shape || 'word';
    var accent = item.isAlpha ? '#6655D9' : '#0F6B48';
    var left = '#20233B', right = accent;
    var body = '';

    if (shape === 'two-circle') {
      body = '<circle cx="24" cy="38" r="11" fill="none" stroke="' + left + '" stroke-width="3.5"/>' +
             '<circle cx="44" cy="38" r="11" fill="none" stroke="' + right + '" stroke-width="3.5"/>';
    } else if (shape === 'c-shape') {
      body = '<path d="M46 24 A15 15 0 1 0 46 52" fill="none" stroke="' + right + '" stroke-width="5" stroke-linecap="round"/>';
    } else if (shape === 'x-cross' || shape === 'cross') {
      body = '<line x1="20" y1="22" x2="48" y2="52" stroke="' + left + '" stroke-width="4.5" stroke-linecap="round"/>' +
             '<line x1="48" y1="22" x2="20" y2="52" stroke="' + right + '" stroke-width="4.5" stroke-linecap="round"/>';
    } else if (shape === 'slide' || shape === 't-touch') {
      body = '<rect x="14" y="42" width="40" height="12" rx="5" fill="' + left + '" opacity="0.22" stroke="' + left + '" stroke-width="2.5"/>' +
             '<rect x="20" y="24" width="28" height="12" rx="5" fill="' + right + '" opacity="0.3" stroke="' + right + '" stroke-width="2.5"/>' +
             '<path d="M22 20 L46 20 M42 16 L46 20 L42 24" fill="none" stroke="' + right + '" stroke-width="2.2" stroke-linecap="round"/>';
    } else if (shape === 'interlock') {
      body = '<path d="M18 28 L34 42 M24 24 L40 38 M30 22 L46 36" stroke="' + left + '" stroke-width="3.5" stroke-linecap="round"/>' +
             '<path d="M50 28 L34 42 M44 24 L28 38 M38 22 L22 36" stroke="' + right + '" stroke-width="3.5" stroke-linecap="round"/>';
    } else if (shape === 'o-ring' || shape === 'd-loop' || shape === 'p-loop' || shape === 'q-hook') {
      body = '<line x1="22" y1="54" x2="22" y2="22" stroke="' + left + '" stroke-width="4" stroke-linecap="round"/>' +
             '<circle cx="38" cy="34" r="10" fill="none" stroke="' + right + '" stroke-width="3.5"/>' +
             '<circle cx="22" cy="22" r="3" fill="' + right + '"/>';
    } else if (shape === 'stack') {
      body = '<rect x="20" y="42" width="28" height="16" rx="6" fill="' + left + '" opacity="0.25" stroke="' + left + '" stroke-width="2.5"/>' +
             '<rect x="20" y="22" width="28" height="16" rx="6" fill="' + right + '" opacity="0.3" stroke="' + right + '" stroke-width="2.5"/>';
    } else if (shape === 'web-touch') {
      body = '<path d="M18 52 L18 24 M18 44 L34 32" stroke="' + left + '" stroke-width="4.5" stroke-linecap="round"/>' +
             '<line x1="50" y1="26" x2="26" y2="38" stroke="' + right + '" stroke-width="4" stroke-linecap="round"/>' +
             '<circle cx="26" cy="38" r="3.5" fill="' + right + '"/>';
    } else if (shape === 'v-on-palm') {
      body = '<rect x="14" y="44" width="40" height="12" rx="5" fill="' + left + '" opacity="0.22" stroke="' + left + '" stroke-width="2.5"/>' +
             '<path d="M34 44 L24 22 M34 44 L44 22" stroke="' + right + '" stroke-width="4" stroke-linecap="round"/>';
    } else if (shape === 'two-on-palm' || shape === 'three-on-palm' || shape === 'lay-flat') {
      var cnt = shape === 'three-on-palm' ? 3 : (shape === 'two-on-palm' ? 2 : 1);
      var lines = '';
      for (var k = 0; k < cnt; k++) lines += '<line x1="' + (26 + k * 8) + '" y1="22" x2="' + (26 + k * 8) + '" y2="42" stroke="' + right + '" stroke-width="3.8" stroke-linecap="round"/>';
      body = '<rect x="14" y="42" width="40" height="13" rx="5" fill="' + left + '" opacity="0.22" stroke="' + left + '" stroke-width="2.5"/>' + lines;
    } else if (shape === 'hook' || shape === 'trace-down' || shape === 'tip-touch' || shape === 'edge-touch') {
      body = '<line x1="22" y1="54" x2="22" y2="24" stroke="' + left + '" stroke-width="4.5" stroke-linecap="round"/>' +
             '<path d="M48 28 Q34 22 24 28" fill="none" stroke="' + right + '" stroke-width="4" stroke-linecap="round"/>' +
             '<circle cx="24" cy="28" r="3" fill="' + right + '"/>';
    } else {
      // Hindi akshar or word flashcard
      body = '<rect x="14" y="22" width="40" height="36" rx="10" fill="' + accent + '" opacity="0.16" stroke="' + accent + '" stroke-width="2"/>' +
             '<text x="34" y="47" text-anchor="middle" font-family="Inter,Noto Sans Devanagari,sans-serif" font-size="22" font-weight="800" fill="#20233B">' + label + '</text>';
    }

    return '<svg viewBox="0 0 68 68" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      body +
      '<rect x="2" y="2" width="24" height="16" rx="6" fill="#20233B"/>' +
      '<text x="14" y="13" text-anchor="middle" font-family="Inter,Noto Sans Devanagari,sans-serif" font-size="10" font-weight="800" fill="#FFFFFF">' + label + '</text>' +
      '</svg>';
  }

  function textToIslSequence(text) {
    var clean = String(text || '').toLowerCase().replace(/[?!.,।:;'"()]/g, ' ').trim();
    if (!clean) return [{ gloss: 'HELLO', icon: '🙏', hi: 'नमस्ते', desc: ISL_SIGNS.HELLO.desc, anim: 'anim-nod', dir: '↕ BOW', badge: '🙏', shape: 'word' }];
    var raw = clean.split(/\s+/), seq = [];
    raw.forEach(function (tok) {
      if (!tok || ISL_STOP[tok]) return;
      var g = WORD_TO_GLOSS[tok];
      if (g) {
        var s = ISL_SIGNS[g];
        seq.push({ gloss: g, icon: s.icon, hi: s.hi, desc: s.desc, anim: s.anim, dir: s.dir, badge: s.icon, shape: 'word' });
      } else if (/[\u0900-\u097F]/.test(tok)) {
        var akshars = tok.match(/(क्ष|ज्ञ|[\u0900-\u097F][\u093E-\u094D\u0902\u0903]?)/g) || [tok];
        akshars.forEach(function (ak) {
          var keyChar = (ak.indexOf('क्ष') === 0) ? 'क्ष' : (ak.indexOf('ज्ञ') === 0 ? 'ज्ञ' : ak.charAt(0));
          var hexKey = keyChar.split('').map(function (c) { return 'u' + c.charCodeAt(0).toString(16).padStart(4, '0'); }).join('_');
          var hint = HINDI_AKSHAR[keyChar] || ('Devanagari akshar "' + ak + '"');
          seq.push({
            gloss: ak, icon: ak, hi: 'अक्षर "' + ak + '"',
            desc: hint, anim: 'anim-pulse', dir: 'हिन्दी', isAlpha: true, isHindi: true,
            hindiKey: hexKey, badge: ak, shape: 'akshar'
          });
        });
      } else {
        var chars = tok.replace(/[^a-z0-9]/g, '').toUpperCase().split('');
        chars.forEach(function (ch) {
          var a = ISL_ALPHA[ch];
          seq.push({
            gloss: ch, icon: ch, hi: 'Letter ' + ch,
            desc: a ? a[0] : ('Number "' + ch + '" — raise ' + ch + ' finger(s)'),
            anim: 'anim-pulse', dir: 'ISL:' + ch, isAlpha: true, badge: ch,
            shape: a ? a[3] : 'word'
          });
        });
      }
    });
    if (!seq.length) seq.push({ gloss: 'HELLO', icon: '🙏', hi: 'नमस्ते', desc: ISL_SIGNS.HELLO.desc, anim: 'anim-nod', dir: '↕ BOW', badge: '🙏', shape: 'word' });
    return seq.slice(0, 80);
  }

  function mountIslPlayer(host, text, autoPlay) {
    if (!host) return;
    if (host._islTimer) { clearInterval(host._islTimer); host._islTimer = null; }
    host.textContent = '';
    var seq = textToIslSequence(text);
    var wrap = document.createElement('div'); wrap.className = 'isl-player';

    var stage = document.createElement('div'); stage.className = 'isl-stage';
    var gbox = document.createElement('div'); gbox.className = 'isl-glyph-box';
    var svgWrap = document.createElement('div'); svgWrap.className = 'isl-emoji'; svgWrap.style.width = '100%'; svgWrap.style.height = '100%';
    var mtag = document.createElement('span'); mtag.className = 'isl-motion-tag';
    gbox.appendChild(svgWrap); gbox.appendChild(mtag);

    var details = document.createElement('div'); details.style.minWidth = '0';
    var title = document.createElement('div'); title.className = 'isl-word-title';
    var cap = document.createElement('div'); cap.className = 'isl-caption';
    details.appendChild(title); details.appendChild(cap);
    stage.appendChild(gbox); stage.appendChild(details);

    var strip = document.createElement('div'); strip.className = 'isl-seq';
    var row = document.createElement('div');
    row.style.display = 'flex'; row.style.gap = '.5rem'; row.style.alignItems = 'center'; row.style.flexWrap = 'wrap';
    var replay = document.createElement('button'); replay.type = 'button'; replay.className = 'btn sm ghost'; replay.textContent = '↻ Replay Signs';
    var attr = document.createElement('span'); attr.className = 'isl-attr'; attr.textContent = 'ISL Sign Cards · ISLVT (doi:10.17632/98mzk82wbb.1) & Hindi ISL (Krish Bhagat, Kaggle)';
    row.appendChild(replay); row.appendChild(attr);

    var timerId = null;
    function showIndex(idx) {
      var item = seq[idx];
      gbox.className = 'isl-glyph-box ' + item.anim;
      if (item.isHindi && item.hindiKey) {
        svgWrap.innerHTML = '';
        var himg = document.createElement('img');
        himg.src = 'assets/isl-hi/' + item.hindiKey + '.jpg';
        himg.alt = 'Hindi ISL sign for ' + item.gloss;
        himg.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;';
        himg.onerror = function () { svgWrap.innerHTML = renderFlashcardSvg(item); };
        svgWrap.appendChild(himg);
      } else if (item.isAlpha && /^[A-Z1-9]$/.test(item.gloss)) {
        svgWrap.innerHTML = '';
        var img = document.createElement('img');
        img.src = 'assets/isl/' + item.gloss + '.jpg';
        img.alt = 'ISL sign for ' + item.gloss;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;';
        img.onerror = function () { svgWrap.innerHTML = renderFlashcardSvg(item); };
        svgWrap.appendChild(img);
      } else {
        svgWrap.innerHTML = renderFlashcardSvg(item);
      }
      mtag.textContent = item.dir;
      title.textContent = item.gloss + ' · ' + item.hi;
      cap.textContent = item.desc;
      cardEls.forEach(function (el, i) { el.classList.toggle('active', i === idx); });
    }

    var cardEls = seq.map(function (item, idx) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'isl-card-mini';
      b.textContent = (item.isAlpha ? '' : item.icon + ' ') + item.gloss;
      b.onclick = function () {
        if (timerId) clearInterval(timerId);
        showIndex(idx);
      };
      strip.appendChild(b);
      return b;
    });

    wrap.appendChild(stage); wrap.appendChild(strip); wrap.appendChild(row);
    host.appendChild(wrap);

    function run() {
      if (host._islTimer) { clearInterval(host._islTimer); host._islTimer = null; }
      var i = 0;
      showIndex(0);
      if (seq.length <= 1) return;
      host._islTimer = setInterval(function () {
        i += 1;
        if (i >= seq.length) { clearInterval(host._islTimer); host._islTimer = null; return; }
        showIndex(i);
      }, 1300);
    }

    replay.onclick = run;
    if (autoPlay) run();
    else showIndex(0);
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

    listen({ lang: prefs.lang }, function (t) {
      setTranscript(t, true);
      if (t) {
        pending = { text: t, confidence: null };
        $('#speak-actions').classList.remove('hidden');
      }
    })
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

  /* ---------------- QR Pairing & Nearby Token ---------------- */
  function renderPairingQr(el, code) {
    if (!el) return;
    var size = 156, cells = 11, cell = Math.floor(size / cells), seed = 0;
    for (var i = 0; i < code.length; i++) seed = (seed * 31 + code.charCodeAt(i)) & 0xfffffff;
    var svg = ['<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">'];
    svg.push('<rect width="' + size + '" height="' + size + '" fill="#FFFFFF"/>');
    for (var r = 0; r < cells; r++) {
      for (var c = 0; c < cells; c++) {
        var corner = (r < 3 && c < 3) || (r < 3 && c >= cells - 3) || (r >= cells - 3 && c < 3);
        var border = corner && (r === 0 || r === 2 || r === cells - 1 || r === cells - 3 || c === 0 || c === 2 || c === cells - 1 || c === cells - 3 || (r === 1 && c === 1) || (r === 1 && c === cells - 2) || (r === cells - 2 && c === 1));
        var bit = ((seed >> ((r * cells + c) % 24)) ^ (r * 7 + c * 13)) & 1;
        if (border || (!corner && bit)) {
          svg.push('<rect x="' + (c * cell) + '" y="' + (r * cell) + '" width="' + (cell - 1) + '" height="' + (cell - 1) + '" rx="2" fill="#20233B"/>');
        }
      }
    }
    svg.push('</svg>');
    el.innerHTML = svg.join('');
  }

  var expiryTimer = null;
  function startNearbyToken(code) {
    if ($('#nearby-code-display')) $('#nearby-code-display').textContent = code;
    renderPairingQr($('#nearby-qr'), code);
    var secs = 300;
    if (expiryTimer) clearInterval(expiryTimer);
    expiryTimer = setInterval(function () {
      secs = Math.max(0, secs - 1);
      var m = String(Math.floor(secs / 60)).padStart(2, '0'), s = String(secs % 60).padStart(2, '0');
      if ($('#nearby-expiry')) $('#nearby-expiry').textContent = secs ? ('Temporary token · Expires in ' + m + ':' + s) : 'Token expired — generate a new code';
      if (!secs) clearInterval(expiryTimer);
    }, 1000);
  }

  /* ---------------- wiring ---------------- */
  function wire() {
    $$('[data-nav]').forEach(function (b) {
      b.onclick = function (e) {
        if (b.tagName === 'A') e.preventDefault();
        show(b.getAttribute('data-nav'));
      };
    });

    // preferences & accessibility
    if ($('#rng-font')) $('#rng-font').oninput = function () {
      prefs.fontScale = Number(this.value) / 100;
      $('#out-font').value = this.value + '%';
      document.documentElement.style.setProperty('--fs', (16 * prefs.fontScale).toFixed(2) + 'px');
    };
    if ($('#rng-rate')) $('#rng-rate').oninput = function () {
      prefs.rate = Number(this.value);
      $('#out-rate').value = Number(this.value).toFixed(1) + '\u00d7';
    };
    if ($('#chk-contrast')) $('#chk-contrast').onchange = function () {
      document.documentElement.setAttribute('data-contrast', this.checked ? 'high' : 'normal');
      prefs.contrast = this.checked ? 'high' : 'normal';
    };
    if ($('#studio-lang')) {
      $('#studio-lang').onchange = function () {
        prefs.lang = this.value;
        applyPrefs();
        announce('Language switched to ' + this.options[this.selectedIndex].text);
      };
    }
    if ($('#btn-save-prefs')) $('#btn-save-prefs').onclick = function () {
      prefs.name = $('#f-name').value.trim();
      prefs.lang = $('#sel-lang').value;
      prefs.input = [];
      if ($('#chk-speak').checked) prefs.input.push('speech');
      if ($('#chk-sign').checked) prefs.input.push('sign');
      if ($('#chk-type').checked) prefs.input.push('text');
      prefs.output = [];
      if ($('#chk-text').checked) prefs.output.push('text');
      if ($('#chk-out-sign') && $('#chk-out-sign').checked) prefs.output.push('sign');
      if ($('#chk-audio').checked) prefs.output.push('audio');
      prefs.haptics = $('#chk-haptics').checked;
      prefs.fontScale = Number($('#rng-font').value) / 100;
      prefs.rate = Number($('#rng-rate').value);
      if (!prefs.input.length) prefs.input = ['text'];
      if (!prefs.output.length) prefs.output = ['text'];
      applyPrefs();
      show('home');
      announce('Preferences saved.');
    };

    // nearby & home
    if ($('#btn-home-solo')) $('#btn-home-solo').onclick = function () {
      joinRoom('SANKET-42');
      seedDemo();
      show('session');
    };
    if ($('#btn-create')) $('#btn-create').onclick = function () {
      var code = 'SANKET-' + Math.floor(10 + Math.random() * 89);
      startNearbyToken(code);
      if ($('#room-code')) $('#room-code').value = code;
      if ($('#side-status-text')) $('#side-status-text').textContent = 'Pairing: ' + code;
    };
    if ($('#btn-enter-created')) $('#btn-enter-created').onclick = function () {
      var code = ($('#nearby-code-display') && $('#nearby-code-display').textContent) || 'SANKET-42';
      if (joinRoom(code)) { seedDemo(); show('session'); }
    };
    if ($('#join-form')) $('#join-form').onsubmit = function (e) {
      e.preventDefault();
      var v = $('#room-code').value.trim().toUpperCase();
      if (!v) { if ($('#join-err')) $('#join-err').textContent = 'Enter a pairing code first.'; $('#room-code').focus(); return; }
      if ($('#join-err')) $('#join-err').textContent = '';
      if ($('#accept-banner')) {
        $('#accept-text').textContent = 'Ready to connect to session "' + v + '". Both participants must accept.';
        $('#accept-banner').classList.remove('hidden');
      } else if (joinRoom(v)) { show('session'); }
    };
    if ($('#btn-accept-conn')) $('#btn-accept-conn').onclick = function () {
      var v = ($('#room-code') && $('#room-code').value.trim().toUpperCase()) || 'SANKET-42';
      $('#accept-banner').classList.add('hidden');
      if (joinRoom(v)) { show('session'); announce('Connected to nearby session ' + v); }
    };
    if ($('#btn-decline-conn')) $('#btn-decline-conn').onclick = function () {
      $('#accept-banner').classList.add('hidden');
      announce('Connection declined.');
    };
    if ($('#btn-solo')) $('#btn-solo').onclick = function () {
      var code = 'SOLO-' + Math.floor(100 + Math.random() * 900);
      joinRoom(code);
      seedDemo();
      show('session');
    };

    // session controls
    if ($('#btn-leave')) $('#btn-leave').onclick = function () { leaveRoom(); show('home'); };
    if ($('#btn-export')) $('#btn-export').onclick = exportTranscript;
    if ($('#btn-toggle-captions')) $('#btn-toggle-captions').onclick = function () {
      prefs.captions = !prefs.captions;
      this.textContent = prefs.captions ? 'CC Captions: On' : 'CC Captions: Off';
      this.setAttribute('aria-pressed', prefs.captions ? 'true' : 'false');
      if ($('#feed-card')) $('#feed-card').classList.toggle('hidden', !prefs.captions);
    };
    if ($('#btn-pause-session')) $('#btn-pause-session').onclick = function () {
      paused = !paused;
      this.textContent = paused ? '▶ Resume' : '⏸ Pause';
      if ($('#conn-badge')) $('#conn-badge').textContent = paused ? '⏸ Paused' : '● Nearby Session';
      if (paused && listening) stopListen();
      announce(paused ? 'Session paused.' : 'Session resumed.');
    };

    // tabs
    if ($('#tab-speak')) $('#tab-speak').onclick = function () { tab('speak'); };
    if ($('#tab-type')) $('#tab-type').onclick = function () { tab('type'); if ($('#txt-input')) $('#txt-input').focus(); };
    if ($('#tab-sign')) $('#tab-sign').onclick = function () { tab('sign'); };

    // speak
    if ($('#btn-mic')) $('#btn-mic').onclick = function () { if (listening) { stopListen(); return; } startMic(); };
    if ($('#btn-send-speak')) $('#btn-send-speak').onclick = function () {
      var fallback = ($('#transcript') && $('#transcript').textContent) || '';
      if (fallback === 'Your spoken words will appear here…' || fallback === 'Listening…') fallback = '';
      var txt = (pending && pending.text) || fallback.trim();
      if (!txt) { announce('Nothing to send yet.'); return; }
      if (listening) stopListen();
      send({ text: txt, modality: 'speech', confidence: (pending && pending.confidence) || null });
      resetSpeak();
      tab('speak');
    };
    if ($('#btn-edit-speak')) $('#btn-edit-speak').onclick = function () {
      if (pending && pending.text && $('#txt-input')) $('#txt-input').value = pending.text;
      tab('type'); if ($('#txt-input')) $('#txt-input').focus();
    };
    if ($('#btn-clear-speak')) $('#btn-clear-speak').onclick = resetSpeak;

    // type
    if ($('#btn-send-type')) $('#btn-send-type').onclick = function () {
      var v = $('#txt-input').value.trim();
      if (!v) { announce('Type a message first.'); $('#txt-input').focus(); return; }
      send({ text: v, modality: 'text', confidence: null });
      $('#txt-input').value = '';
    };
    if ($('#btn-speak-type')) $('#btn-speak-type').onclick = function () {
      var v = $('#txt-input').value.trim();
      if (v) speak(v, prefs.lang);
    };

    // sign camera
    if ($('#btn-cam')) $('#btn-cam').onclick = startCamera;
    if ($('#btn-cam-send')) $('#btn-cam-send').onclick = function () {
      var g = $('#sign-guess');
      var shape = (g && g.dataset && g.dataset.shape) || (g && g.textContent) || '';
      var st = $('#sign-stab');
      var stab = (st && st.dataset && st.dataset.stability) || '80';
      if (!shape) return;
      send({
        text: (prefs.lang === 'hi-IN' ? 'हस्त मुद्रा: ' : 'Handshape: ') + shape + ' (' + stab + '%)',
        modality: 'sign-heuristic', confidence: Number(stab) / 100
      });
    };

    // accuracy lab
    if ($('#btn-lab-calc')) $('#btn-lab-calc').onclick = function () {
      var ref = ($('#lab-ref') && $('#lab-ref').value) || '';
      var hyp = ($('#lab-hyp') && $('#lab-hyp').value) || '';
      var w = words(ref).length;
      var d = lev(words(ref), words(hyp));
      var wer = w ? (d / w) * 100 : 0;
      var acc = accuracy(ref, hyp);
      if ($('#lab-result')) {
        $('#lab-result').textContent = 'WER: ' + wer.toFixed(1) + '% · Accuracy: ' + acc + '%';
        $('#lab-result').className = 'chip ' + (acc >= 85 ? 'ok' : (acc >= 60 ? 'warn' : 'bad'));
      }
    };

    document.addEventListener('keydown', function (e) {
      if (!e.altKey) return;
      if (e.key === 'm' && room && $('#btn-mic')) { e.preventDefault(); $('#btn-mic').click(); }
      if (e.key === 's' && room && $('#btn-send-speak')) { e.preventDefault(); $('#btn-send-speak').click(); }
    });
  }

  function seedDemo() {
    if (msgs.length) return;
    var now = Date.now();
    var demo = [
      { id: 'demo1', from: 'guest-asha', name: 'Asha', lang: 'hi-IN', text: '\u0928\u092e\u0938\u094d\u0924\u0947, \u092e\u0941\u091d\u0947 \u0921\u0949\u0915\u094d\u091f\u0930 \u0915\u0947 \u092a\u093e\u0938 \u091c\u093e\u0928\u093e \u0939\u0948', modality: 'speech', confidence: 0.94, ts: now - 240000 },
      { id: 'demo2', from: ME, name: prefs.name || 'Guest', lang: prefs.lang, text: prefs.lang === 'hi-IN' ? '\u092e\u0926\u0926' : 'Help', modality: 'sign-card', gloss: 'madad', confidence: null, ts: now - 120000 }
    ];
    demo.forEach(function (m) { msgs.push(m); });
    store.set('room.' + room, msgs);
    render();
  }

  function boot() {
    applyPrefs();
    buildGloss();
    wire();
    startNearbyToken('SANKET-42');
    joinRoom('SANKET-42');
    seedDemo();
    show('home');
    announce('Sanket ready. Choose Connect Nearby or Live Conversation.');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

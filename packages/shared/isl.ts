export interface IslSignDef {
  words: string[];
  icon: string;
  hi: string;
  desc: string;
  anim: string;
  dir: string;
}

export interface IslSequenceToken {
  gloss: string;
  icon: string;
  hi: string;
  desc: string;
  anim: string;
  dir: string;
}

export const ISL_STOP_WORDS = new Set([
  'is', 'am', 'are', 'was', 'were', 'the', 'a', 'an', 'to', 'for', 'of', 'in', 'on', 'at',
  'i', 'me', 'my', 'हूँ', 'हूं', 'है', 'हैं', 'था', 'थी', 'को', 'का', 'की', 'के', 'में', 'से', 'पर',
]);

export const ISL_SIGNS: Record<string, IslSignDef> = {
  HELLO: { words: ['hello', 'hi', 'namaste', 'नमस्ते', 'नमस्कार'], icon: '🙏', hi: 'नमस्ते', desc: 'Join both palms at chest & bow slightly', anim: 'anim-nod', dir: '↕ BOW' },
  YES: { words: ['yes', 'haan', 'ok', 'okay', 'हाँ', 'हां', 'ठीक'], icon: '👍', hi: 'हाँ', desc: 'Closed fist nodding forward twice', anim: 'anim-nod', dir: '↓ NOD' },
  NO: { words: ['no', 'not', 'nahi', 'nahin', 'नहीं', 'ना'], icon: '☝️', hi: 'नहीं', desc: 'Index finger sweeping side-to-side', anim: 'anim-shake', dir: '⇄ SHAKE' },
  THANK_YOU: { words: ['thanks', 'thank', 'thankyou', 'dhanyavad', 'dhanyavaad', 'शुक्रिया', 'धन्यवाद'], icon: '🤲', hi: 'धन्यवाद', desc: 'Fingertips from chin moving outward', anim: 'anim-out', dir: '→ OUT' },
  PLEASE: { words: ['please', 'kripya', 'कृपया'], icon: '🫶', hi: 'कृपया', desc: 'Flat palm circling gently on chest', anim: 'anim-circle', dir: '↻ CIRCLE' },
  HELP: { words: ['help', 'madad', 'बचाओ', 'मदद', 'सहायता'], icon: '🆘', hi: 'मदद', desc: 'Fist resting on flat palm, lifted together', anim: 'anim-lift', dir: '↑ LIFT' },
  WATER: { words: ['water', 'paani', 'pani', 'पानी', 'जल'], icon: '💧', hi: 'पानी', desc: 'W-handshape tapped near lips twice', anim: 'anim-nod', dir: '👄 LIPS' },
  DOCTOR: { words: ['doctor', 'hospital', 'clinic', 'डॉक्टर', 'अस्पताल'], icon: '🩺', hi: 'डॉक्टर', desc: 'Two fingers tapping wrist pulse', anim: 'anim-pulse', dir: '💓 PULSE' },
  UNDERSTOOD: { words: ['understood', 'understand', 'samajh', 'समझ'], icon: '💡', hi: 'समझ गया', desc: 'Index finger moving forward from temple', anim: 'anim-out', dir: '→ TEMPLE' },
  GOODBYE: { words: ['bye', 'goodbye', 'again', 'phir', 'फिर', 'अलविदा'], icon: '👋', hi: 'फिर मिलेंगे', desc: 'Open hand waving outward while closing', anim: 'anim-shake', dir: '👋 WAVE' },
  SORRY: { words: ['sorry', 'maaf', 'maafi', 'माफ़', 'माफ'], icon: '✊', hi: 'माफ़ कीजिए', desc: 'Closed fist circling on chest', anim: 'anim-circle', dir: '↻ CHEST' },
  ATTENTION: { words: ['attention', 'listen', 'dhyan', 'ध्यान', 'सुनो'], icon: '👀', hi: 'ध्यान दीजिए', desc: 'Both flat hands framing sides of face', anim: 'anim-pulse', dir: '👀 FOCUS' },
  WAIT: { words: ['wait', 'ruko', 'minute', 'minutes', 'रुको', 'मिनट'], icon: '✋', hi: 'रुको', desc: 'Open palm held steady facing forward', anim: 'anim-pulse', dir: '✋ HOLD' },
  WHERE: { words: ['where', 'kahan', 'कहाँ', 'कहां'], icon: '❓', hi: 'कहाँ', desc: 'Both palms upturned, side-to-side question', anim: 'anim-shake', dir: '⇄ ASK' },
  COME: { words: ['come', 'aao', 'aaiye', 'आओ', 'आइए'], icon: '🫳', hi: 'आइए', desc: 'Open hand beckoning inward toward chest', anim: 'anim-in', dir: '← IN' },
  GATE: { words: ['gate', 'door', 'outside', 'bahar', 'गेट', 'दरवाजा', 'बाहर'], icon: '🚪', hi: 'गेट / बाहर', desc: 'Both hands swinging open like doors', anim: 'anim-out', dir: '↔ OPEN' },
  DELIVERY: { words: ['delivery', 'order', 'parcel', 'package', 'zomato', 'swiggy', 'डिलीवरी', 'ऑर्डर'], icon: '📦', hi: 'डिलीवरी', desc: 'Both hands holding & handing parcel forward', anim: 'anim-out', dir: '→ HAND' },
  NEED: { words: ['need', 'want', 'chahiye', 'चाहिए', 'ज़रूरत'], icon: '🫴', hi: 'चाहिए', desc: 'Curved palm pulled downward toward body', anim: 'anim-in', dir: '↓ PULL' },
  GOOD: { words: ['good', 'great', 'accha', 'अच्छा', 'बढ़िया'], icon: '👌', hi: 'अच्छा', desc: 'Thumb & index circle / chin-to-palm out', anim: 'anim-out', dir: '✓ GOOD' },
};

const WORD_TO_GLOSS: Record<string, string> = {};
Object.entries(ISL_SIGNS).forEach(([gloss, def]) => {
  def.words.forEach((w) => { WORD_TO_GLOSS[w] = gloss; });
});

export function textToIslSequence(text: string): IslSequenceToken[] {
  const clean = String(text || '').toLowerCase().replace(/[?!.,।:;'"()]/g, ' ').trim();
  if (!clean) return [{ gloss: 'HELLO', ...ISL_SIGNS.HELLO }];
  const seq: IslSequenceToken[] = [];
  for (const tok of clean.split(/\s+/)) {
    if (!tok || ISL_STOP_WORDS.has(tok)) continue;
    const g = WORD_TO_GLOSS[tok];
    if (g) {
      seq.push({ gloss: g, ...ISL_SIGNS[g] });
    } else {
      const chars = tok.replace(/[^a-z0-9]/g, '').slice(0, 6).toUpperCase().split('');
      if (chars.length) {
        chars.forEach((ch) => seq.push({
          gloss: ch, icon: '🤟', hi: `अक्षर ${ch}`,
          desc: `ISL Fingerspelling letter "${ch}"`, anim: 'anim-pulse', dir: `FS:${ch}`,
        }));
      } else {
        seq.push({ gloss: tok.slice(0, 10).toUpperCase(), icon: '💬', hi: tok, desc: `Visual word card: ${tok}`, anim: 'anim-pulse', dir: 'WORD' });
      }
    }
  }
  return seq.length ? seq.slice(0, 10) : [{ gloss: 'HELLO', ...ISL_SIGNS.HELLO }];
}

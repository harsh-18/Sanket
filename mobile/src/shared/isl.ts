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

const ISL_ALPHA_DESC: Record<string, string> = {
  A: 'Touch right index tip to left thumb tip',
  B: 'Form two thumb-index circles side-by-side',
  C: 'Curve right thumb & index into a C-arc',
  D: 'Curve right index & thumb onto upright left index',
  E: 'Touch right index tip to upright left index tip',
  F: 'Cross right index & middle over left two fingers',
  G: 'Stack closed right fist atop closed left fist',
  H: 'Slide flat right palm across flat left palm',
  I: 'Touch right index tip to left middle fingertip',
  J: 'Slide right index down left middle finger onto palm',
  K: 'Hook bent right index onto upright left index',
  L: 'Lay right index finger flat across left palm',
  M: 'Place three right fingers flat onto left palm',
  N: 'Place two right fingers flat onto left palm',
  O: 'Touch right index tip to left ring fingertip',
  P: 'Circle right thumb & index onto left index tip',
  Q: 'Hook right index into left thumb-index circle',
  R: 'Curve right index onto open left palm',
  S: 'Hook right little finger with left little finger',
  T: 'Point right index to lower edge of left palm',
  U: 'Point right index tip to left little fingertip',
  V: 'Place right V-fingers on left palm',
  W: 'Interlock open fingers of both hands',
  X: 'Cross both extended index fingers in an X',
  Y: 'Touch right index into web of left thumb & index',
  Z: 'Rest right fingertips against upright left palm',
};

export function textToIslSequence(text: string): IslSequenceToken[] {
  const clean = String(text || '').toLowerCase().replace(/[?!.,।:;'"()]/g, ' ').trim();
  if (!clean) return [{ gloss: 'HELLO', ...ISL_SIGNS.HELLO }];
  const seq: IslSequenceToken[] = [];
  for (const tok of clean.split(/\s+/)) {
    if (!tok || ISL_STOP_WORDS.has(tok)) continue;
    const g = WORD_TO_GLOSS[tok];
    if (g) {
      seq.push({ gloss: g, ...ISL_SIGNS[g] });
    } else if (/[\u0900-\u097F]/.test(tok)) {
      const akshars = tok.match(/(क्ष|ज्ञ|[\u0900-\u097F][\u093E-\u094D\u0902\u0903]?)/g) || [tok];
      akshars.forEach((ak) => seq.push({
        gloss: ak, icon: ak, hi: `अक्षर "${ak}"`,
        desc: `Hindi Akshar "${ak}" ISL flashcard`, anim: 'anim-pulse', dir: 'हिन्दी',
      }));
    } else {
      const chars = tok.replace(/[^a-z0-9]/g, '').toUpperCase().split('');
      chars.forEach((ch) => seq.push({
        gloss: ch, icon: ch, hi: `Letter ${ch}`,
        desc: ISL_ALPHA_DESC[ch] || `Number "${ch}" handshape`, anim: 'anim-pulse', dir: `ISL:${ch}`,
      }));
    }
  }
  return seq.length ? seq.slice(0, 80) : [{ gloss: 'HELLO', ...ISL_SIGNS.HELLO }];
}

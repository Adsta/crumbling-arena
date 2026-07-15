// SOUND SHIT. semua digenerate webaudio, males nyari file wav

var actx = null;
function audio() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return actx; }
function beep(freq, dur, type, vol, slide) {
  var ac = audio(); if (!ac) return;
  var o = ac.createOscillator(), g = ac.createGain();
  o.type = type || 'square'; o.frequency.value = freq;
  if (slide) o.frequency.linearRampToValueAtTime(slide, ac.currentTime + dur);
  g.gain.value = vol || 0.05;
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.connect(g); g.connect(ac.destination);
  o.start(); o.stop(ac.currentTime + dur);
}
function noiseHit(dur, vol) {
  var ac = audio(); if (!ac) return;
  var n = ac.sampleRate * dur, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
  for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  var s = ac.createBufferSource(); s.buffer = buf;
  var g = ac.createGain(); g.gain.value = vol || 0.08;
  s.connect(g); g.connect(ac.destination); s.start();
}
const sfx = {
  shoot:   () => beep(680, 0.08, 'square', 0.03, 220),
  hook:    () => beep(180, 0.25, 'sawtooth', 0.05, 90),
  hit:     () => { beep(140, 0.1, 'square', 0.06); noiseHit(0.06, 0.05); },
  crumble: () => noiseHit(0.35, 0.06),
  dash:    () => beep(300, 0.12, 'sine', 0.05, 600),
  charge:  () => beep(220, 0.7, 'sine', 0.03, 880),
  boom:    () => { noiseHit(0.4, 0.12); beep(80, 0.3, 'sine', 0.1, 40); },
  fall:    () => beep(500, 0.7, 'sine', 0.07, 60),
  heal:    () => beep(520, 0.15, 'sine', 0.04, 760),
  spin:    () => beep(340, 0.3, 'sawtooth', 0.03, 340),
  round:   () => { beep(440, 0.15, 'square', 0.05); setTimeout(() => beep(660, 0.25, 'square', 0.05), 160); },
};
// TODO volume slider kapan2

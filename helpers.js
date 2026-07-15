// canvas setup + math helpers

var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var W = 0, H = 0, SCALE = 1;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  SCALE = Math.min(W, H) / 1040;
}
window.addEventListener('resize', resize);
resize();

const TAU = Math.PI * 2;
function randf_range(a, b) { return a + Math.random() * (b - a); }
function clamp(value, mn, mx) { return value < mn ? mn : value > mx ? mx : value; }
function dist2(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
function dist(ax, ay, bx, by) { return Math.sqrt(dist2(ax, ay, bx, by)); }
function lerp(a, b, t) { return a + (b - a) * t; }

// world <-> screen
function w2s(x, y) { return [W / 2 + x * SCALE + shake_x, H / 2 + y * SCALE + shake_y]; }
function s2w(sx, sy) { return [(sx - W / 2) / SCALE, (sy - H / 2) / SCALE]; }

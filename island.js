// pulau + mekanik runtuhnya. ini inti gamenya

const TILE_SIZE = 44;
const ISLAND_R = 430;
const GRACE_TIME = 7;
const SHRINK_RATE = 15;  // 22 kecepetan ya guys.. 15 pas
//const SHRINK_RATE = 22;

var tiles = new Map();
var shrink_radius = ISLAND_R;
var grace_timer = GRACE_TIME;

function tile_key(i, j) { return i + ',' + j; }
function build_island() {
  tiles = new Map();
  var n = Math.ceil(ISLAND_R / TILE_SIZE) + 1;
  for (var i = -n; i <= n; i++) {
    for (var j = -n; j <= n; j++) {
      var x = i * TILE_SIZE, y = j * TILE_SIZE;
      var d = Math.hypot(x, y);
      if (d + randf_range(-14, 14) > ISLAND_R) continue;
      tiles.set(tile_key(i, j), {
        i, j, x, y,
        hp: 3,
        state: 'solid',   // solid | cracked | falling | gone
        fall_t: 0,
        doom_t: -1,
        edge_d: d + randf_range(0, 26), // acak dikit biar rontoknya ga rapih
        shade: randf_range(-0.06, 0.06),
        rot: randf_range(-0.5, 0.5),
      });
    }
  }
  shrink_radius = ISLAND_R;
  grace_timer = GRACE_TIME;
}
function tile_at(x, y) {
  return tiles.get(tile_key(Math.round(x / TILE_SIZE), Math.round(y / TILE_SIZE)));
}
function is_ground(x, y) {
  var t = tile_at(x, y);
  return !!t && (t.state === 'solid' || t.state === 'cracked');
}
function drop_tile(t) {
  if (t.state === 'falling' || t.state === 'gone') return;
  t.state = 'falling'; t.fall_t = 0;
  if (Math.random() < 0.3) sfx.crumble();
}
function damage_tiles(x, y, radius, dmg) {
  var r = Math.ceil(radius / TILE_SIZE) + 1;
  var ci = Math.round(x / TILE_SIZE), cj = Math.round(y / TILE_SIZE);
  for (var i = ci - r; i <= ci + r; i++) {
    for (var j = cj - r; j <= cj + r; j++) {
      var t = tiles.get(tile_key(i, j));
      if (!t || t.state === 'falling' || t.state === 'gone') continue;
      if (dist(x, y, t.x, t.y) > radius) continue;
      t.hp -= dmg;
      if (t.hp <= 0) drop_tile(t);
      else if (t.hp <= 1.5) t.state = 'cracked';
    }
  }
}
function tiles_process(delta) {
  if (curr_state === 'play') {
    if (grace_timer > 0) grace_timer -= delta;
    else shrink_radius = Math.max(60, shrink_radius - SHRINK_RATE * delta);
  }
  for (const t of tiles.values()) {
    if (t.state === 'gone') continue;
    if (t.state === 'falling') {
      t.fall_t += delta;
      if (t.fall_t > 1.1) t.state = 'gone';
      continue;
    }
    // pinggiran: retak dulu baru jatoh biar ada warning
    if (t.doom_t >= 0) {
      t.doom_t -= delta;
      if (t.doom_t <= 0) drop_tile(t);
    } else if (t.edge_d > shrink_radius) {
      t.state = 'cracked';
      t.doom_t = randf_range(0.4, 1.0);
    }
  }
}

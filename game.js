// game state, ronde, input, main loop. file terakhir yang diload

var curr_state = 'select';   // select | countdown | play | roundend | matchend
var state_timer = 0;
var time = 0;
var player = null;
var round_num = 0;
var big_text = '', big_text_col = '#fff';
const WIN_SCORE = 12;

function start_round() {
  round_num++;
  build_island();
  projs = []; zones = []; wards = []; particles = []; dmg_popups = [];
  heroes.forEach(reset_hero);
  curr_state = 'countdown'; state_timer = 3;
  big_text = '';
  sfx.round();
}

function start_match(player_def_idx) {
  var defs = HERO_DEFS.slice();
  var p_def = defs.splice(player_def_idx, 1)[0];
  heroes = [
    new_hero(p_def, false, 0),
    new_hero(defs[0], true, 1),
    new_hero(defs[1], true, 2),
  ];
  player = heroes[0];
  heroes.forEach(h => h.score = 0);
  round_num = 0;
  kill_feed = [];
  start_round();
}

function end_round(winner) {
  curr_state = 'roundend'; state_timer = 2.6;
  if (winner) {
    winner.score += 2;
    big_text = winner.def.name + ' wins the round!';
    big_text_col = winner.def.color;
  } else {
    big_text = 'Nobody survived...'; // bisa kejadian kalo jatohnya barengan
    big_text_col = '#8b93b8';
  }
  var champ = heroes.find(h => h.score >= WIN_SCORE);
  if (champ) {
    curr_state = 'matchend'; state_timer = 0;
    big_text = champ.def.name + ' WINS THE MATCH!';
    big_text_col = champ.def.color;
  }
}


// Input Stuff
const mouse = { sx: 0, sy: 0, wx: 0, wy: 0, right: false };
const keys = {};

canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousemove', e => {
  mouse.sx = e.clientX; mouse.sy = e.clientY;
});
canvas.addEventListener('mousedown', e => {
  audio(); // browser ga mau bunyi sebelum ada gesture
  if (e.button === 2) {
    mouse.right = true;
    order_move();
  }
  if (curr_state === 'matchend') {
    curr_state = 'select';
    document.getElementById('select').style.display = 'flex';
  }
});
window.addEventListener('mouseup', e => { if (e.button === 2) mouse.right = false; });
window.addEventListener('keydown', e => {
  var k = e.key.toLowerCase();
  keys[k] = true;
  if (curr_state !== 'play' || !player || !player.alive || player.falling) return;
  var idx = { q: 0, w: 1, e: 2 }[k];
  if (idx !== undefined) try_cast(player, idx, mouse.wx, mouse.wy);
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

function order_move() {
  if (curr_state !== 'play' || !player || !player.alive || player.falling) return;
  var tx = mouse.wx, ty = mouse.wy;
  if (is_ground(tx, ty)) {
    player.move_target = { x: tx, y: ty };
    puff(tx, ty, 5, '#7fd1a8', 60, 0.35, 3);
  } else {
    // klik di void: mundurin targetnya sampe nemu tanah. INI GUA GATAU cara lebih bener :(
    for (var t = 0.9; t > 0; t -= 0.1) {
      var cx = lerp(player.x, tx, t), cy = lerp(player.y, ty, t);
      if (is_ground(cx, cy)) { player.move_target = { x: cx, y: cy }; break; }
    }
  }
}

function try_cast(h, idx, ax, ay) {
  if (h.cds[idx] > 0 || h.charge || h.dash) return;
  var ab = h.def.abilities[idx];
  ab.cast(h, ax, ay);
  h.cds[idx] = ab.cd;
  h.facing = Math.atan2(ay - h.y, ax - h.x);
}

// hero select cards
var select_div = document.getElementById('select');
var cards_div = document.getElementById('cards');
HERO_DEFS.forEach((def, i) => {
  var c = document.createElement('div');
  c.className = 'card';
  c.innerHTML =
    '<h2 style="color:' + def.color + '">' + def.name + '</h2>' +
    '<div class="role">' + def.role + '</div>' +
    def.abilities.map(a => '<div class="ab"><span class="key">' + a.key + '</span><b>' + a.name + '</b><br>' + a.desc + '</div>').join('') +
    '<div class="stats">HP ' + def.hp + ' &middot; SPD ' + def.speed + '</div>';
  c.onclick = () => {
    audio();
    select_div.style.display = 'none';
    start_match(i);
  };
  cards_div.appendChild(c);
});

function check_round_end() {
  if (curr_state !== 'play') return;
  var alive = heroes.filter(h => h.alive);
  if (alive.length <= 1) end_round(alive[0] || null);
}

function update(delta) {
  time += delta;
  if (curr_state === 'countdown') {
    state_timer -= delta;
    if (state_timer <= 0) { curr_state = 'play'; big_text = 'FIGHT!'; big_text_col = '#e8ddb5'; state_timer = 0.8; }
  } else if (curr_state === 'play') {
    if (state_timer > 0) state_timer -= delta; else big_text = big_text === 'FIGHT!' ? '' : big_text;
  } else if (curr_state === 'roundend') {
    state_timer -= delta;
    if (state_timer <= 0) start_round();
  }

  if (curr_state === 'play' || curr_state === 'roundend') {
    tiles_process(delta);
    heroes.forEach(h => hero_process(h, delta));
    update_projs(delta);
    update_zones(delta);
    check_round_end();
  } else if (curr_state === 'countdown') {
    tiles_process(0);
  }
  update_fx(delta);

  var mw = s2w(mouse.sx, mouse.sy);
  mouse.wx = mw[0]; mouse.wy = mw[1];
}


var last_t = performance.now();
function frame(now) {
  var delta = Math.min(0.05, (now - last_t) / 1000); // cap biar ga teleport kalo tab ke-minimize
  last_t = now;
  update(delta);
  draw();
  requestAnimationFrame(frame);
}
build_island(); // background buat hero select
requestAnimationFrame(frame);

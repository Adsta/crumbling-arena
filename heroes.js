// hero + skillnya. 3 dulu yang gampang, ntar nambah kalo niat

const HERO_DEFS = [
  {
    id: 'pudge', name: 'Pudge', role: 'Hook & drag them in',
    color: '#c94f6d', darker: '#7e2f44',
    hp: 135, speed: 195, radius: 23,
    ai_range: 230,
    abilities: [
      {
        key: 'Q', name: 'Meat Hook', cd: 6,
        desc: 'Skillshot hook, drags whoever it hits to you.',
        cast(h, ax, ay) {
          var a = Math.atan2(ay - h.y, ax - h.x);
          sfx.hook();
          spawn_proj({
            type: 'hook', owner: h, x: h.x, y: h.y,
            vx: Math.cos(a) * 900, vy: Math.sin(a) * 900,
            r: 15, max_dist: 520, color: '#d8d8d8',
            on_hit(coll) {
              hurt_hero(coll, 18, h);
              coll.hooked_by = h;
              add_shake(4);
            },
          });
        },
      },
      {
        key: 'W', name: 'Rot', cd: 8,
        desc: 'Poison cloud around you for 3s. Slows people and eats the ground.',
        cast(h) { h.rot_timer = 3; h.rot_tick = 0; },
      },
      {
        key: 'E', name: 'Shove', cd: 5,
        desc: 'Short dash, anyone you hit gets launched.',
        cast(h, ax, ay) {
          var a = Math.atan2(ay - h.y, ax - h.x);
          sfx.dash();
          h.dash = { vx: Math.cos(a) * 620, vy: Math.sin(a) * 620, t: 0.28, hit: new Set(), dmg: 10, kb: 460 };
        },
      },
    ],
  },
  {
    id: 'sniper', name: 'Sniper', role: 'Fragile, deadly at range',
    color: '#e0a84f', darker: '#8a6224',
    hp: 85, speed: 225, radius: 19,
    ai_range: 380,
    abilities: [
      {
        key: 'Q', name: 'Shoot', cd: 1.1,
        desc: 'Fast bullet, decent knockback. Chips the tile where it lands.',
        cast(h, ax, ay) {
          var a = Math.atan2(ay - h.y, ax - h.x);
          sfx.shoot();
          spawn_proj({
            type: 'bullet', owner: h, x: h.x, y: h.y,
            vx: Math.cos(a) * 1050, vy: Math.sin(a) * 1050,
            r: 8, max_dist: 620, dmg: 11, kb: 240, color: '#ffe9a8', tile_dmg: { r: 34, d: 0.7 },
          });
        },
      },
      {
        key: 'W', name: 'Shrapnel', cd: 8,
        desc: 'Rains shards on an area, slows and cracks the tiles.',
        cast(h, ax, ay) {
          var d = dist(h.x, h.y, ax, ay);
          if (d > 420) { var k = 420 / d; ax = h.x + (ax - h.x) * k; ay = h.y + (ay - h.y) * k; } // clamp jarak, kalo ngga bisa dari ujung ke ujung
          zones.push({ x: ax, y: ay, r: 115, life: 3.5, tick: 0, owner: h });
          sfx.crumble();
        },
      },
      {
        key: 'E', name: 'Assassinate', cd: 11,
        desc: 'Charge up for a second then fire a huge shot. Blows up the ground too.',
        cast(h, ax, ay) {
          sfx.charge();
          h.charge = { t: 0.9, ax, ay };
        },
      },
    ],
  },
  {
    id: 'juggernaut', name: 'Juggernaut', role: 'Fast melee whirlwind',
    color: '#5fb377', darker: '#316847',
    hp: 105, speed: 255, radius: 20,
    ai_range: 70,
    abilities: [
      {
        key: 'Q', name: 'Blade Fury', cd: 8,
        desc: 'Spin for 2.5s, shreds anyone near you. You move faster while spinning.',
        cast(h) { h.spin_timer = 2.5; h.spin_tick = 0; h.spin_angle = 0; sfx.spin(); },
      },
      {
        key: 'W', name: 'Swift Slash', cd: 5,
        desc: 'Dash through people and slash them on the way.',
        cast(h, ax, ay) {
          var a = Math.atan2(ay - h.y, ax - h.x);
          sfx.dash();
          h.dash = { vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, t: 0.26, hit: new Set(), dmg: 20, kb: 300 };
        },
      },
      {
        key: 'E', name: 'Healing Ward', cd: 13,
        desc: 'Drop a ward that heals you while you stand near it. Dies if its tile falls.',
        cast(h) {
          wards.push({ x: h.x, y: h.y, owner: h, life: 5, pulse: 0 });
          sfx.heal();
        },
      },
    ],
  },
];

var heroes = [];

function new_hero(def, is_bot, idx) {
  return {
    def, is_bot, idx,
    x: 0, y: 0, vx: 0, vy: 0,
    hp: def.hp, maxhp: def.hp,
    alive: true, falling: false, fall_timer: 0,
    move_target: null, facing: 0,
    cds: [0, 0, 0],
    score: 0,
    dash: null, charge: null, rot_timer: 0, rot_tick: 0, spin_timer: 0, spin_tick: 0, spin_angle: 0,
    slow_timer: 0, hooked_by: null, hurt_timer: 0,
    last_hit_by: null, last_hit_time: -99,
    ai: { think: randf_range(0, 0.3), strafe: randf_range(0, TAU), strafe_dir: 1 },
    prev_x: 0, prev_y: 0, est_vx: 0, est_vy: 0,
  };
}

function reset_hero(h, i) {
  var a = -Math.PI / 2 + i * TAU / 3;
  h.x = Math.cos(a) * 255; h.y = Math.sin(a) * 255;
  h.vx = h.vy = 0;
  h.hp = h.maxhp;
  h.alive = true; h.falling = false; h.fall_timer = 0;
  h.move_target = null;
  h.cds = [0, 0, 0];
  h.dash = null; h.charge = null; h.rot_timer = 0; h.spin_timer = 0; h.slow_timer = 0;
  h.hooked_by = null; h.last_hit_by = null; h.last_hit_time = -99;
  h.prev_x = h.x; h.prev_y = h.y;
}

function hero_process(h, delta) {
  if (!h.alive) return;

  for (var i = 0; i < 3; i++) if (h.cds[i] > 0) h.cds[i] -= delta;
  if (h.slow_timer > 0) h.slow_timer -= delta;
  if (h.hurt_timer > 0) h.hurt_timer -= delta;

  if (h.falling) {
    h.fall_timer += delta;
    h.x += h.vx * delta * 0.3; h.y += h.vy * delta * 0.3; // 0.3 biar ga ngelayang jauh, full speed jatohnya aneh
    if (h.fall_timer > 0.85) {
      var credit = (h.last_hit_by && time - h.last_hit_time < 5) ? h.last_hit_by : null;
      kill_hero(h, credit, true);
    }
    return;
  }

  // estimasi velocity buat prediksi aim bot
  h.est_vx = lerp(h.est_vx, (h.x - h.prev_x) / Math.max(delta, 0.001), 0.2);
  h.est_vy = lerp(h.est_vy, (h.y - h.prev_y) / Math.max(delta, 0.001), 0.2);
  h.prev_x = h.x; h.prev_y = h.y;

  if (curr_state === 'play' && h.is_bot) bot_think(h, delta);

  h.x += h.vx * delta; h.y += h.vy * delta;
  var damp = Math.exp(-5.5 * delta);
  h.vx *= damp; h.vy *= damp;

  // Handlcing ditarik hook, override semua gerakan lain
  if (h.hooked_by) {
    var p = h.hooked_by;
    if (!p.alive || p.falling) { h.hooked_by = null; }
    else {
      var dd = dist(h.x, h.y, p.x, p.y);
      if (dd < 62) h.hooked_by = null;
      else {
        h.x += (p.x - h.x) / dd * 950 * delta;
        h.y += (p.y - h.y) / dd * 950 * delta;
      }
      return; // selama kegantung di rantai ga usah cek tanah
    }
  }

  if (h.dash) {
    var D = h.dash;
    h.x += D.vx * delta; h.y += D.vy * delta;
    h.facing = Math.atan2(D.vy, D.vx);
    if (D.dmg) {
      for (const coll of heroes) {
        if (coll === h || !coll.alive || coll.falling || D.hit.has(coll)) continue;
        if (dist(h.x, h.y, coll.x, coll.y) < h.def.radius + coll.def.radius + 14) {
          D.hit.add(coll);
          hurt_hero(coll, D.dmg, h);
          knockback(coll, D.vx, D.vy, D.kb, h);
        }
      }
    }
    D.t -= delta;
    if (D.t <= 0) h.dash = null;
    else return; // dash bisa nyebrangin lobang, cek tanah pas selesai aja
  }

  if (h.charge) {
    var C = h.charge;
    if (!h.is_bot) { C.ax = mouse.wx; C.ay = mouse.wy; }
    h.facing = Math.atan2(C.ay - h.y, C.ax - h.x);
    C.t -= delta;
    if (C.t <= 0) {
      var a = h.facing;
      sfx.boom(); add_shake(6);
      spawn_proj({
        type: 'snipe', owner: h, x: h.x, y: h.y,
        vx: Math.cos(a) * 1300, vy: Math.sin(a) * 1300,
        r: 11, max_dist: 900, dmg: 32, kb: 560, color: '#ff8844', tile_dmg: { r: 60, d: 2.2 },
      });
      knockback(h, -Math.cos(a), -Math.sin(a), 130, null); // recoil
      h.charge = null;
    }
  }

  if (h.rot_timer > 0) {
    h.rot_timer -= delta; h.rot_tick -= delta;
    if (h.rot_tick <= 0) {
      h.rot_tick = 0.33;
      for (const coll of heroes) {
        if (coll === h || !coll.alive || coll.falling) continue;
        if (dist(h.x, h.y, coll.x, coll.y) < 100) { hurt_hero(coll, 4, h); coll.slow_timer = 0.5; }
      }
      damage_tiles(h.x, h.y, 70, 0.25); // rot makan tanah pelan2, jangan diem2an lawan pudge
      puff(h.x + randf_range(-60, 60), h.y + randf_range(-60, 60), 2, '#8fce5a', 30, 0.6, 5);
    }
  }

  if (h.spin_timer > 0) {
    h.spin_timer -= delta; h.spin_tick -= delta; h.spin_angle += delta * 16;
    if (h.spin_tick <= 0) {
      h.spin_tick = 0.3;
      for (const coll of heroes) {
        if (coll === h || !coll.alive || coll.falling) continue;
        var dd = dist(h.x, h.y, coll.x, coll.y);
        if (dd < 88) {
          hurt_hero(coll, 6, h);
          knockback(coll, coll.x - h.x, coll.y - h.y, 150, h);
        }
      }
      puff(h.x, h.y, 3, '#bde8c8', 180, 0.3, 3);
    }
  }

  // Movement. jalan sendiri ga bisa nyemplung, kaya pathing dota
  var spd = h.def.speed;
  if (h.slow_timer > 0) spd *= 0.6;
  if (h.charge) spd *= 0.25;
  if (h.spin_timer > 0) spd *= 1.25;
  var mvx = 0, mvy = 0;
  if (!h.is_bot && curr_state === 'play') {
    // arrow keys, soalnya WASD bentrok sama tombol skill
    var kx = (keys['arrowright'] ? 1 : 0) - (keys['arrowleft'] ? 1 : 0);
    var ky = (keys['arrowdown'] ? 1 : 0) - (keys['arrowup'] ? 1 : 0);
    if (kx || ky) { h.move_target = null; var l = Math.hypot(kx, ky); mvx = kx / l; mvy = ky / l; }
    if (mouse.right) order_move();
  }
  if (!mvx && !mvy && h.move_target && curr_state === 'play') {
    var d = dist(h.x, h.y, h.move_target.x, h.move_target.y);
    if (d < 6) h.move_target = null;
    else { mvx = (h.move_target.x - h.x) / d; mvy = (h.move_target.y - h.y) / d; }
  }
  if (mvx || mvy) {
    var nx = h.x + mvx * spd * delta, ny = h.y + mvy * spd * delta;
    if (is_ground(nx, ny)) { h.x = nx; h.y = ny; }
    else if (is_ground(nx, h.y)) { h.x = nx; }
    else if (is_ground(h.x, ny)) { h.y = ny; }
    else h.move_target = null;
    if (!h.charge && h.spin_timer <= 0) h.facing = Math.atan2(mvy, mvx);
  }

  // CHECKS IF THERES STILL GROUND UNDER THE FEET
  if (!is_ground(h.x, h.y)) {
    h.falling = true; h.fall_timer = 0;
    h.move_target = null; h.charge = null; h.rot_timer = 0; h.spin_timer = 0;
    sfx.fall();
  }
}

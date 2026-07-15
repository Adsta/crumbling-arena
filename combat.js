// combat: damage, knockback, kill credit. plus projectile / zone / ward

var projs = [], zones = [], wards = [];

function knockback(victim, dx, dy, power, attacker) {
  var len = Math.hypot(dx, dy) || 1;
  victim.vx += dx / len * power;
  victim.vy += dy / len * power;
  // knockback juga ngitung kill credit, dorong orang ke jurang tetep dapet poin
  if (attacker) { victim.last_hit_by = attacker; victim.last_hit_time = time; }
}
function hurt_hero(victim, amt, attacker) {
  if (!victim.alive || victim.falling) return;
  victim.hp -= amt;
  victim.hurt_timer = 0.15;
  if (attacker) { victim.last_hit_by = attacker; victim.last_hit_time = time; }
  dmg_popup(victim.x, victim.y, amt);
  puff(victim.x, victim.y, 6, '#ff5544', 140, 0.4, 4);
  sfx.hit();
  if (victim.hp <= 0) kill_hero(victim, attacker, false);
}
function heal(h, amt) {
  if (!h.alive || h.falling) return;
  var real = Math.min(h.maxhp - h.hp, amt);
  if (real <= 0.5) return;
  h.hp += real;
}
function kill_hero(victim, attacker, fell) {
  if (!victim.alive) return;
  victim.alive = false;
  victim.hooked_by = null;
  if (!fell) {
    puff(victim.x, victim.y, 26, victim.def.color, 260, 0.8, 6);
    add_shake(8);
    sfx.boom();
  }
  console.log("<arena> " + victim.def.name + " died, killer: " + (attacker ? attacker.def.name : "void"));
  if (attacker && attacker !== victim && attacker.alive !== undefined) {
    attacker.score += 1;
    feed_msg(attacker.def.name + ' killed ' + victim.def.name + (fell ? ' (void)' : ''), attacker.def.color);
  } else {
    feed_msg(victim.def.name + ' fell into the void', '#8b93b8');
  }
}

function spawn_proj(p) { projs.push(Object.assign({ dist: 0, dead: false }, p)); }

function update_projs(delta) {
  for (const p of projs) {
    if (p.dead) continue;
    var step = Math.hypot(p.vx, p.vy) * delta;
    p.x += p.vx * delta; p.y += p.vy * delta;
    p.dist += step;
    puff(p.x, p.y, 1, p.color, 20, 0.25, 2.5);

    for (const coll of heroes) {
      if (coll === p.owner || !coll.alive || coll.falling) continue;
      if (dist(p.x, p.y, coll.x, coll.y) < p.r + coll.def.radius) {
        if (p.type === 'hook') { p.on_hit(coll); }
        else {
          hurt_hero(coll, p.dmg, p.owner);
          knockback(coll, p.vx, p.vy, p.kb, p.owner);
          if (p.tile_dmg) damage_tiles(p.x, p.y, p.tile_dmg.r, p.tile_dmg.d * 0.6);
          if (p.type === 'snipe') { add_shake(7); puff(p.x, p.y, 16, '#ff8844', 300, 0.5, 5); }
        }
        p.dead = true;
        break;
      }
    }
    if (p.dead) continue;

    if (p.dist >= p.max_dist) {
      // abis jarak, nancep ke tanah
      p.dead = true;
      if (p.tile_dmg) {
        damage_tiles(p.x, p.y, p.tile_dmg.r, p.tile_dmg.d);
        puff(p.x, p.y, p.type === 'snipe' ? 20 : 6, '#c9a36a', p.type === 'snipe' ? 320 : 120, 0.5, 4, 200);
        if (p.type === 'snipe') { add_shake(6); sfx.boom(); }
      }
    }
  }
  projs = projs.filter(p => !p.dead);
}

// zone + ward sekalian di sini, males misahin
function update_zones(delta) {
  for (const z of zones) {
    z.life -= delta; z.tick -= delta;
    if (z.tick <= 0) {
      z.tick = 0.4;
      for (const coll of heroes) {
        if (coll === z.owner || !coll.alive || coll.falling) continue;
        if (dist(z.x, z.y, coll.x, coll.y) < z.r) { hurt_hero(coll, 4, z.owner); coll.slow_timer = 0.6; }
      }
      var a = randf_range(0, TAU), rr = randf_range(0, z.r);
      damage_tiles(z.x + Math.cos(a) * rr, z.y + Math.sin(a) * rr, 40, 0.55);
      puff(z.x + Math.cos(a) * rr, z.y + Math.sin(a) * rr, 4, '#ffcf7a', 90, 0.4, 3);
    }
  }
  zones = zones.filter(z => z.life > 0);

  for (const w of wards) {
    w.life -= delta; w.pulse += delta;
    if (!is_ground(w.x, w.y)) { w.life = 0; puff(w.x, w.y, 8, '#7fd1a8', 120, 0.5, 4); continue; } // wardnya ikut jatoh wkwk
    var o = w.owner;
    if (o.alive && !o.falling && dist(w.x, w.y, o.x, o.y) < 165) {
      heal(o, 8 * delta);
      if (Math.random() < delta * 6) puff(o.x, o.y, 1, '#7fd1a8', 40, 0.6, 3);
    }
  }
  wards = wards.filter(w => w.life > 0);
}

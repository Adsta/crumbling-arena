// bot brain

function bot_think(h, delta) {
  var b = h.ai;
  b.think -= delta;
  if (b.think > 0) return;
  b.think = randf_range(0.12, 0.22);

  var enemies = heroes.filter(o => o !== h && o.alive && !o.falling);
  if (!enemies.length) { h.move_target = null; return; }
  var target = enemies[0], bd = Infinity;
  for (const en of enemies) {
    var d2 = dist2(h.x, h.y, en.x, en.y);
    if (d2 < bd) { bd = d2; target = en; }
  }
  var d = Math.sqrt(bd);

  // jaga jarak sesuai heronya sambil muter2 biar susah ditembak
  b.strafe += randf_range(0.1, 0.4) * b.strafe_dir;
  if (Math.random() < 0.05) b.strafe_dir *= -1;
  var range = h.def.ai_range;
  var away = Math.atan2(h.y - target.y, h.x - target.x);
  var wobble = Math.sin(b.strafe) * 0.9;
  var mx = target.x + Math.cos(away + wobble) * range;
  var my = target.y + Math.sin(away + wobble) * range;

  var safe_r = Math.min(shrink_radius - 70, ISLAND_R - 50);
  var md = Math.hypot(mx, my);
  if (md > safe_r) { mx *= safe_r / md; my *= safe_r / md; }
  var my_tile = tile_at(h.x, h.y);
  if (!is_ground(mx, my) || !my_tile || my_tile.state !== 'solid') {
    // tanahnya jelek, kabur ke arah tengah
    var a = Math.atan2(-h.y, -h.x) + randf_range(-0.6, 0.6);
    mx = h.x + Math.cos(a) * 130;
    my = h.y + Math.sin(a) * 130;
    if (!is_ground(mx, my)) { mx = -h.x * 0.3; my = -h.y * 0.3; }
  }
  h.move_target = { x: mx, y: my };

  if (h.charge || h.dash) return;
  const aim_lead = (proj_speed) => {
    // prediksi posisi target, plus miss dikit biar fair
    var tt = proj_speed ? d / proj_speed : 0;
    var err = d * 0.06;
    return [target.x + target.est_vx * tt + randf_range(-err, err),
            target.y + target.est_vy * tt + randf_range(-err, err)];
  };

  if (h.def.id === 'pudge') {
    if (h.cds[0] <= 0 && d > 110 && d < 480 && Math.random() < 0.5) { var aim = aim_lead(900); try_cast(h, 0, aim[0], aim[1]); }
    else if (h.cds[1] <= 0 && d < 140) try_cast(h, 1, target.x, target.y);
    else if (h.cds[2] <= 0 && d < 90 && Math.random() < 0.6) try_cast(h, 2, target.x, target.y);
    else if (h.cds[2] <= 0 && my_tile && my_tile.state !== 'solid') try_cast(h, 2, -h.x, -h.y); // dash kabur
  } else if (h.def.id === 'sniper') {
    if (h.cds[2] <= 0 && d > 260 && h.hp > h.maxhp * 0.3 && Math.random() < 0.45) { var aim = aim_lead(1300); try_cast(h, 2, aim[0], aim[1]); }
    else if (h.cds[1] <= 0 && Math.random() < 0.4) { var aim = aim_lead(0); try_cast(h, 1, aim[0], aim[1]); }
    else if (h.cds[0] <= 0 && d < 560 && Math.random() < 0.75) { var aim = aim_lead(1050); try_cast(h, 0, aim[0], aim[1]); }
  } else if (h.def.id === 'juggernaut') {
    if (h.cds[0] <= 0 && d < 150) try_cast(h, 0, target.x, target.y);
    else if (h.cds[1] <= 0 && d > 120 && d < 380 && Math.random() < 0.55) { var aim = aim_lead(760); try_cast(h, 1, aim[0], aim[1]); }
    else if (h.cds[2] <= 0 && h.hp < h.maxhp * 0.55) try_cast(h, 2, h.x, h.y);
  }
}

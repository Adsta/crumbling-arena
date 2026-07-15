// Draw Stuff. semua render di sini

function draw() {
  var g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, Math.max(W, H) * 0.7);
  g.addColorStop(0, '#151b33');
  g.addColorStop(1, '#05060d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // awan tipis di bawah pulau biar keliatan tinggi
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#9db3ff';
  for (var i = 0; i < 5; i++) {
    var cx = W / 2 + Math.sin(time * 0.05 + i * 2.1) * W * 0.35;
    var cy = H / 2 + Math.cos(time * 0.04 + i * 1.7) * H * 0.35;
    ctx.beginPath(); ctx.ellipse(cx, cy, 180 * SCALE + i * 30, 60 * SCALE + i * 8, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();

  if (curr_state === 'select') return;

  if (shrink_radius < ISLAND_R - 4) {
    var rc = w2s(0, 0);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,80,60,0.35)';
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 10]);
    ctx.beginPath(); ctx.arc(rc[0], rc[1], shrink_radius * SCALE, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  // sort per baris biar sisi tanahnya numpuk bener
  var tile_arr = [...tiles.values()].filter(t => t.state !== 'gone');
  tile_arr.sort((a, b) => a.y - b.y);
  var ts = TILE_SIZE * SCALE;
  for (const t of tile_arr) {
    var oy = 0, alpha = 1, scale = 1, rot = 0;
    if (t.state === 'falling') {
      var f = t.fall_t;
      oy = f * f * 500;
      alpha = Math.max(0, 1 - f * 0.95);
      rot = t.rot * f * 1.5;
      scale = 1 - f * 0.25;
    }
    var sc = w2s(t.x, t.y);
    ctx.save();
    ctx.translate(sc[0], sc[1] + oy * SCALE);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = t.state === 'cracked' ? '#4a3626' : '#5b432c';
    ctx.fillRect(-ts / 2, -ts / 2 + ts * 0.35, ts, ts * 0.78);
    var base = t.state === 'cracked' ? [96, 116, 70] : [110, 148, 84];
    var sh = 1 + t.shade;
    ctx.fillStyle = 'rgb(' + (base[0] * sh | 0) + ',' + (base[1] * sh | 0) + ',' + (base[2] * sh | 0) + ')';
    ctx.fillRect(-ts / 2, -ts / 2, ts, ts);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.strokeRect(-ts / 2, -ts / 2, ts, ts);

    if (t.state === 'cracked') {
      ctx.strokeStyle = 'rgba(30,20,10,0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-ts * 0.3, -ts * 0.35); ctx.lineTo(0, 0); ctx.lineTo(ts * 0.25, -ts * 0.1);
      ctx.moveTo(0, 0); ctx.lineTo(-ts * 0.15, ts * 0.35);
      ctx.moveTo(0, 0); ctx.lineTo(ts * 0.35, ts * 0.28);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  for (const z of zones) {
    var sc = w2s(z.x, z.y);
    ctx.save();
    ctx.globalAlpha = 0.16 + Math.sin(time * 8) * 0.04;
    ctx.fillStyle = '#ffb347';
    ctx.beginPath(); ctx.arc(sc[0], sc[1], z.r * SCALE, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#ffb347';
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.arc(sc[0], sc[1], z.r * SCALE, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  for (const w of wards) {
    var sc = w2s(w.x, w.y);
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#7fd1a8';
    ctx.beginPath(); ctx.arc(sc[0], sc[1], 165 * SCALE * (0.9 + Math.sin(w.pulse * 4) * 0.05), 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#2f7a52';
    ctx.fillRect(sc[0] - 5 * SCALE, sc[1] - 22 * SCALE, 10 * SCALE, 24 * SCALE);
    ctx.fillStyle = '#7fd1a8';
    ctx.beginPath(); ctx.arc(sc[0], sc[1] - 26 * SCALE, 8 * SCALE * (1 + Math.sin(w.pulse * 6) * 0.15), 0, TAU); ctx.fill();
    ctx.restore();
  }

  // rantai hook ada 2 kondisi: masih terbang & lagi narik orang
  for (const h of heroes) {
    if (h.hooked_by) draw_chain(h.hooked_by, h.x, h.y);
  }
  for (const p of projs) {
    if (p.type === 'hook') draw_chain(p.owner, p.x, p.y);
  }

  for (const p of particles) {
    var sc = w2s(p.x, p.y);
    ctx.globalAlpha = clamp(p.life / p.max_life, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(sc[0], sc[1], p.size * SCALE, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const p of projs) {
    var sc = w2s(p.x, p.y);
    ctx.save();
    if (p.type === 'hook') {
      ctx.fillStyle = '#c8c8c8';
      ctx.translate(sc[0], sc[1]);
      ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.beginPath();
      ctx.moveTo(10 * SCALE, 0); ctx.lineTo(-6 * SCALE, -9 * SCALE); ctx.lineTo(-2 * SCALE, 0); ctx.lineTo(-6 * SCALE, 9 * SCALE);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(sc[0], sc[1], p.r * SCALE, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // yang lagi jatoh digambar duluan biar ketutup yang masih idup
  var draw_order = heroes.filter(h => h.alive).sort((a, b) => (a.falling ? 0 : 1) - (b.falling ? 0 : 1) || a.y - b.y);
  for (const h of draw_order) draw_hero(h);

  ctx.textAlign = 'center';
  for (const d of dmg_popups) {
    var sc = w2s(d.x, d.y);
    ctx.globalAlpha = 1 - d.t / 0.9;
    ctx.fillStyle = d.color;
    ctx.font = 'bold ' + (16 * SCALE + 4) + 'px Verdana';
    ctx.fillText(d.amt, sc[0], sc[1]);
  }
  ctx.globalAlpha = 1;

  drawHUD();
}

function draw_chain(owner, tx, ty) {
  var pa = w2s(owner.x, owner.y);
  var pb = w2s(tx, ty);
  ctx.save();
  ctx.strokeStyle = '#9a9a9a';
  ctx.lineWidth = 3 * SCALE;
  ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
  var n = Math.floor(dist(pa[0], pa[1], pb[0], pb[1]) / (14 * SCALE));
  ctx.fillStyle = '#c0c0c0';
  for (var i = 1; i < n; i++) {
    var t = i / n;
    ctx.beginPath(); ctx.arc(lerp(pa[0], pb[0], t), lerp(pa[1], pb[1], t), 2.5 * SCALE, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function draw_hero(h) {
  var sc = w2s(h.x, h.y);
  var sx = sc[0], sy = sc[1];
  var r = h.def.radius * SCALE;
  ctx.save();
  ctx.translate(sx, sy);

  if (h.falling) {
    var f = h.fall_timer / 0.85;
    ctx.globalAlpha = 1 - f;
    ctx.scale(1 - f * 0.7, 1 - f * 0.7);
    ctx.rotate(f * 3); // muter2 pas jatoh wkwk
    ctx.translate(0, f * f * 200 * SCALE);
  }

  if (h.rot_timer > 0) {
    ctx.globalAlpha = (h.falling ? 1 - h.fall_timer : 1) * (0.18 + Math.sin(time * 10) * 0.05);
    ctx.fillStyle = '#8fce5a';
    ctx.beginPath(); ctx.arc(0, 0, 100 * SCALE, 0, TAU); ctx.fill();
    ctx.globalAlpha = h.falling ? 1 - h.fall_timer / 0.85 : 1;
  }

  if (h.spin_timer > 0) {
    ctx.save();
    ctx.rotate(h.spin_angle);
    ctx.strokeStyle = 'rgba(220,245,225,0.8)';
    ctx.lineWidth = 3 * SCALE;
    for (var i = 0; i < 3; i++) {
      ctx.rotate(TAU / 3);
      ctx.beginPath();
      ctx.arc(0, 0, 78 * SCALE, 0, 1.1);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.globalAlpha *= 0.35;
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, r * 0.6, r * 1.05, r * 0.4, 0, 0, TAU); ctx.fill();
  ctx.globalAlpha = h.falling ? Math.max(0, 1 - h.fall_timer / 0.85) : 1;

  var grad = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.2, 0, 0, r * 1.3);
  grad.addColorStop(0, h.hurt_timer > 0 ? '#ffffff' : h.def.color); // flash putih pas kena hit
  grad.addColorStop(1, h.def.darker);
  ctx.fillStyle = grad;
  ctx.strokeStyle = h === player ? '#f5f0d8' : 'rgba(0,0,0,0.5)';
  ctx.lineWidth = (h === player ? 3 : 2) * SCALE;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();

  ctx.save();
  ctx.rotate(h.facing);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.moveTo(r * 1.25, 0); ctx.lineTo(r * 0.55, -r * 0.4); ctx.lineTo(r * 0.55, r * 0.4);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  // inisial nama doang, males gambar muka satu2
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold ' + (r * 1.1) + 'px Verdana';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(h.def.name[0], 0, 1);
  ctx.textBaseline = 'alphabetic';

  if (h.charge) {
    var a = h.facing;
    ctx.strokeStyle = 'rgba(255,120,60,' + (0.25 + (0.9 - h.charge.t) * 0.6) + ')';
    ctx.lineWidth = 2 * SCALE;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.4);
    ctx.lineTo(Math.cos(a) * 900 * SCALE, Math.sin(a) * 900 * SCALE);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  if (!h.falling) {
    var bw = 56 * SCALE, bh = 7 * SCALE;
    var bx = sx - bw / 2, by = sy - r - 20 * SCALE;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    var frac = clamp(h.hp / h.maxhp, 0, 1);
    ctx.fillStyle = frac > 0.5 ? '#5fd35f' : frac > 0.25 ? '#e8c840' : '#e05050';
    ctx.fillRect(bx, by, bw * frac, bh);
    ctx.fillStyle = h === player ? '#f5f0d8' : '#aab3da';
    ctx.font = (11 * SCALE + 3) + 'px Verdana';
    ctx.textAlign = 'center';
    ctx.fillText(h.def.name + (h.is_bot ? ' (bot)' : ''), sx, by - 5 * SCALE);
  }
}

function drawHUD() {
  // skor. dulu kotak2an per hero + label "score", sekarang satu baris teks doang
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = 'bold 15px Verdana';
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 6;
  var sorted = [...heroes].sort((a, b) => b.score - a.score);
  var gap = 34, pad = 15;
  var widths = sorted.map(h => ctx.measureText(h.def.name + (h === player ? ' (you)' : '') + '  ' + h.score).width + pad);
  var x = W / 2 - (widths.reduce((a, b) => a + b, 0) + gap * (sorted.length - 1)) / 2;
  sorted.forEach((h, i) => {
    var dead = !h.alive && curr_state === 'play';
    ctx.fillStyle = h.def.color;
    if (dead) ctx.fillStyle = '#3c4260';
    ctx.beginPath(); ctx.arc(x + 4, 25, 4.5, 0, TAU); ctx.fill();
    ctx.fillStyle = dead ? '#565d7d' : (h === player ? '#f0ede0' : '#aab3d0');
    ctx.fillText(h.def.name + (h === player ? ' (you)' : '') + '  ' + h.score, x + pad, 30);
    x += widths[i] + gap;
  });
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'right';
  ctx.font = '13px Verdana';
  kill_feed.forEach((f, i) => {
    ctx.globalAlpha = clamp(1 - (f.t - 4), 0, 1) * 0.9;
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, W - 20, 80 + i * 20);
  });
  ctx.restore();

  if (curr_state === 'play' && grace_timer > 0 && grace_timer < 3.5) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Verdana';
    ctx.fillStyle = 'rgba(255,110,80,' + (0.5 + Math.sin(time * 6) * 0.3) + ')';
    ctx.fillText('THE ISLAND IS CRUMBLING IN ' + Math.ceil(grace_timer) + '...', W / 2, 80);
    ctx.restore();
  }

  if (player) {
    // skill bar tanpa kotak. huruf gede + garis recharge di bawahnya
    var n = 3, size = 74, gap = 14;
    var x0 = W / 2 - (n * size + (n - 1) * gap) / 2;
    var y0 = H - 64;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 6;
    ctx.textAlign = 'center';
    for (var i = 0; i < n; i++) {
      var ab = player.def.abilities[i];
      var x = x0 + i * (size + gap);
      var on_cd = player.cds[i] > 0;
      ctx.fillStyle = on_cd ? '#4a5170' : '#e8e8f5';
      ctx.font = 'bold 26px Verdana';
      ctx.fillText(ab.key, x + size / 2, y0 + 24);
      if (on_cd) {
        ctx.font = 'bold 12px Verdana';
        ctx.fillText(Math.ceil(player.cds[i]), x + size / 2 + 22, y0 + 12);
      }
      ctx.font = '10px Verdana';
      ctx.fillStyle = on_cd ? '#4a5170' : '#8b93b8';
      ctx.fillText(ab.name, x + size / 2, y0 + 40);
      // garis recharge, keisi penuh = ready
      var frac = on_cd ? 1 - player.cds[i] / ab.cd : 1;
      ctx.fillStyle = '#252b48';
      ctx.fillRect(x, y0 + 48, size, 3);
      ctx.fillStyle = on_cd ? '#565d7d' : player.def.color;
      ctx.fillRect(x, y0 + 48, size * frac, 3);
    }
    ctx.restore();
  }

  ctx.save();
  ctx.textAlign = 'center';
  if (curr_state === 'countdown') {
    ctx.font = 'bold 90px Verdana';
    ctx.fillStyle = '#e8ddb5';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 20;
    ctx.fillText(Math.ceil(state_timer), W / 2, H / 2 - 60);
    ctx.font = '18px Verdana';
    ctx.fillStyle = '#aab3da';
    ctx.fillText('Round ' + round_num, W / 2, H / 2 - 10);
  } else if (big_text) {
    ctx.font = 'bold 42px Verdana';
    ctx.fillStyle = big_text_col;
    ctx.shadowColor = '#000'; ctx.shadowBlur = 16;
    ctx.fillText(big_text, W / 2, H / 2 - 80);
    if (curr_state === 'matchend') {
      ctx.font = '20px Verdana';
      ctx.fillStyle = '#aab3da';
      ctx.fillText('Click anywhere for a new match', W / 2, H / 2 - 40);
    }
  }
  ctx.restore();

  if (player && !player.alive && curr_state === 'play') {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '18px Verdana';
    ctx.fillStyle = '#8b93b8';
    ctx.fillText('You died. Spectating...', W / 2, H - 40);
    ctx.restore();
  }
}

// ga kepake lagi abis redesign hud, biarin dulu siapa tau butuh
function round_rect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

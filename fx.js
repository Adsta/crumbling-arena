// efek2an: partikel, angka damage, kill feed, screen shake

var particles = [], dmg_popups = [], kill_feed = [];
var shake_x = 0, shake_y = 0, shake_amt = 0;
function add_shake(x) { shake_amt = Math.min(18, shake_amt + x); }

function puff(x, y, n, color, speed, life, size, grav) {
  for (var i = 0; i < n; i++) {
    var a = randf_range(0, TAU), s = randf_range(speed * 0.3, speed);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: randf_range(life * 0.5, life), max_life: life, color, size: randf_range(size * 0.5, size), grav: grav || 0 });
  }
}
function dmg_popup(x, y, amt, color) {
  dmg_popups.push({ x: x + randf_range(-10, 10), y: y - 26, amt: Math.round(amt), t: 0, color: color || '#ffd25e' });
}
function feed_msg(text, color) {
  kill_feed.push({ text, color: color || '#cdd4f0', t: 0 });
  if (kill_feed.length > 4) kill_feed.shift();
}

function update_fx(delta) {
  for (const p of particles) {
    p.life -= delta;
    p.x += p.vx * delta; p.y += p.vy * delta;
    if (p.grav) p.vy += p.grav * delta;
    p.vx *= 0.94; p.vy *= 0.94;
  }
  particles = particles.filter(p => p.life > 0);
  if (particles.length > 500) particles.splice(0, particles.length - 500);

  for (const d of dmg_popups) { d.t += delta; d.y -= 34 * delta; }
  dmg_popups = dmg_popups.filter(d => d.t < 0.9);

  for (const f of kill_feed) f.t += delta;
  kill_feed = kill_feed.filter(f => f.t < 5);

  shake_amt *= Math.exp(-6 * delta);
  shake_x = randf_range(-1, 1) * shake_amt;
  shake_y = randf_range(-1, 1) * shake_amt;
}

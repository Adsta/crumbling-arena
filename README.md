# Crumbling Island Arena

A browser remake of the Dota 2 arcade mode of the same name — free-for-all combat on an island that falls apart as you fight. No game engine, just vanilla JavaScript and the Canvas 2D API.

Fan project, not affiliated with Valve. Hero names are borrowed from Dota 2 for flavor; everything else (code, art, sound) is original.

## Play it

Just open `index.html` in a browser. No build step, no dependencies, no server required (though any static file server works too, e.g. `python -m http.server`).

## Controls

- **Right-click** to move (arrow keys also work)
- **Q / W / E** to cast your hero's abilities toward the cursor

## The mechanic

The island is a grid of tiles. Ability impacts crack and eventually break tiles under people's feet, and after a short grace period the outer edge starts collapsing on its own, shrinking the safe area over time. Get knocked (or walk) off the edge and you fall — last one standing wins the round. Kill = 1 point, round win = 2 points, first to 12 takes the match.

## Heroes

Three so far, picked because their kits map cleanly onto the mechanics above:

- **Pudge** — hooks an enemy and drags them to you, a damage aura that eats the ground, a short shove-dash
- **Sniper** — fast low-commitment shots, a delayed shrapnel zone, a charged shot with heavy knockback
- **Juggernaut** — a spinning melee flurry, a dash-slash, a healing ward

Bots play all three roles reasonably — they hold range, lead their shots, and retreat off cracking tiles.

## Structure

No bundler, just plain script tags loaded in dependency order:

| File | Responsibility |
|---|---|
| `helpers.js` | canvas setup, math utilities |
| `sfx.js` | procedural sound (WebAudio oscillators/noise, no audio files) |
| `island.js` | the tile grid and crumble/shrink logic |
| `fx.js` | particles, damage numbers, kill feed, screen shake |
| `combat.js` | damage, knockback, kill credit, projectiles/zones/wards |
| `heroes.js` | hero + ability definitions, per-frame hero update |
| `bots.js` | bot targeting and ability usage |
| `draw.js` | all rendering and HUD |
| `game.js` | state machine, rounds, input, main loop |

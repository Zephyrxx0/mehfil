/**
 * Bangles: seven glass and lac bangles threaded on a tapered wooden stand that
 * leans a little. Each is a thin ring with a real hole, so the rod shows
 * through it. At rest they sit unevenly, one near the top bright. The pointer's
 * height picks a bangle (by the rest poses): it brightens, tilts and slides up
 * the rod; those above part upward by less and less, those below settle,
 * staggered outwards. The pointer's x scrubs the gap on a spring. The slider is
 * the gap, in world units.
 *
 * The pattern: scrub and pick. A tween per gap for the choice, one spring for
 * the scrub, a hit test on the rest heights.
 */
const {
  Cam, circ, clamp, facing, fit, hull, lerp, open, poly, prism, proj, r2, rad, ringAt, rrect, run,
  spring, stepS, tdone, tset, tval, tween, disposer, mk, pointer, put, register, solid,
} = HL;

const N = 7, RO = 26, RI = 17, H = 72, Z0 = 4, LEAN = 0.05, STEP = 45, TMAX = 8, HI0 = 5;
const T = [2.4, 3.1, 2.2, 2.8, 2.4, 3.0, 2.2];                 // thickness: glass thin, lac thick
const G0 = [0.3, 3.0, 1.4, 5.6, 2.2, 7.0, 3.8];                // rest gap below each bangle: uneven
const TILT = [0, 1.4, -1.2, 1.0, -1.5, 1.2, -1.0];             // rest tilt, degrees
const WOB = [[0, 0], [0.8, -0.4], [-0.7, 0.5], [0.6, 0.7], [-0.9, -0.3], [0.5, -0.8], [-0.4, 0.6]];
const FALL = [1, 0.4, 0.2, 0.12, 0.08, 0.08];                  // share of the gap that opens, by distance above the pick

const axis = (z) => [LEAN * (z - Z0), -LEAN * (z - Z0)];       // the leaning rod
const rodR = (z) => lerp(3.4, 1.6, (z - Z0) / (H - Z0));
const area = (p) => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0);
const winding = (p, sign) => (Math.sign(area(p)) === sign ? p : p.slice().reverse());

/** The top plane of each bangle for the given gaps. */
function tops(gaps) {
  let z = Z0;
  return gaps.map((g, i) => (z += g + T[i]));
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 2.4);
  fit(C, [[-34, -34, 0], [34, 34, 0], [34, -34, 0], [-34, 34, 0], [0, 0, H + 6], [RO, -RO, 66], [-RO, RO, 66]], 200, 166);
  const P = proj(C), front = facing(C);
  const OUT = circ(RO, 44), INN = circ(RI, 36);
  let gap = value;

  const g = mk("g", {}, svg);
  const disc = (r, b, z0, z1) => put(solid(g), prism(P, front, rrect(-r, -r, r, r, r, 14), rrect(-r + b, -r + b, r - b, r - b, r - b, 14), z0, z1));
  disc(34, 2.2, 0, Z0);          // the base
  disc(7, 1.2, Z0, 5.5);         // the collar the rod comes out of

  // Painted bottom to top: rod piece, bangle, rod piece, bangle... so the rod shows in each hole
  // and the bangle's near band covers it; the far band is behind the piece above it.
  const pieces = [], bang = [];
  for (let k = 0; k <= N; k++) {
    pieces.push({ el: mk("path", { class: "sil" }, g), key: "" });
    if (k < N) bang.push({
      sil: mk("path", { class: "sil" }, g), cr: mk("path", { class: "nf lo" }, g), key: "",
      tw: tween(0), th: 0,
    });
  }
  const finial = mk("path", { class: "sil" }, g);
  const PL = (u, v, z) => P(axis(z)[0] + u, axis(z)[1] + v, z);
  const ROD = circ(1, 14);
  const scaled = (r) => ROD.map((q) => ({ ...q, u: q.u * r, v: q.v * r }));
  const piece = (z0, z1) => poly(hull(ringAt(PL, scaled(rodR(z0)), z0).concat(ringAt(PL, scaled(rodR(z1)), z1))));
  finial.setAttribute("d", poly(hull(ringAt(PL, scaled(2.9), H - 1).concat(ringAt(PL, scaled(2.9), H + 2.6)))));

  const U = G0.map(() => tween(0));                            // per gap: -1 settles, 0 rest, >0 opens
  const Dsp = spring(gap * 0.8, { eps: 0.02 });                // the scrubbed gap
  let xn = 0.6, act = -1;

  function drawBangle(i, zt, th) {
    const b = bang[i];
    const key = r2(zt) + "," + r2(th);
    if (key === b.key) return;
    b.key = key;
    const c = Math.cos(th), s = Math.sin(th), zc = zt, w = WOB[i], [ax, ay] = axis(zt);
    const Pb = (u, v, dz) => P(ax + w[0] + u * c, ay + w[1] + v, zc + dz + u * s);
    const hl = hull(ringAt(Pb, OUT, 0).concat(ringAt(Pb, OUT, -T[i])));
    b.sil.setAttribute("d", poly(hl) + poly(winding(ringAt(Pb, INN, 0), -Math.sign(area(hl)))));
    b.cr.setAttribute("d", open(ringAt(Pb, run(OUT, front), 0)));
  }

  const B = register(stage, (dt, now) => {
    let moving = stepS(Dsp, dt);
    const D = Math.max(Dsp.x, 0);
    const gaps = G0.map((r, m) => {
      if (!tdone(U[m], now)) moving = true;
      const u = tval(U[m], now);
      return Math.max(0.15, r * (1 + 0.5 * Math.min(u, 0)) + Math.max(u, 0) * D);
    });
    const zs = tops(gaps);
    zs.forEach((zt, i) => {
      if (!tdone(bang[i].tw, now)) moving = true;
      const w = tval(bang[i].tw, now), pick = clamp(2 + 0.7 * D, 2, TMAX);
      const deg = TILT[i] * (1 - w) + pick * w;
      const mg = Math.min(i > 0 ? gaps[i] : 9, i < N - 1 ? gaps[i + 1] : 9);
      const cap = Math.asin(clamp((0.45 * mg) / RO, 0, 1));    // neighbours never cross
      const th = Math.sign(deg) * Math.min(Math.abs(rad(deg)), cap);
      drawBangle(i, zt, th);
    });
    pieces.forEach((p, k) => {
      const z0 = k === 0 ? 5.5 : zs[k - 1], z1 = k < N ? zs[k] : H, key = r2(z0) + "," + r2(z1);
      if (key !== p.key) { p.key = key; p.el.setAttribute("d", piece(z0, z1)); }
    });
    return moving;
  });
  bag.add(B.unregister);

  // Rest heights on screen: the hit test reads these and nothing that moves.
  const rz = tops(G0), rest = rz.map((zt, i) => P(axis(zt)[0] + WOB[i][0], axis(zt)[1] + WOB[i][1], zt - T[i] / 2)[1]);
  const pick = (y) => rest.reduce((b, v, i) => (Math.abs(v - y) < Math.abs(rest[b] - y) ? i : b), 0);

  function choose(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    U.forEach((tw, m) => {
      const u = a < 0 ? 0 : m === a ? 0.5 : m > a ? FALL[m - a - 1] : -1;
      tset(tw, u, now, Math.abs(m - from) * STEP);
    });
    bang.forEach((b, i) => {
      tset(b.tw, i === a ? 1 : 0, now, Math.abs(i - from) * STEP);
      b.sil.classList.toggle("hi", i === (a >= 0 ? a : HI0));
    });
    read.textContent = a < 0 ? "rest" : `ring ${a + 1}`;
    B.wake();
  }
  bang[HI0].sil.classList.add("hi");
  read.textContent = "rest";

  function aim() { Dsp.t = gap * lerp(0.55, 1, xn); B.wake(); }
  bag.add(pointer(stage, {
    move: (p) => { xn = clamp((p[0] - 80) / 240, 0, 1); aim(); choose(pick(p[1])); },
    leave: () => choose(-1),
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { gap = v; aim(); }, destroy: bag.dispose };
}

hairline({
  name: "bangles",
  means: "Seven bangles on a stand: the one at the pointer's height slides up, and those above part, less the farther.",
  rules: [1, 2, 3, 5, 6, 8],
  range: [2, 5, 9],
  mount,
});

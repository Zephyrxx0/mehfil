/**
 * Diyas: a shallow wooden tray holding five clay lamps. Each is a bowl, wide at
 * the rim and narrow at the foot, with a pinched spout and a short wick. At
 * rest one lamp (the second) burns; the rest show only a dim wick. The pointer
 * picks a lamp: its flame rises on the 700ms lift curve, the burning flame
 * drops out, and the lamps hop in turn, staggered by distance from the pointer.
 * The slider is the stagger, in ms.
 *
 * The pattern: discrete items, tweens, a stagger by distance, and a hit test on
 * the lamps' resting centres, so a lamp that hops cannot flip the choice.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, proj, ringAt, rrect, run, seg, put, solid,
  tdone, tset, tval, tween, disposer, mk, place, pointer, reflect, register,
} = HL;

const N = 5, GAP = 27, CX = (i) => 14 + i * GAP, CY = [19.5, 21, 18.5, 21.5, 19], LIT = 1;
const X0 = -2, X1 = 14 + (N - 1) * GAP + 21, Y0 = 0, Y1 = 40, WH = 5, WR = 11, WT = 2.4;
const RIM = 10, FOOT = 6.2, HT = 7, LIP = 7, FH = 14, FW = 1.6, HOP = [4.5, 2.4, 1.0, 0.4];
const WICK = [3.4, -0.4];

/** A circle of radius R round (cx, cy) as a ring, with the spout pinched out towards +x. */
function bowl(cx, cy, R, lip) {
  return rrect(cx - R, cy - R, cx + R, cy + R, R, 14).map((q) => {
    const w = Math.max(0, (q.nu - 0.75) / 0.25) ** 1.7;
    return { ...q, u: q.u + lip * w, v: cy + (q.v - cy) * (1 - 0.5 * w) };
  });
}

/** A teardrop standing at b = [x, y] on screen, h tall, w half-wide. */
function flame([x, y], h, w) {
  const f = (a, c) => `${(x + a).toFixed(2)} ${(y - c).toFixed(2)}`;
  return `M${f(0, h)}C${f(0.12 * w, 0.62 * h)} ${f(w, 0.46 * h)} ${f(w, 0.24 * h)}C${f(w, 0.06 * h)} ${f(0.55 * w, 0)} ${f(0, 0)}C${f(-0.55 * w, 0)} ${f(-w, 0.06 * h)} ${f(-w, 0.24 * h)}C${f(-w, 0.46 * h)} ${f(-0.12 * w, 0.62 * h)} ${f(0, h)}Z`;
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 2.6);
  const pts = [[X0, Y0, 0], [X1, Y1, -8], [X1, Y0, 0], [X0, Y1, 0]];
  for (const i of [0, N - 1]) pts.push([CX(i), CY[i], HT + 4.5 + FH + 1]);
  fit(C, pts, 200, 162);
  const P = proj(C), front = facing(C);
  const outer = rrect(X0, Y0, X1, Y1, WR, 14), inner = rrect(X0 + WT, Y0 + WT, X1 - WT, Y1 - WT, WR - WT, 14);

  const g = mk("g", {}, svg);
  reflect(svg, g, P, front, outer, 0, 12);
  // far half of the tray: body, the rim's inner edge and the floor seam along the far walls
  mk("path", { d: poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, WH)))), class: "sil" }, g);
  mk("path", { d: poly(ringAt(P, inner, WH)), class: "nf" }, g);
  mk("path", { d: open(ringAt(P, run(inner, (q) => !front(q)), 0.4)), class: "nf lo" }, g);

  const lamps = [];
  for (let i = 0; i < N; i++) {
    const cx = CX(i), cy = CY[i], grp = mk("g", {}, g);
    const rim = bowl(cx, cy, RIM, LIP), foot = bowl(cx, cy, FOOT, 0), mouth = bowl(cx, cy, RIM - 2, LIP - 3);
    const body = solid(grp), wick = mk("path", { class: "nf" }, grp);
    const dot = mk("circle", { r: 1.5, class: "dot off" }, grp), fl = mk("path", { class: "hi" }, grp);
    lamps.push({ cx, cy, rim, foot, mouth, body, wick, dot, fl, f: tween(i === LIT ? 1 : 0), z: tween(0), key: "" });
  }

  // near half of the tray: one opaque piece from the rim down to the floor
  const LR = (a) => (a[0][0] <= a[a.length - 1][0] ? a : a.slice().reverse());
  const iF = LR(ringAt(P, run(inner, front), WH)), oT = LR(ringAt(P, run(outer, front), WH)), oB = LR(ringAt(P, run(outer, front), 0));
  mk("path", { d: poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), class: "fo" }, g);
  mk("path", { d: open(oT), class: "nf lo" }, g);
  mk("path", { d: open(iF), class: "nf" }, g);
  mk("path", { d: open([oT[0], ...oB, oT[oT.length - 1]]), class: "nf sil" }, g);

  function draw(l, z, f) {
    const key = z.toFixed(2) + "|" + f.toFixed(3);
    if (key === l.key) return;
    l.key = key;
    put(l.body, {
      sil: poly(hull(ringAt(P, l.foot, z).concat(ringAt(P, l.rim, z + HT)))),
      crease: poly(ringAt(P, l.mouth, z + HT)),
    });
    const wx = l.cx + WICK[0], wy = l.cy + WICK[1], tip = P(wx, wy, z + HT + 0.9);
    l.wick.setAttribute("d", seg(P(wx - 1.8, wy, z + HT - 0.2), tip));
    place(l.dot, tip);
    l.fl.setAttribute("d", f > 0.04 ? flame(tip, FH * f * C.S * 0.68, FW * f * C.S) : "");
  }

  // hit test: the lamp whose RESTING centre is nearest the pointer along the row, within a band of the tray
  const rest = lamps.map((l) => P(l.cx, l.cy, HT + 4));
  function hit([x, y]) {
    let a = -1, best = 1e9;
    rest.forEach((c, i) => {
      const d = Math.abs(x - c[0]);
      if (d < best) { best = d; a = i; }
    });
    const c = rest[a];
    return best <= (GAP * C.S * 0.707) / 2 + 2 && Math.abs(y - c[1]) < 34 ? a : -1;
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    lamps.forEach((l) => {
      draw(l, tval(l.z, now), tval(l.f, now));
      if (!tdone(l.z, now) || !tdone(l.f, now)) moving = true;
    });
    return moving;
  });
  bag.add(B.unregister);

  let act = -1;
  /** Picks lamp a (-1 puts the rest flame back). The stagger spreads out from the lamp picked, or the one let go. */
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act, lit = a >= 0 ? a : LIT;
    act = a;
    lamps.forEach((l, i) => {
      const delay = Math.abs(i - from) * stag, d = a < 0 ? 9 : Math.abs(i - a);
      tset(l.f, i === lit ? 1 : 0, now, delay);
      tset(l.z, clamp(HOP[d] || 0, 0, HOP[0]), now, delay);
      l.fl.classList.toggle("hi", i === lit);
      l.fl.classList.toggle("sil", i !== lit);
    });
    read.textContent = a < 0 ? "rest" : "diya " + (a + 1);
    B.wake();
  }
  lamps.forEach((l, i) => { l.fl.classList.toggle("sil", i !== LIT); draw(l, 0, i === LIT ? 1 : 0); });

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "diyas",
  means: "Five clay lamps in a wooden tray: the one under the pointer lights, and its neighbours stir in turn.",
  rules: [1, 2, 5, 8],
  range: [0, 40, 90],
  mount,
});

/**
 * Laddoos: a shallow rounded mithai box with its lid propped open at the back,
 * holding a 3 × 2 grid of round laddoos, each seated in its own dimple. The
 * pointer is put back onto the ground plane; the laddoo nearest it rises out of
 * its dimple, and the others rise less by distance, each on its own spring, down
 * to a floor. One cell is empty and shows its bare dimple; one laddoo is already
 * lifted, and it carries the bright stroke until the pointer chooses another.
 * The slider is the falloff radius, in world units.
 *
 * The pattern: a continuous field (Terrain's), over six round parts.
 */
const {
  Cam, clamp, facing, fillet, fit, hull, mk, open, place, pointer, poly, proj, r2, rad, ringAt,
  rrect, run, register, spring, stepS, unproj, disposer,
} = HL;

const NX = 3, NY = 2, PITCH = 30, RAD = 11.5, SEAT = 1.2, LIFT = 18;
const X0 = -4, X1 = 94, Y0 = -4, Y1 = 64, WH = 9, WR = 9, WT = 2.4;
const LID_L = 58, LID_A = 34, LID_T = 2.2, ZC = RAD - SEAT;
const EMPTY = 3; // cell (0, 1): its dimple stays bare
const H0 = [0.6, 5.5, 0, 0, 1.8, 0]; // rest lift by cell index j * 3 + i; cell 1 is the bright one

/** The share of full lift at u radii from the pointer: 1 → .31 at 42% → .09 beyond. */
const falloff = (u) =>
  u <= 0 ? 1 : u <= 0.417 ? 1 - (u / 0.417) * 0.6875 : u <= 1 ? 0.3125 - ((u - 0.417) / 0.583) * 0.2185 : 0.094;

/** A run of points ordered left to right on screen. */
const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let R = value, over = null, sel = -1;

  const C = Cam(45, 0.5, 1.78);
  const sA = Math.sin(rad(LID_A)), cA = Math.cos(rad(LID_A));
  fit(C, [
    [X0, Y0, 0], [X1, Y0, 0], [X0, Y1, 0], [X1, Y1, 0],
    [X0, Y0 - LID_L * sA - LID_T, WH + LID_L * cA], [X1, Y0 - LID_L * sA - LID_T, WH + LID_L * cA],
    [75, 15, ZC + RAD + LIFT], [15, 45, ZC + RAD + LIFT],
  ], 200, 166);
  const P = proj(C), front = facing(C), S = C.S, K = C.k;

  const g = mk("g", {}, svg);

  // The lid, propped open at the back: a thin plate, its thickness one line behind the face.
  const lw = (u, v) => P(u, Y0 - v * sA, WH + v * cA);
  const lb = (u, v) => P(u, Y0 - v * sA - LID_T * cA, WH + v * cA - LID_T * sA);
  const lidShape = fillet([[X0 + 2, 0], [X1 - 2, 0], [X1 - 2, LID_L], [X0 + 2, LID_L]], [2, 2, 8, 8]);
  const lipShape = fillet([[X0 + 7, 6], [X1 - 7, 6], [X1 - 7, LID_L - 6], [X0 + 7, LID_L - 6]], [3, 3, 5, 5]);
  mk("path", { d: poly(lidShape.map((p) => lb(p[0], p[1]))), class: "lo" }, g);
  mk("path", { d: poly(lidShape.map((p) => lw(p[0], p[1]))), class: "sil" }, g);
  mk("path", { d: poly(lipShape.map((p) => lw(p[0], p[1]))), class: "nf lo" }, g);

  // The tray: its far half now, its near half after the laddoos.
  const outer = rrect(X0, Y0, X1, Y1, WR, 6), inner = rrect(X0 + WT, Y0 + WT, X1 - WT, Y1 - WT, WR - WT, 6);
  mk("path", { d: poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, WH)))), class: "sil" }, g);
  mk("path", { d: poly(ringAt(P, inner, WH)), class: "nf" }, g);
  mk("path", { d: open(ringAt(P, run(inner, (q) => !front(q)), 1.5)), class: "nf lo" }, g);

  // Six dimples, then the laddoos from the back corner to the near one.
  const cells = [];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const n = j * NX + i, cx = (i + 0.5) * PITCH, cy = (j + 0.5) * PITCH;
    cells.push({ n, cx, cy, h0: H0[n], empty: n === EMPTY });
  }
  const ell = (c, r, z, cls) => place(mk("ellipse", { rx: r2(r * S), ry: r2(r * S * K), class: cls }, g), P(c.cx, c.cy, z));
  cells.forEach((c) => { ell(c, RAD + 2, 0, ""); ell(c, RAD - 2.5, -SEAT, "nf lo"); });
  for (const c of cells.slice().sort((a, b) => a.cx + a.cy - b.cx - b.cy)) {
    if (c.empty) continue;
    c.sp = spring(c.h0, { eps: 0.04 });
    c.ball = mk("ellipse", { rx: r2(RAD * S), ry: r2(RAD * S), class: "sil" }, g);
    c.arc = mk("path", { class: "nf lo" }, g);
    c.drawn = NaN;
  }

  // The near half of the tray: one opaque piece from the rim's inner edge to the floor.
  const iF = LR(ringAt(P, run(inner, front), WH)), oT = LR(ringAt(P, run(outer, front), WH)), oB = LR(ringAt(P, run(outer, front), 0));
  mk("path", { d: poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), class: "fo" }, g);
  mk("path", { d: open(oT), class: "nf lo" }, g);
  mk("path", { d: open(iF), class: "nf" }, g);
  mk("path", { d: open([oT[0], ...oB, oT[oT.length - 1]]), class: "nf sil" }, g);

  // Only the bright stroke changes colour: the lifted laddoo at rest, the chosen one under the pointer.
  const lit = () => (sel >= 0 ? sel : 1);
  function draw(c) {
    const h = c.sp.x;
    if (h === c.drawn) return;
    c.drawn = h;
    const q = P(c.cx, c.cy, ZC + h), r = RAD * S;
    place(c.ball, q);
    c.arc.setAttribute("d", `M${r2(q[0] - r)} ${r2(q[1])}A${r2(r)} ${r2(r * K)} 0 0 0 ${r2(q[0] + r)} ${r2(q[1])}`);
  }
  const B = register(stage, (dt) => {
    let m = false;
    for (const c of cells) if (!c.empty) { if (stepS(c.sp, dt)) m = true; draw(c); }
    return m;
  });
  bag.add(B.unregister);

  function retarget() {
    for (const c of cells) {
      if (c.empty) continue;
      if (!over) { c.sp.t = c.h0; continue; }
      const f = falloff(Math.hypot(c.cx - over[0], c.cy - over[1]) / R);
      c.sp.t = clamp(c.h0 + (LIFT - c.h0) * f, 0, LIFT);
    }
    for (const c of cells) if (!c.empty) c.ball.classList.toggle("hi", c.n === lit());
    read.textContent = sel < 0 ? "rest" : `${cells[sel].empty ? "empty" : "sweet"} ${sel + 1}`;
    B.wake();
  }

  // The rest centres never move, so the choice cannot flicker. The pointer picks the cell whose resting
  // centre is nearest on screen; its place inside that cell, read on the plane of the centres, centres the falloff.
  const rest = cells.map((c) => P(c.cx, c.cy, ZC + c.h0));
  function hit(p) {
    let best = 1e9, k = -1;
    rest.forEach((q, n) => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < best) { best = d; k = n; } });
    const w = unproj(C, p[0], p[1], 0);
    if (best > RAD * S * 1.15 && (w[0] < X0 - 8 || w[0] > X1 + 8 || w[1] < Y0 - 8 || w[1] > Y1 + 8)) return -1;
    const a = unproj(C, p[0], p[1], ZC), b = unproj(C, rest[k][0], rest[k][1], ZC), c = cells[k];
    over = [c.cx + clamp(a[0] - b[0], -PITCH / 2, PITCH / 2), c.cy + clamp(a[1] - b[1], -PITCH / 2, PITCH / 2)];
    return k;
  }
  bag.add(pointer(stage, {
    move: (p) => { over = null; sel = hit(p); retarget(); },
    leave: () => { over = null; sel = -1; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  retarget();
  cells.forEach((c) => { if (!c.empty) draw(c); });

  return {
    set: (v) => { R = v; if (over) retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "laddoos",
  means: "A box of laddoos in their dimples: the one under the pointer rises out, and its neighbours rise less with distance.",
  rules: [1, 3, 5, 8],
  range: [22, 40, 64],
  mount,
});

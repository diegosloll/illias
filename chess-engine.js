/* ILLIAS — the wizard's chess. Rules + a small search, no dependencies.
   Board: 64 chars, index 0 = a8 … 63 = h1. Upper case is White, lower case is Black, '.' is empty.
   Used by chess.html in the browser and by a perft check in Node. */
(function (root) {
  'use strict';
  const START = 'rnbqkbnrpppppppp' + '.'.repeat(32) + 'PPPPPPPPRNBQKBNR';
  const isW = p => p >= 'A' && p <= 'Z';
  const isB = p => p >= 'a' && p <= 'z';
  const N_D = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const K_D = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const B_D = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const R_D = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function fresh() { return { b: START.split(''), w: true, K: true, Q: true, k: true, q: true, ep: -1 }; }

  /* is square `sq` attacked by the side `byW`? */
  function attacked(s, sq, byW) {
    const b = s.b, r = sq >> 3, f = sq & 7;
    const P = byW ? 'P' : 'p', N = byW ? 'N' : 'n', B = byW ? 'B' : 'b', R = byW ? 'R' : 'r', Q = byW ? 'Q' : 'q', K = byW ? 'K' : 'k';
    const pr = r + (byW ? 1 : -1);                       // a pawn that attacks sq stands one rank behind it
    if (pr >= 0 && pr < 8) {
      if (f > 0 && b[pr * 8 + f - 1] === P) return true;
      if (f < 7 && b[pr * 8 + f + 1] === P) return true;
    }
    for (const [dr, df] of N_D) { const rr = r + dr, ff = f + df; if (rr >= 0 && rr < 8 && ff >= 0 && ff < 8 && b[rr * 8 + ff] === N) return true; }
    for (const [dr, df] of K_D) { const rr = r + dr, ff = f + df; if (rr >= 0 && rr < 8 && ff >= 0 && ff < 8 && b[rr * 8 + ff] === K) return true; }
    for (const [dr, df] of B_D) {
      let rr = r + dr, ff = f + df;
      while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) { const p = b[rr * 8 + ff]; if (p !== '.') { if (p === B || p === Q) return true; break; } rr += dr; ff += df; }
    }
    for (const [dr, df] of R_D) {
      let rr = r + dr, ff = f + df;
      while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) { const p = b[rr * 8 + ff]; if (p !== '.') { if (p === R || p === Q) return true; break; } rr += dr; ff += df; }
    }
    return false;
  }
  function kingSq(s, white) { return s.b.indexOf(white ? 'K' : 'k'); }
  function inCheck(s, white = s.w) { return attacked(s, kingSq(s, white), !white); }

  /* pseudo-legal moves: { f, t, promo?, ep?, castle?, dbl? } */
  function pseudo(s) {
    const b = s.b, w = s.w, own = w ? isW : isB, foe = w ? isB : isW, out = [];
    for (let i = 0; i < 64; i++) {
      const p = b[i]; if (p === '.' || !own(p)) continue;
      const r = i >> 3, f = i & 7, t = p.toLowerCase();
      if (t === 'p') {
        const dir = w ? -1 : 1, home = w ? 6 : 1, last = w ? 0 : 7, r1 = r + dir;
        if (r1 < 0 || r1 > 7) continue;
        const push = (to, extra) => {
          if (r1 === last) for (const pr of 'qrbn') out.push({ f: i, t: to, promo: w ? pr.toUpperCase() : pr });
          else out.push(Object.assign({ f: i, t: to }, extra));
        };
        if (b[r1 * 8 + f] === '.') {
          push(r1 * 8 + f);
          if (r === home && b[(r + 2 * dir) * 8 + f] === '.') out.push({ f: i, t: (r + 2 * dir) * 8 + f, dbl: true });
        }
        for (const df of [-1, 1]) {
          const ff = f + df; if (ff < 0 || ff > 7) continue;
          const to = r1 * 8 + ff;
          if (b[to] !== '.' && foe(b[to])) push(to);
          else if (to === s.ep) out.push({ f: i, t: to, ep: true });
        }
      } else if (t === 'n' || t === 'k') {
        for (const [dr, df] of (t === 'n' ? N_D : K_D)) {
          const rr = r + dr, ff = f + df; if (rr < 0 || rr > 7 || ff < 0 || ff > 7) continue;
          const q = b[rr * 8 + ff]; if (q === '.' || foe(q)) out.push({ f: i, t: rr * 8 + ff });
        }
        if (t === 'k') {
          const home = w ? 60 : 4;
          if (i === home && !attacked(s, home, !w)) {
            if ((w ? s.K : s.k) && b[home + 1] === '.' && b[home + 2] === '.' && b[home + 3] === (w ? 'R' : 'r')
                && !attacked(s, home + 1, !w) && !attacked(s, home + 2, !w)) out.push({ f: i, t: home + 2, castle: 'k' });
            if ((w ? s.Q : s.q) && b[home - 1] === '.' && b[home - 2] === '.' && b[home - 3] === '.' && b[home - 4] === (w ? 'R' : 'r')
                && !attacked(s, home - 1, !w) && !attacked(s, home - 2, !w)) out.push({ f: i, t: home - 2, castle: 'q' });
          }
        }
      } else {
        const dirs = t === 'b' ? B_D : t === 'r' ? R_D : K_D;
        for (const [dr, df] of dirs) {
          let rr = r + dr, ff = f + df;
          while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) {
            const q = b[rr * 8 + ff];
            if (q === '.') out.push({ f: i, t: rr * 8 + ff });
            else { if (foe(q)) out.push({ f: i, t: rr * 8 + ff }); break; }
            rr += dr; ff += df;
          }
        }
      }
    }
    return out;
  }

  function make(s, m) {
    const b = s.b.slice(), p = b[m.f], w = s.w;
    const n = { b, w: !w, K: s.K, Q: s.Q, k: s.k, q: s.q, ep: -1 };
    b[m.t] = m.promo || p; b[m.f] = '.';
    if (m.ep) b[m.t + (w ? 8 : -8)] = '.';
    if (m.dbl) n.ep = (m.f + m.t) >> 1;
    if (m.castle === 'k') { b[m.t - 1] = b[m.t + 1]; b[m.t + 1] = '.'; }
    if (m.castle === 'q') { b[m.t + 1] = b[m.t - 2]; b[m.t - 2] = '.'; }
    if (p === 'K') n.K = n.Q = false;
    if (p === 'k') n.k = n.q = false;
    if (m.f === 63 || m.t === 63) n.K = false;
    if (m.f === 56 || m.t === 56) n.Q = false;
    if (m.f === 7 || m.t === 7) n.k = false;
    if (m.f === 0 || m.t === 0) n.q = false;
    return n;
  }

  function legal(s) {
    const out = [];
    for (const m of pseudo(s)) { const n = make(s, m); if (!attacked(n, kingSq(n, s.w), !s.w)) out.push(m); }
    return out;
  }

  function perft(s, d) { if (d === 0) return 1; let n = 0; for (const m of legal(s)) n += perft(make(s, m), d - 1); return n; }

  /* ---------- a modest opponent: material + placement, alpha-beta ---------- */
  const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  function evaluate(s) {                                 // from White's point of view
    let v = 0;
    for (let i = 0; i < 64; i++) {
      const p = s.b[i]; if (p === '.') continue;
      const t = p.toLowerCase(), white = isW(p), r = i >> 3, f = i & 7;
      const centre = 3.5 - Math.max(Math.abs(r - 3.5), Math.abs(f - 3.5));        // 0 at the rim … 3 in the middle
      let x = VAL[t];
      if (t === 'p') x += (white ? 6 - r : r - 1) * 8 + (f > 1 && f < 6 ? centre * 6 : 0);
      else if (t === 'n' || t === 'b') x += centre * 10;
      else if (t === 'q') x += centre * 3;
      else if (t === 'k') x -= centre * 12;                                       // keep the king tucked away
      v += white ? x : -x;
    }
    return v;
  }
  function order(s, ms) {
    for (const m of ms) { const c = s.b[m.t]; m.o = (c !== '.' ? 10 * VAL[c.toLowerCase()] - VAL[s.b[m.f].toLowerCase()] : 0) + (m.promo ? 800 : 0); }
    return ms.sort((a, b) => b.o - a.o);
  }
  function search(s, d, a, b) {
    const ms = legal(s);
    if (!ms.length) return inCheck(s) ? -100000 - d : 0;
    if (d === 0) return (s.w ? 1 : -1) * evaluate(s);
    for (const m of order(s, ms)) {
      const v = -search(make(s, m), d - 1, -b, -a);
      if (v > a) { a = v; if (a >= b) break; }
    }
    return a;
  }
  function best(s, depth = 3) {
    const ms = order(s, legal(s)); if (!ms.length) return null;
    let top = -Infinity;
    for (const m of ms) {
      m.v = -search(make(s, m), depth - 1, -Infinity, -(top - 12));               // a little slack, so he varies his play
      if (m.v > top) top = m.v;
    }
    const pick = ms.filter(m => m.v >= top - 12);
    return pick[Math.floor(Math.random() * pick.length)];
  }

  const api = { fresh, legal, make, inCheck, perft, best, evaluate, isW, isB };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.WizardChess = api;
})(typeof self !== 'undefined' ? self : this);

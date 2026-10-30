/* FLBenchmark project page: all charts/tables are rendered from window.FLB (static/js/data.js). Vanilla JS, no dependencies. */
(function () {
  'use strict';
  const D = window.FLB;
  const ALG = D.algos, LAB = D.labels;
  const COL = { fedavg: '#1f77b4', fedprox: '#ff7f0e', scaffold: '#2ca02c', fednova: '#d62728', fedadagrad: '#9467bd', fedyogi: '#8c564b',
                fedadam: '#e377c2', moon: '#7f7f7f', fedbn: '#e0a800', fedavg_bn: '#17becf' };
  const PAPER = ALG.filter(a => a !== 'fedavg_bn');
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const el = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
    }
    kids.flat().forEach(c => e.append(c && c.nodeType ? c : document.createTextNode(c == null ? '' : c)));
    return e;
  };
  const fmt = (x, n = 2) => (x == null ? 'n/a' : x.toFixed(n));
  const sw = a => `<span class="sw" style="background:${COL[a]}"></span>`;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v); kids.flat().forEach(c => e.append(c && c.nodeType ? c : document.createTextNode(c))); return e; };

  /* ---------------- theme + nav ---------------- */
  const root = document.documentElement;
  const saved = localStorage.getItem('flb-theme');
  if (saved) root.setAttribute('data-theme', saved); else if (matchMedia('(prefers-color-scheme: dark)').matches) root.setAttribute('data-theme', 'dark');
  $('#theme').addEventListener('click', () => { const n = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; root.setAttribute('data-theme', n); localStorage.setItem('flb-theme', n); });
  const secs = $$('main section[id]'), navl = $$('nav.top .links a');
  const spy = () => { let cur = secs[0].id; secs.forEach(s => { if (s.getBoundingClientRect().top < 120) cur = s.id; }); navl.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur)); };
  addEventListener('scroll', spy, { passive: true }); spy();

  /* ---------------- hero stats ---------------- */
  $$('[data-count]').forEach(n => { const to = +n.dataset.count; let t0 = null; const step = ts => { t0 = t0 || ts; const p = Math.min(1, (ts - t0) / 900); n.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US'); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); });

  /* ---------------- leaderboard ---------------- */
  const lbViews = { overall: ['Overall (47 settings)', D.friedman.ranks], label: ['Label skew (26)', D.rank_by_cat.label], pathological: ['Pathological label skew (#C = 1\u20133)', D.rank_label_quantity],
                    feature: ['Feature skew (7)', D.rank_by_cat.feature], quantity: ['Quantity skew (7)', D.rank_by_cat.quantity], iid: ['IID (7)', D.rank_by_cat.iid] };
  let lbView = 'overall';
  function drawLeaderboard() {
    const box = $('#lb-rows'); box.innerHTML = '';
    const ranks = lbViews[lbView][1];
    const items = Object.entries(ranks).sort((a, b) => a[1] - b[1]);
    const r0 = items[0][1], cd = D.friedman.cd, kmax = 9;
    const pos = r => ((r - 1) / (kmax - 1)) * 100;
    items.forEach(([a, r], i) => {
      const track = el('div', { class: 'rank-track' });
      if (lbView === 'overall' && i === 0) track.append(el('div', { class: 'cdband', style: `left:${pos(r0)}%;width:${(cd / (kmax - 1)) * 100}%`, title: 'Critical difference (Nemenyi, alpha = 0.05): ranks inside this band cannot be separated from the best' }));
      track.append(el('div', { class: 'rank-dot', style: `left:${pos(r)}%;background:${COL[a]}`, title: `${LAB[a]}: average rank ${r}` }));
      box.append(el('div', { class: 'rank-row' }, el('div', { class: 'name', html: sw(a) + LAB[a] }), track, el('div', { class: 'rank-val' }, r.toFixed(2))));
    });
    $('#lb-note').innerHTML = lbView === 'overall'
      ? `Friedman test over 47 settings: p = ${D.friedman.p.toExponential(1)}. The shaded band is the Nemenyi critical difference (CD = ${cd}); algorithms inside the band cannot be statistically separated from the leader. Only <b>FedBN</b> and <b>MOON</b> fall outside it.`
      : 'Average rank of the nine algorithms over the settings of this category (1 = best). The critical-difference test is only valid over the full set of 47 settings.';
  }
  $('#lb-tabs').append(...Object.entries(lbViews).map(([k, v]) => el('button', { class: 'chip' + (k === lbView ? ' on' : ''), onclick: e => { lbView = k; $$('#lb-tabs .chip').forEach(c => c.classList.remove('on')); e.target.classList.add('on'); drawLeaderboard(); } }, v[0])));
  const ax = $('#lb-axis'); ax.append(el('span'), el('div', { class: 't' }, ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => el('span', {}, n))), el('span'));
  drawLeaderboard();
  const wt = $('#wtl-rows');
  PAPER.filter(a => a !== 'fedavg').sort((a, b) => D.wtl[b].win - D.wtl[a].win || D.wtl[a].loss - D.wtl[b].loss).forEach(a => {
    const w = D.wtl[a], tot = w.win + w.tie + w.loss, wp = D.wilcoxon[a];
    wt.append(el('tr', {}, el('td', { html: sw(a) + LAB[a] }),
      el('td', {}, el('div', { class: 'wtl', title: `${w.win} significantly better / ${w.tie} not different / ${w.loss} significantly worse than FedAvg` }, el('i', { class: 'w', style: `width:${w.win / tot * 100}%` }), el('i', { class: 't0', style: `width:${w.tie / tot * 100}%` }), el('i', { class: 'l', style: `width:${w.loss / tot * 100}%` }))),
      el('td', {}, `${w.win} / ${w.tie} / ${w.loss}`), el('td', {}, wp ? (wp.mean_diff > 0 ? '+' : '') + wp.mean_diff.toFixed(2) : ''), el('td', {}, wp ? (wp.p_holm < 0.05 ? '' : '') + wp.p_holm.toFixed(3) + (wp.p_holm < 0.05 ? ' \u2713' : '') : ''), el('td', {}, D.n_best[a] || 0)));
  });

  /* ---------------- results explorer ---------------- */
  const st = { cat: 'all', ds: 'all', ctrl: true, heat: true };
  const catLab = { label: 'Label skew', feature: 'Feature skew', quantity: 'Quantity skew', iid: 'IID' };
  function drawTable() {
    const algos = ALG.filter(a => st.ctrl || a !== 'fedavg_bn');
    const rows = D.grid.filter(r => (st.cat === 'all' || r.cat === st.cat) && (st.ds === 'all' || r.dataset === st.ds));
    const t = $('#res-table'); t.innerHTML = '';
    t.append(el('thead', {}, el('tr', {}, el('th', { class: 'sticky' }, 'Dataset'), el('th', {}, 'Partition'), ...algos.map(a => el('th', { html: sw(a) + LAB[a] })))));
    const tb = el('tbody'); let prev = null;
    rows.forEach(r => {
      const vals = algos.map(a => r.algos[a] ? r.algos[a].m : null);
      const ord = vals.map((v, i) => [v, i]).filter(x => x[0] != null).sort((a, b) => b[0] - a[0]);
      const rankOf = {}; ord.forEach((x, i) => rankOf[x[1]] = i);
      const tr = el('tr', { class: r.dataset !== prev ? 'grp' : '' });
      tr.append(el('td', { class: 'sticky' }, r.dataset !== prev ? D.dlabels[r.dataset] : ''), el('td', { class: 'set' }, D.taglabels[r.tag]));
      prev = r.dataset;
      algos.forEach((a, i) => {
        const c = r.algos[a]; const td = el('td');
        if (!c) { td.textContent = 'n/a'; tr.append(td); return; }
        const arrow = c.sig > 0 ? '<span class="up">\u25B2</span>' : c.sig < 0 ? '<span class="dn">\u25BC</span>' : '';
        td.innerHTML = (c.best ? `<b>${c.m.toFixed(2)}</b>` : c.m.toFixed(2)) + ` <span class="small">\u00B1${c.s.toFixed(1)}</span> ${arrow}`;
        td.title = `${LAB[a]}, ${D.dlabels[r.dataset]}, ${D.taglabels[r.tag]}\nmean ${c.m}% \u00B1 sample SD ${c.s} (n = ${c.n} seeds)` + (c.sig ? `\nsignificantly ${c.sig > 0 ? 'higher' : 'lower'} than FedAvg (paired t-test, Holm)` : '');
        if (st.heat && rankOf[i] != null) { const q = 1 - rankOf[i] / Math.max(1, ord.length - 1); td.style.background = `color-mix(in srgb, ${q > .5 ? 'var(--good)' : 'var(--bad)'} ${Math.round(Math.abs(q - .5) * 56)}%, var(--card))`; }
        tr.append(td);
      });
      tb.append(tr);
    });
    t.append(tb);
    $('#res-count').textContent = `${rows.length} setting${rows.length === 1 ? '' : 's'}`;
  }
  const dsel = $('#res-ds'); dsel.append(el('option', { value: 'all' }, 'All datasets'), ...D.datasets.map(d => el('option', { value: d }, D.dlabels[d])));
  dsel.addEventListener('change', () => { st.ds = dsel.value; drawTable(); });
  $('#res-cats').append(...[['all', 'All'], ...Object.entries(catLab)].map(([k, v]) => el('button', { class: 'chip' + (k === 'all' ? ' on' : ''), onclick: e => { st.cat = k; $$('#res-cats .chip').forEach(c => c.classList.remove('on')); e.target.classList.add('on'); drawTable(); } }, v)));
  $('#res-ctrl').addEventListener('change', e => { st.ctrl = e.target.checked; drawTable(); });
  $('#res-heat').addEventListener('change', e => { st.heat = e.target.checked; drawTable(); });
  drawTable();

  /* ---------------- ten-seed dot plot ---------------- */
  let coreIdx = 0;
  function drawCore() {
    const c = D.core10[coreIdx], box = $('#core-plot'); box.innerHTML = '';
    const items = ALG.filter(a => c.algos[a]).map(a => [a, c.algos[a]]).sort((a, b) => b[1].m - a[1].m);
    const lo = Math.floor(Math.min(...items.map(([, v]) => v.m - v.ci)) / 5) * 5, hi = Math.ceil(Math.max(...items.map(([, v]) => v.m + v.ci)) / 5) * 5;
    const p = x => ((x - lo) / (hi - lo)) * 100;
    items.forEach(([a, v]) => {
      const arrow = v.sig > 0 ? ' <span class="up">\u25B2</span>' : v.sig < 0 ? ' <span class="dn">\u25BC</span>' : '';
      box.append(el('div', { class: 'dp-row' }, el('div', { class: 'name', html: sw(a) + LAB[a] }),
        el('div', { class: 'dp-track', title: `${LAB[a]}: ${v.m}% \u00B1 ${v.ci} (95% CI, 10 seeds)` }, el('div', { class: 'dp-ci', style: `left:${p(v.m - v.ci)}%;width:${p(v.m + v.ci) - p(v.m - v.ci)}%;background:${COL[a]}` }), el('div', { class: 'dp-dot', style: `left:${p(v.m)}%;background:${COL[a]}` })),
        el('div', { class: 'small', html: `${v.m.toFixed(1)} \u00B1 ${v.ci.toFixed(1)}${arrow}` })));
    });
    const axis = el('div', { class: 'dp-axis' }); for (let x = lo; x <= hi; x += 5) axis.append(el('span', { style: `left:${p(x)}%` }, x + '%')); box.append(axis);
  }
  $('#core-tabs').append(...D.core10.map((c, i) => el('button', { class: 'chip' + (i === 0 ? ' on' : ''), onclick: e => { coreIdx = i; $$('#core-tabs .chip').forEach(x => x.classList.remove('on')); e.target.classList.add('on'); drawCore(); } }, `${D.dlabels[c.dataset]} \u00B7 ${D.taglabels[c.tag]}`)));
  drawCore();

  /* ---------------- generic line chart ---------------- */
  function lineChart(host, series, o) {
    host.innerHTML = ''; host.style.position = 'relative';
    const W = 860, H = 380, m = { l: 52, r: 14, t: 12, b: 42 };
    const xs = series.flatMap(s => s.x), ys = series.flatMap(s => [...(s.lo || s.y), ...(s.hi || s.y)]);
    if (!ys.length) return;
    const x0 = Math.min(...xs), x1 = Math.max(...xs); let y0 = Math.min(...ys), y1 = Math.max(...ys); const pad = (y1 - y0) * 0.06 || 1; y0 = Math.max(0, y0 - pad); y1 = Math.min(100, y1 + pad);
    const X = x => m.l + ((x - x0) / (x1 - x0 || 1)) * (W - m.l - m.r), Y = y => H - m.b - ((y - y0) / (y1 - y0 || 1)) * (H - m.t - m.b);
    const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart' });
    for (let i = 0; i <= 5; i++) { const yv = y0 + (y1 - y0) * i / 5; s.append(svg('line', { x1: m.l, x2: W - m.r, y1: Y(yv), y2: Y(yv), class: 'grid' }), svg('text', { x: m.l - 8, y: Y(yv) + 4, 'text-anchor': 'end' }, yv.toFixed(0))); }
    (o.xticks || [0, 10, 20, 30, 40, 50]).forEach(t => s.append(svg('line', { x1: X(t), x2: X(t), y1: m.t, y2: H - m.b, class: 'grid' }), svg('text', { x: X(t), y: H - m.b + 18, 'text-anchor': 'middle' }, t)));
    s.append(svg('text', { x: (W + m.l) / 2, y: H - 6, 'text-anchor': 'middle' }, o.xlabel), svg('text', { x: 14, y: H / 2, transform: `rotate(-90 14 ${H / 2})`, 'text-anchor': 'middle' }, o.ylabel));
    series.forEach(se => {
      if (se.lo) { const up = se.x.map((x, i) => `${X(x)},${Y(se.hi[i])}`), dn = se.x.map((x, i) => `${X(x)},${Y(se.lo[i])}`).reverse(); s.append(svg('polygon', { points: up.concat(dn).join(' '), fill: se.color, 'fill-opacity': .14 })); }
      s.append(svg('polyline', { points: se.x.map((x, i) => `${X(x)},${Y(se.y[i])}`).join(' '), fill: 'none', stroke: se.color, 'stroke-width': 2, 'stroke-dasharray': se.dash || '' }));
      if (o.dots) se.x.forEach((x, i) => s.append(svg('circle', { cx: X(x), cy: Y(se.y[i]), r: 3.5, fill: se.color })));
    });
    const vline = svg('line', { y1: m.t, y2: H - m.b, stroke: 'var(--muted)', 'stroke-dasharray': '3 3', visibility: 'hidden' }); s.append(vline);
    const tip = el('div', { class: 'tip', style: 'display:none' }); host.append(s, tip);
    s.addEventListener('mousemove', ev => {
      const r = s.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width * W; if (px < m.l || px > W - m.r) { vline.setAttribute('visibility', 'hidden'); tip.style.display = 'none'; return; }
      let xv = x0 + ((px - m.l) / (W - m.l - m.r)) * (x1 - x0); const cand = series[0].x; xv = cand.reduce((b, c) => Math.abs(c - xv) < Math.abs(b - xv) ? c : b, cand[0]);
      vline.setAttribute('x1', X(xv)); vline.setAttribute('x2', X(xv)); vline.setAttribute('visibility', 'visible');
      const rows = series.map(se => { const i = se.x.indexOf(xv); return i < 0 ? null : [se, se.y[i], se.ci ? se.ci[i] : null]; }).filter(Boolean).sort((a, b) => b[1] - a[1]);
      tip.innerHTML = `<b>${o.xname} ${xv}</b>` + rows.map(([se, v, c]) => `<div><span><span class="sw" style="background:${se.color}"></span>${se.name}</span><span>${v.toFixed(1)}${c != null ? ' \u00B1 ' + c.toFixed(1) : ''}</span></div>`).join('');
      tip.style.display = 'block'; const hr = host.getBoundingClientRect(); let left = ev.clientX - hr.left + 14; if (left > hr.width - 190) left = ev.clientX - hr.left - 190; tip.style.left = left + 'px'; tip.style.top = (ev.clientY - hr.top + 10) + 'px';
    });
    s.addEventListener('mouseleave', () => { vline.setAttribute('visibility', 'hidden'); tip.style.display = 'none'; });
  }

  /* ---------------- training curves ---------------- */
  const cv = { ds: 'cifar10', tag: 'pk', on: new Set(['fedavg', 'scaffold', 'fedyogi', 'fedadagrad', 'fedbn', 'fedavg_bn']) };
  const tagsOf = ds => D.tagorder.filter(t => D.curves[ds + '|' + t]);
  function drawCurves() {
    const data = D.curves[cv.ds + '|' + cv.tag]; if (!data) return;
    const series = ALG.filter(a => cv.on.has(a) && data[a]).map(a => ({ name: LAB[a], color: COL[a], x: data[a].m.map((_, i) => i), y: data[a].m, lo: data[a].m.map((v, i) => v - data[a].ci[i]), hi: data[a].m.map((v, i) => v + data[a].ci[i]), ci: data[a].ci, dash: a === 'fedavg_bn' ? '6 4' : '' }));
    lineChart($('#curve-chart'), series, { xlabel: 'Communication round', ylabel: 'Test accuracy (%)', xname: 'Round' });
  }
  const cds = $('#cv-ds'), cts = $('#cv-tag');
  cds.append(...D.datasets.filter(d => tagsOf(d).length).map(d => el('option', { value: d }, D.dlabels[d]))); cds.value = cv.ds;
  const fillTags = () => { cts.innerHTML = ''; cts.append(...tagsOf(cv.ds).map(t => el('option', { value: t }, D.taglabels[t]))); if (!tagsOf(cv.ds).includes(cv.tag)) cv.tag = tagsOf(cv.ds)[0]; cts.value = cv.tag; };
  fillTags();
  cds.addEventListener('change', () => { cv.ds = cds.value; fillTags(); drawCurves(); }); cts.addEventListener('change', () => { cv.tag = cts.value; drawCurves(); });
  $('#cv-algos').append(...ALG.map(a => el('span', { class: 'algochip' + (cv.on.has(a) ? '' : ' off'), html: sw(a) + LAB[a], onclick: e => { const n = e.currentTarget; if (cv.on.has(a)) { cv.on.delete(a); n.classList.add('off'); } else { cv.on.add(a); n.classList.remove('off'); } drawCurves(); } })));
  drawCurves();

  /* ---------------- selection guide ---------------- */
  const SC = {
    A: { color: 'var(--warn)', title: 'Pathological label skew', sub: 'each client holds only 1\u20132 classes', try: 'FedYogi / FedAdam (FedAdagrad if #C = 1)', ev: ['warn', 'Evidence: suggestive (not significant after Holm correction)'],
         pts: ['Best average ranks for #C = 1\u20133: 3.1\u20133.3, against 4.3 (FedAvg) and 5.3 (SCAFFOLD).', 'FMNIST #C = 2, ten seeds: +8.4 / +8.0 points over FedAvg, but p<sub>Holm</sub> = 0.07\u20130.12.', 'Very high variance; #C = 1 is near chance on CIFAR-10, CINIC-10 and SVHN.'] },
    B: { color: 'var(--accent2)', title: 'Moderate label skew', sub: 'Dirichlet(0.5)', try: 'SCAFFOLD (otherwise FedAvg / FedProx)', ev: ['good', 'Evidence: significant on CIFAR-10 and CINIC-10'],
         pts: ['SCAFFOLD: +3.0 points on CIFAR-10 Dirichlet(0.5) (ten seeds, p<sub>Holm</sub> = 0.035) and +5.5 on CINIC-10.', 'FedAvg, FedProx and FedNova are statistically tied with the leaders.', 'Adaptive methods can hurt: \u22122.3 / \u22122.2 points (FedAdam / FedYogi) on SVHN.'] },
    C: { color: 'var(--good)', title: 'Feature skew, quantity skew or near-IID', sub: 'mild noise, unbalanced client sizes, or homogeneous data', try: 'FedAvg / FedProx by default; consider SCAFFOLD or FedAdagrad', ev: ['good', 'Evidence: significant, but 2\u00D7 bytes per round'],
         pts: ['SCAFFOLD: +3.9 to +5.5 points on CINIC-10 and +1.7 on Adult, at twice the bytes per round.', 'At equal bytes SCAFFOLD beats FedAvg in only 17 of 47 settings (27 of 47 at equal rounds).', 'On easy tasks (MNIST) all methods are within 0.5 points.'] }
  };
  function showScen(k) {
    $$('.scen').forEach(x => x.classList.toggle('on', x.dataset.k === k)); const s = SC[k];
    $('#reco').style.borderLeftColor = s.color;
    $('#reco').innerHTML = `<h3>${s.title} <span class="small">\u2014 ${s.sub}</span></h3><p><b>Try:</b> ${s.try} &nbsp; <span class="badge ${s.ev[0]}">${s.ev[1]}</span></p><ul>${s.pts.map(p => `<li>${p}</li>`).join('')}</ul>`;
  }
  $$('.scen').forEach(x => x.addEventListener('click', () => showScen(x.dataset.k))); showScen('A');

  /* ---------------- insights ---------------- */
  $$('.tab').forEach(t => t.addEventListener('click', () => { $$('.tab').forEach(x => x.classList.toggle('on', x === t)); $$('.panel').forEach(p => p.classList.toggle('on', p.id === t.dataset.p)); if (t.dataset.p === 'p-epochs') drawEpochs(); }));
  // FedBN
  (function () {
    const tb = $('#fedbn-rows'); const L = { label: 'Label skew', feature: 'Feature skew', quantity: 'Quantity skew', iid: 'IID', all: 'All 47 settings' };
    Object.entries(D.fedbn).forEach(([k, v]) => tb.append(el('tr', {}, el('td', {}, k === 'all' ? el('b', {}, L[k]) : L[k]), el('td', {}, v.n), el('td', {}, (v.d > 0 ? '+' : '') + v.d.toFixed(1)), el('td', {}, v.better), el('td', {}, v.tie), el('td', {}, el('span', { class: v.worse ? 'dn' : '' }, v.worse)), el('td', {}, (v.bn_d > 0 ? '+' : '') + v.bn_d.toFixed(1)))));
    const d = $('#fedbn-dom'); Object.entries(D.fedbn_domain).forEach(([k, v]) => d.append(el('tr', {}, el('td', {}, D.dlabels[k]), el('td', {}, v.global.toFixed(1)), el('td', {}, v.own.toFixed(1)), el('td', { class: v.own > v.global ? 'up' : 'dn' }, (v.own - v.global > 0 ? '+' : '') + (v.own - v.global).toFixed(1)))));
  })();
  // bytes
  (function () {
    const b = D.bytes, host = $('#bytes-bars'); const row = (lab, v, color) => el('div', { class: 'rank-row', style: 'grid-template-columns:180px 1fr 70px' }, el('div', { class: 'name' }, lab), el('div', { class: 'rank-track', style: 'background:var(--line)' }, el('div', { style: `height:100%;width:${v / b.n * 100}%;background:${color};border-radius:8px` })), el('div', { class: 'rank-val' }, `${v} / ${b.n}`));
    host.append(row('Equal rounds (50)', b.scaffold_better_rounds, 'var(--good)'), row('Equal bytes', b.scaffold_better_bytes, 'var(--warn)'));
  })();
  // epochs
  const ep = { key: 'cifar10|c2' };
  const ek = $('#ep-key'); ek.append(...Object.keys(D.epochs).sort().map(k => { const [d, t] = k.split('|'); return el('option', { value: k }, `${D.dlabels[d]} \u00B7 ${D.taglabels[t]}`); })); ek.value = ep.key;
  function drawEpochs() {
    const data = D.epochs[ep.key]; const series = ALG.filter(a => data[a]).map(a => ({ name: LAB[a], color: COL[a], x: [10, 20, 30], y: [10, 20, 30].map(e => data[a][e].m), ci: [10, 20, 30].map(e => data[a][e].ci), dash: a === 'fedavg_bn' ? '6 4' : '' }));
    lineChart($('#ep-chart'), series, { xlabel: 'Local epochs per round', ylabel: 'Test accuracy (%)', xticks: [10, 20, 30], xname: 'Epochs', dots: true });
  }
  ek.addEventListener('change', () => { ep.key = ek.value; drawEpochs(); });
  // strong noise
  (function () {
    const t = $('#noise-table'); t.append(el('thead', {}, el('tr', {}, el('th', { class: 'sticky' }, 'Dataset'), ...ALG.map(a => el('th', { html: sw(a) + LAB[a] })))));
    const tb = el('tbody');
    ['mnist', 'fmnist', 'svhn', 'cinic10', 'cifar10', 'fedisic2019'].forEach(d => { const r = D.noise_strong[d]; const best = Math.max(...ALG.map(a => r[a].m));
      tb.append(el('tr', {}, el('td', { class: 'sticky' }, D.dlabels[d]), ...ALG.map(a => { const c = r[a]; const arrow = c.sig > 0 ? ' <span class="up">\u25B2</span>' : c.sig < 0 ? ' <span class="dn">\u25BC</span>' : ''; return el('td', { html: (c.m === best ? `<b>${c.m.toFixed(1)}</b>` : c.m.toFixed(1)) + ` <span class="small">\u00B1${c.s.toFixed(1)}</span>` + arrow }); }))); });
    t.append(tb);
  })();
  // participation
  (function () {
    const host = $('#part-bars');
    D.participation.forEach(p => {
      const items = ALG.map(a => [a, p.algos[a].half - p.algos[a].full]).sort((a, b) => b[1] - a[1]); const mn = Math.min(...items.map(i => i[1]));
      host.append(el('h4', { style: 'margin-top:14px' }, `${D.dlabels[p.dataset]} \u00B7 ${D.taglabels[p.tag]}`));
      items.forEach(([a, d]) => host.append(el('div', { class: 'rank-row', style: 'grid-template-columns:120px 1fr 60px;margin:3px 0' }, el('div', { class: 'name', html: sw(a) + LAB[a] }), el('div', { class: 'rank-track', style: 'height:16px;background:var(--line)' }, el('div', { style: `height:100%;width:${Math.abs(d) / Math.abs(mn) * 100}%;background:${COL[a]};border-radius:6px` })), el('div', { class: 'rank-val' }, d.toFixed(1)))));
    });
  })();

  /* ---------------- setup: tuned hyper-parameters ---------------- */
  (function () {
    const tb = $('#tuned-rows'); const hp = h => Object.entries(h).map(([k, v]) => `${k === 'mu' ? '\u03BC' : k === 'eta' ? '\u03B7' : '\u03C4'} = ${v}`).join(', ') || '\u2014';
    ['fedavg', 'fedprox', 'scaffold', 'fednova', 'fedadagrad', 'fedyogi', 'fedadam', 'moon', 'fedbn', 'fedavg_bn'].forEach(a => { const t = D.tuned[a];
      tb.append(el('tr', {}, el('td', { html: sw(a) + LAB[a] }), el('td', {}, t.image.lr), el('td', {}, t.image.mom), el('td', {}, hp(t.image.hp)), el('td', {}, t.tabular.lr), el('td', {}, t.tabular.mom), el('td', {}, hp(t.tabular.hp)))); });
  })();

  /* ---------------- copy buttons ---------------- */
  $$('pre.code').forEach(p => { const b = el('button', { onclick: () => { navigator.clipboard && navigator.clipboard.writeText(p.innerText.replace(/^Copy\n?/, '')); b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy', 1200); } }, 'Copy'); p.append(b); });
})();

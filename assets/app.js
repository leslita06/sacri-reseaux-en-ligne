(function () {
  'use strict';
  const D = window.D, ICO = window.ICO;
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const I = (n, c) => `<svg class="lu${c ? ' ' + c : ''}" viewBox="0 0 24 24" aria-hidden="true">${ICO[n] || ''}</svg>`;
  const paintIcons = (root) => (root || document).querySelectorAll('[data-i]').forEach(e => { if (!e.firstElementChild) e.innerHTML = I(e.dataset.i); });
  const NB = '\u00a0';
  const fmt = n => Math.round(n).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, NB);
  const pct = (a, b, dg = 1) => (b ? a / b * 100 : 0).toLocaleString('fr-FR', { minimumFractionDigits: dg, maximumFractionDigits: dg }) + NB + '%';
  const sum = a => a.reduce((x, y) => x + y, 0);
  const NET = {
    facebook: { n: 'Facebook', c: '#0EA5E9', i: 'facebook' },
    linkedin: { n: 'LinkedIn', c: '#8B5CF6', i: 'linkedin' },
    instagram: { n: 'Instagram', c: '#F59E0B', i: 'instagram' },
    whatsapp: { n: 'WhatsApp', c: '#10B981', i: 'message-circle' }
  };
  const NETS = Object.keys(NET);
  const nd = k => `<span class="nd" style="background:${NET[k].c}" title="${NET[k].n}">${I(NET[k].i)}</span>`;
  const mois = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const jours = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  const pd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const fd = s => { const x = pd(s); return x.getDate() + NB + mois[x.getMonth()]; };
  const fdl = s => { const x = pd(s); return jours[x.getDay()] + ' ' + x.getDate() + NB + mois[x.getMonth()]; };
  const isPhone = () => window.innerWidth <= 640;

  // ---------- Filtres ----------
  const PER = [
    { k: 'tout', n: 'Toute la période, 8 semaines', w: [0, 7], d: ['2026-12-07', '2027-01-31'] },
    { k: 'lanc', n: 'Lancement, 30 premiers jours', w: [0, 4], d: ['2026-12-08', '2027-01-06'] },
    { k: 'dec', n: 'Décembre 2026', w: [0, 3], d: ['2026-12-01', '2026-12-31'] },
    { k: 'jan', n: 'Janvier 2027', w: [4, 7], d: ['2027-01-01', '2027-01-31'] }
  ].concat(D.semaines.map((s, i) => {
    const a = new Date(2026, 11, 7 + i * 7), b = new Date(2026, 11, 13 + i * 7);
    const iso = x => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
    return { k: 'w' + i, n: 'Semaine ' + (i + 1) + ', ' + s, w: [i, i], d: [iso(a), iso(b)] };
  }));
  const GAMMES = Array.from(new Set(D.pubs.map(p => p.g))).sort((a, b) => a.localeCompare(b, 'fr'));
  const TYPES = Array.from(new Set(D.pubs.map(p => p.ty)));
  const F = { net: 'tous', per: 'tout', gam: 'tous', typ: 'tous' };
  const nets = () => F.net === 'tous' ? NETS : [F.net];
  const per = () => PER.find(p => p.k === F.per);

  $('#f-net').innerHTML = `<button class="chip on" data-k="tous">${I('layers')}Tous les réseaux</button>` +
    NETS.map(k => `<button class="chip" data-k="${k}"><span class="sw" style="background:${NET[k].c}"></span>${NET[k].n}</button>`).join('');
  $('#f-per').innerHTML = PER.map(p => `<option value="${p.k}">${p.n}</option>`).join('');
  $('#f-gam').innerHTML = '<option value="tous">Toutes les gammes</option>' + GAMMES.map(g => `<option>${g}</option>`).join('');
  $('#f-typ').innerHTML = '<option value="tous">Tous les contenus</option>' + TYPES.map(g => `<option>${g}</option>`).join('');

  function setF(k, v) { F[k] = v; syncF(); draw(); }
  $('#f-net').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setF('net', b.dataset.k); });
  $('#f-per').addEventListener('change', e => setF('per', e.target.value));
  $('#f-gam').addEventListener('change', e => setF('gam', e.target.value));
  $('#f-typ').addEventListener('change', e => setF('typ', e.target.value));
  $('#reset').addEventListener('click', () => { Object.assign(F, { net: 'tous', per: 'tout', gam: 'tous', typ: 'tous' }); syncF(); draw(); });
  function syncF() {
    $$('#f-net .chip').forEach(b => b.classList.toggle('on', b.dataset.k === F.net));
    $('#f-per').value = F.per; $('#f-gam').value = F.gam; $('#f-typ').value = F.typ;
    $('#f-per').parentNode.classList.toggle('act', F.per !== 'tout');
    $('#f-gam').parentNode.classList.toggle('act', F.gam !== 'tous');
    $('#f-typ').parentNode.classList.toggle('act', F.typ !== 'tous');
    $('#reset').hidden = F.net === 'tous' && F.per === 'tout' && F.gam === 'tous' && F.typ === 'tous';
    $('#per-l').textContent = F.per === 'tout' ? '7 déc. 2026 au 31 janv. 2027' : per().n;
  }

  // Publications filtrées : métriques additionnées sur les réseaux retenus
  function rows(opt) {
    const o = Object.assign({ gam: true, typ: true }, opt || {});
    const P = per(), ns = nets();
    return D.pubs.filter(p => p.d >= P.d[0] && p.d <= P.d[1] &&
      (!o.gam || F.gam === 'tous' || p.g === F.gam) && (!o.typ || F.typ === 'tous' || p.ty === F.typ) &&
      ns.some(n => p.m[n])).map(p => {
        const on = ns.filter(n => p.m[n]);
        const r = sum(on.map(n => p.m[n][0])), i = sum(on.map(n => p.m[n][1])), v = sum(on.map(n => p.m[n][2]));
        return Object.assign({}, p, { on, r, i, v, taux: r ? i / r : 0 });
      });
  }
  const weeks = () => { const [a, b] = per().w; return Array.from({ length: b - a + 1 }, (_, k) => a + k); };

  // ---------- Graphes ----------
  Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
  Chart.defaults.font.size = 12;
  Chart.defaults.color = '#64748B';
  Chart.defaults.plugins.legend.display = false;
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.animation.duration = 450;
  Object.assign(Chart.defaults.plugins.tooltip, {
    backgroundColor: '#0F172A', titleColor: '#fff', bodyColor: '#E2E8F0', padding: 10, cornerRadius: 10,
    boxPadding: 4, usePointStyle: true, titleFont: { weight: '600' }
  });
  const grid = { color: '#F1F5F9', drawTicks: false }, tick = { padding: 8 };
  const C = {};
  const mk = (id, cfg) => { if (C[id]) C[id].destroy(); const el = document.getElementById(id); if (el) C[id] = new Chart(el, cfg); };
  const alpha = (hex, a) => hex + Math.round(a * 255).toString(16).padStart(2, '0');
  const tipN = { callbacks: { label: c => ' ' + c.dataset.label + ' : ' + fmt(c.parsed.y ?? c.parsed) } };

  function spark(vals, color) {
    const w = 160, h = 34, mx = Math.max(...vals, 1), mn = Math.min(...vals, 0);
    if (vals.length < 2) vals = [vals[0] || 0, vals[0] || 0];
    const pts = vals.map((v, i) => [i / (vals.length - 1) * w, h - 3 - (v - mn) / ((mx - mn) || 1) * (h - 8)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const id = 'g' + Math.random().toString(36).slice(2, 8);
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".25"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${w} ${h} L0 ${h} Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
  }
  const delta = (a, b, unit) => {
    if (b === 0 && a === 0) return `<span class="eq">=</span>`;
    if (!b) return `<span class="up">▲ nouveau</span>`;
    const x = (a - b) / b * 100, s = Math.abs(x).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + NB + '%';
    return x > 0.05 ? `<span class="up">▲ ${s}</span>` : x < -0.05 ? `<span class="dn">▼ ${s}</span>` : `<span class="eq">= ${s}</span>`;
  };

  // ---------- Vue d'ensemble ----------
  function drawEnsemble() {
    drawHero(); drawTopFlop();
    const R = rows(), W = weeks(), ns = nets();
    const wr = W.map(w => sum(R.filter(p => p.w === w).map(p => p.r)));
    const wi = W.map(w => sum(R.filter(p => p.w === w).map(p => p.i)));
    const wv = W.map(w => sum(R.filter(p => p.w === w).map(p => p.v)));
    const ab = w => sum(ns.map(n => D.abonnes[n][w]));
    const abW = W.map(ab), ab0 = W[0] ? ab(W[0] - 1 >= 0 ? W[0] - 1 : 0) : 0;
    const depart = sum(ns.map(n => D.DEPART[n]));
    const start = W[0] === 0 ? depart : ab(W[0] - 1);
    const tr = sum(R.map(p => p.r)), ti = sum(R.map(p => p.i)), tv = sum(R.map(p => p.v));
    const last = W.length - 1, prev = (a) => a.length > 1 ? a[last - 1] : 0;
    const K = [
      ['users', '#0EA5E9', 'Abonnés, ' + (F.net === 'tous' ? 'tous réseaux' : NET[F.net].n), fmt(abW[last]),
        `<span class="up">▲ +${fmt(abW[last] - start)}</span> sur la période`, abW],
      ['eye', '#E95B0F', 'Personnes atteintes', fmt(tr), delta(wr[last], prev(wr)) + ' semaine sur semaine', wr],
      ['heart', '#8B5CF6', "Taux d'interaction", pct(ti, tr), fmt(ti) + ' réactions, commentaires, partages', W.map((w, k) => wr[k] ? wi[k] / wr[k] : 0)],
      ['receipt', '#10B981', 'Demandes de devis', fmt(tv), delta(wv[last], prev(wv)) + ' semaine sur semaine', wv],
      ['image', '#F59E0B', 'Publications', fmt(R.length), (R.filter(p => p.src.startsWith('Lancement · publication')).length) + ' du lancement Instagram', W.map(w => R.filter(p => p.w === w).length)]
    ];
    $('#kpis').innerHTML = K.map(k => `<div class="kpi"><div class="kh"><span class="ki" style="background:${alpha(k[1], .12)};color:${k[1]}">${I(k[0])}</span>${k[2]}</div><p class="v">${k[3]}</p><p class="d">${k[4]}</p>${spark(k[5], k[1])}</div>`).join('');

    // Abonnés gagnés : aires empilées
    $('#leg-ab').innerHTML = ns.map(k => `<span><i class="sw" style="background:${NET[k].c}"></i>${NET[k].n}</span>`).join('');
    const lbl = W.map(w => 'S' + (w + 1));
    mk('c-ab', {
      type: 'line',
      data: { labels: lbl, datasets: ns.map((k, j) => ({ label: NET[k].n, data: W.map(w => D.abonnes[k][w] - D.DEPART[k]), borderColor: NET[k].c, backgroundColor: alpha(NET[k].c, .30), fill: j ? '-1' : 'origin', borderWidth: 2.2, pointRadius: 0, pointHoverRadius: 5, tension: .35 })) },
      options: {
        interaction: { mode: 'index', intersect: false },
        plugins: { tooltip: { callbacks: { label: c => ' ' + c.dataset.label + ' : +' + fmt(c.parsed.y) + ' (' + fmt(D.abonnes[ns[c.datasetIndex]][W[c.dataIndex]]) + ' au total)' } } },
        scales: { x: { grid: { display: false }, ticks: tick }, y: { stacked: true, grid, border: { display: false }, ticks: { ...tick, callback: v => '+' + fmt(v) }, beginAtZero: true } }
      }
    });

    // Portée et interactions : histogramme empilé + ligne
    $('#leg-po').innerHTML = ns.map(k => `<span><i class="sw" style="background:${NET[k].c}"></i>${NET[k].n}</span>`).join('') + '<span><i class="sw l" style="background:#E95B0F"></i>Interactions</span>';
    mk('c-po', {
      data: {
        labels: lbl, datasets: ns.map(k => ({ type: 'bar', label: NET[k].n, data: W.map(w => sum(R.filter(p => p.w === w && p.m[k]).map(p => p.m[k][0]))), backgroundColor: NET[k].c, borderRadius: 4, stack: 'p', yAxisID: 'y', order: 2, maxBarThickness: 38 }))
          .concat([{ type: 'line', label: 'Interactions', data: wi, borderColor: '#E95B0F', backgroundColor: '#E95B0F', borderWidth: 2.4, pointRadius: 3, pointBackgroundColor: '#fff', pointBorderWidth: 2, tension: .35, yAxisID: 'y2', order: 1 }])
      },
      options: {
        interaction: { mode: 'index', intersect: false }, plugins: { tooltip: tipN },
        scales: { x: { stacked: true, grid: { display: false }, ticks: tick }, y: { stacked: true, grid, border: { display: false }, ticks: { ...tick, callback: v => fmt(v) }, beginAtZero: true }, y2: { position: 'right', grid: { display: false }, border: { display: false }, ticks: { ...tick, callback: v => fmt(v) }, beginAtZero: true } }
      }
    });

    // Devis par canal : anneau
    const dn = ns.map(k => [k, sum(R.filter(p => p.m[k]).map(p => p.m[k][2]))]).filter(x => x[1] > 0);
    const dt = sum(dn.map(x => x[1]));
    mk('c-dv', {
      type: 'doughnut',
      data: { labels: dn.map(x => NET[x[0]].n), datasets: [{ data: dn.map(x => x[1]), backgroundColor: dn.map(x => NET[x[0]].c), borderColor: '#fff', borderWidth: 3, hoverOffset: 6 }] },
      options: { cutout: '68%', plugins: { tooltip: { callbacks: { label: c => ' ' + c.label + ' : ' + c.parsed + ' (' + pct(c.parsed, dt, 0) + ')' } } } },
      plugins: [{ id: 'mid', afterDraw(ch) { const m = ch.getDatasetMeta(0).data[0]; const { ctx } = ch; const x = m ? m.x : ch.width / 2, y = m ? m.y : ch.height / 2; ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = '#0F172A'; ctx.font = '700 30px Inter, sans-serif'; ctx.fillText(dt, x, y + 6); ctx.fillStyle = '#64748B'; ctx.font = '500 12px Inter, sans-serif'; ctx.fillText('demandes', x, y + 24); ctx.restore(); } }]
    });
    $('#dleg').innerHTML = dn.length ? dn.map(x => `<li>${nd(x[0])}${NET[x[0]].n}<b>${x[1]}</b><span class="pc">${pct(x[1], dt, 0)}</span></li>`).join('') : '<li>Aucune demande sur ce filtre</li>';

    // Devis par gamme : barres horizontales cliquables (le filtre gamme est ignoré ici pour garder la comparaison)
    const Rg = rows({ gam: false });
    const gg = GAMMES.map(g => [g, sum(Rg.filter(p => p.g === g).map(p => p.v))]).sort((a, b) => b[1] - a[1]);
    mk('c-gam', {
      type: 'bar',
      data: { labels: gg.map(x => x[0]), datasets: [{ label: 'Demandes de devis', data: gg.map(x => x[1]), backgroundColor: gg.map(x => F.gam === 'tous' || F.gam === x[0] ? (F.gam === x[0] ? '#E95B0F' : '#0EA5E9') : '#CBD5E1'), borderRadius: 6, maxBarThickness: 26 }] },
      options: {
        indexAxis: 'y', plugins: { tooltip: tipN },
        onClick: (e, el) => { if (el.length) { const g = gg[el[0].index][0]; setF('gam', F.gam === g ? 'tous' : g); } },
        onHover: (e, el) => { e.native.target.style.cursor = el.length ? 'pointer' : 'default'; },
        scales: { x: { grid, border: { display: false }, ticks: { ...tick, precision: 0 }, beginAtZero: true }, y: { grid: { display: false }, ticks: { ...tick, color: '#0F172A', callback: function (v) { const s = this.getLabelForValue(v); return isPhone() && s.length > 20 ? s.slice(0, 19) + '…' : s; } } } }
      },
      plugins: [valueLabels()]
    });

    // Frise : bulles
    const t0 = pd('2026-12-07').getTime(), DAY = 864e5;
    mk('c-fr', {
      type: 'bubble',
      data: {
        datasets: ns.map(k => ({
          label: NET[k].n, backgroundColor: alpha(NET[k].c, .55), borderColor: NET[k].c, borderWidth: 1.5,
          data: R.filter(p => p.m[k]).map(p => ({ x: (pd(p.d).getTime() - t0) / DAY, y: p.m[k][0], r: Math.max(4, Math.min(22, Math.sqrt(p.m[k][1]) * 1.3)), t: p.t, d: p.d, i: p.m[k][1] }))
        }))
      },
      options: {
        plugins: { tooltip: { callbacks: { title: c => fdl(c[0].raw.d), label: c => ' ' + c.dataset.label + ' · ' + c.raw.t, afterLabel: c => '   ' + fmt(c.raw.y) + ' personnes atteintes, ' + fmt(c.raw.i) + ' interactions' } } },
        scales: {
          x: { type: 'linear', min: (pd(per().d[0]).getTime() - t0) / DAY - 1, max: (pd(per().d[1]).getTime() - t0) / DAY + 1, grid: { display: false }, ticks: { ...tick, stepSize: 7, callback: v => { const x = new Date(t0 + v * DAY); return x.getDate() + ' ' + mois[x.getMonth()]; } } },
          y: { type: 'logarithmic', grid, border: { display: false }, ticks: { ...tick, callback: v => [10, 100, 1000, 10000].includes(v) ? fmt(v) : '' } }
        }
      }
    });
  }
  function valueLabels(suffix) {
    return { id: 'vl', afterDatasetsDraw(ch) { const { ctx } = ch; ctx.save(); ctx.font = '600 12px Inter, sans-serif'; ctx.fillStyle = '#0F172A'; ctx.textBaseline = 'middle';
      ch.getDatasetMeta(0).data.forEach((b, i) => { const v = ch.data.datasets[0].data[i]; const s = (typeof v === 'number' ? fmt(v) : v) + (suffix || ''); const w = ctx.measureText(s).width; const inside = b.x + w + 10 > ch.chartArea.right; ctx.fillStyle = inside ? '#fff' : '#0F172A'; ctx.textAlign = inside ? 'right' : 'left'; ctx.fillText(s, inside ? b.x - 6 : b.x + 6, b.y); });
      ctx.restore(); } };
  }

  // ---------- Publications ----------
  let mode = 'mur', tri = 'date', WALL = [];
  $('#wall').addEventListener('click', e => { const c = e.target.closest('[data-ix]'); if (c) openPost(WALL, +c.dataset.ix); });
  $('#wall').addEventListener('keydown', e => { const c = e.target.closest('[data-ix]'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openPost(WALL, +c.dataset.ix); } });
  $('#mode').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; mode = b.dataset.m; $$('#mode button').forEach(x => x.classList.toggle('on', x === b)); drawPubs(); });
  $('#tbl tbody').addEventListener('click', e => { const c = e.target.closest('[data-ix]'); if (c) openPost(WALL, +c.dataset.ix); });
  $('#tri').addEventListener('change', e => { tri = e.target.value; drawPubs(); });
  function drawPubs() {
    let R = rows();
    const key = { date: p => p.d + String(p.h).padStart(2, '0'), portee: p => -p.r, taux: p => -p.taux, devis: p => -p.v * 1e6 - p.r }[tri];
    R = R.slice().sort((a, b) => key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0);
    const best = R.length ? Math.max(...R.map(r => r.taux)) : 0;
    $('#cnt').innerHTML = `<b>${R.length}</b> publication${R.length > 1 ? 's' : ''} · <b>${fmt(sum(R.map(p => p.r)))}</b> personnes atteintes · <b>${sum(R.map(p => p.v))}</b> demandes de devis`;
    $('#wall').hidden = mode !== 'mur'; $('#tbox').hidden = mode !== 'table';
    if (mode === 'mur') {
      $('#wall').innerHTML = R.length ? R.map((p, ix) => `<article class="pc-card" data-ix="${ix}" tabindex="0" role="button" aria-label="Ouvrir la publication">
        <div class="pc-im${p.img ? '' : ' wa'}"${p.img ? ` style="--im:url(../${p.img})"` : ''}>${p.img ? '' : I('message-circle')}
          <div class="pc-nets">${p.on.map(nd).join('')}</div><span class="pc-ty">${p.ty}</span>
          <span class="pc-reach">${I('eye')}${fmt(p.r)}</span>${p.taux === best && R.length > 1 ? '<span class="pc-best">Meilleur taux</span>' : ''}</div>
        <div class="pc-b"><p class="pc-d">${fdl(p.d)} · ${p.h}${NB}h</p><p class="pc-t">${p.t}</p><p class="pc-s">${p.src} · ${p.g}</p>
          <div class="pc-m"><span>${I('heart')} <b>${pct(p.i, p.r)}</b></span><span><b>${fmt(p.i)}</b> interactions</span><span><b>${p.v}</b> devis</span></div></div></article>`).join('')
        : '<p class="empty">Aucune publication ne correspond à ces filtres.</p>';
      paintIcons($('#wall')); WALL = R;
    } else {
      $('#tbl tbody').innerHTML = R.map((p, ix) => `<tr data-ix="${ix}" class="clk"><td class="dt">${fd(p.d)}</td><td class="c-net"><span class="net">${p.on.map(nd).join('')}</span></td>
        <td class="c-t"><span class="tt">${p.t}</span><span class="ts">${p.ty} · ${p.src}</span></td>
        <td class="n" data-l="Portée">${fmt(p.r)}</td><td class="n" data-l="Interactions">${fmt(p.i)}</td>
        <td class="n${p.taux === best ? ' hi' : ''}" data-l="Taux">${pct(p.i, p.r)}</td><td class="n" data-l="Devis"><span class="pill${p.v ? '' : ' z'}">${p.v}</span></td></tr>`).join('');
      WALL = R;
      const tr = sum(R.map(r => r.r)), ti = sum(R.map(r => r.i)), tv = sum(R.map(r => r.v));
      $('#tbl tfoot').innerHTML = `<tr><td class="dt"></td><td class="c-net"></td><td class="c-t">Total, ${R.length} publication${R.length > 1 ? 's' : ''}</td><td class="n" data-l="Portée">${fmt(tr)}</td><td class="n" data-l="Interactions">${fmt(ti)}</td><td class="n" data-l="Taux">${pct(ti, tr)}</td><td class="n" data-l="Devis"><span class="pill">${tv}</span></td></tr>`;
    }
    const pe = R.filter(p => p.pe), pr = R.filter(p => !p.pe && p.ty !== 'Message WhatsApp');
    const rp = sum(pe.map(p => p.i)) / (sum(pe.map(p => p.r)) || 1), rr = sum(pr.map(p => p.i)) / (sum(pr.map(p => p.r)) || 1);
    $('#insight').innerHTML = pe.length && pr.length ? `${I('sparkles')}<p><b>Ce que le tableau ferait ressortir :</b> les ${pe.length} publications qui montrent des personnes (équipe, atelier, SACRI Academy, témoignage) atteignent un taux d'interaction de ${pct(rp * 100, 100)}, contre ${pct(rr * 100, 100)} pour les publications produit. C'est la même tendance que celle relevée sur LinkedIn le 16/11 (29 réactions contre 3).</p>` : `${I('info')}<p>Élargissez les filtres pour comparer les publications avec des personnes et les publications produit.</p>`;
  }


  // ---------- Pourquoi ça marche, pourquoi ça ne marche pas ----------
  const GOOD = { facebook: [19, 20, 21], linkedin: [8, 9], instagram: [19, 20, 21], whatsapp: [10, 11] };
  const BEST_H = { facebook: '19 h', linkedin: '8 h ou 9 h', instagram: '19 h à 21 h', whatsapp: '10 h' };
  function why(p, good) {
    const n = p.on[0], okH = p.on.every(k => GOOD[k].includes(p.h)), long = (p.cap || '').length > 260;
    if (good) {
      if (p.pe && okH) return `Des visages en situation, publiés à ${p.h}${NB}h, au moment où la communauté est en ligne : c'est la combinaison qui fait réagir.`;
      if (p.pe) return `Une personne au travail plutôt qu'une machine posée : les publications avec des visages font presque deux fois plus réagir.`;
      if (p.ty === 'Sondage') return `Une question simple, des choix courts : le sondage invite à répondre, et chaque vote compte comme une interaction.`;
      if (p.ty === 'Reel' || p.ty === 'Carrousel') return `Le format ${p.ty === 'Reel' ? 'vidéo courte' : 'carrousel'} est poussé par l'algorithme et retient plus longtemps, publié à ${p.h}${NB}h, le bon créneau.`;
      if (okH) return `Publiée à ${p.h}${NB}h, le meilleur créneau sur ${NET[n].n}, avec un message court et une seule idée.`;
      return `Un sujet utile et concret, qui se partage : la portée vient des partages plus que des abonnés.`;
    }
    if (p.ty === 'Story') return `Une story disparaît en 24${NB}h et n'est vue que par les abonnés : utile pour la relation, pas pour la portée.`;
    if (!okH) return `Publiée à ${p.h}${NB}h, hors du créneau où la communauté est en ligne (${BEST_H[n]} sur ${NET[n].n}) : elle a été vue par moins de monde.`;
    if (long) return `Une légende de ${(p.cap || '').length} caractères : trop longue pour un téléphone, on décroche avant l'appel à l'action.`;
    if (!p.pe) return `Pas de personne visible, seulement le produit ou un logo : rien à quoi s'identifier, donc peu de réactions.`;
    return `Un sujet institutionnel, sans appel à l'action : on le regarde, on ne répond pas.`;
  }

  // ---------- Fenêtre « publication » ----------
  const HANDLE = { facebook: 'SACRI', linkedin: "SACRI CÔTE D'IVOIRE", instagram: 'sacri.ci', whatsapp: 'SACRI · liste de diffusion' };
  const split = (i, k) => { const c = Math.round(i * (k === 'linkedin' ? .12 : .14)), sh = Math.round(i * (k === 'instagram' ? .05 : .09)); return [i - c - sh, c, sh]; };
  let LIST = [], CUR = 0;
  function openPost(list, idx) { LIST = list; CUR = idx; renderPost(); $('#mdl').hidden = false; document.body.classList.add('noscroll'); }
  function closePost() { $('#mdl').hidden = true; document.body.classList.remove('noscroll'); }
  function renderPost() {
    const p = LIST[CUR]; if (!p) return;
    const k = p.on[0], m = p.m[k] || [p.r, p.i, p.v], [lk, cm, sh] = split(m[1], k);
    const head = `<div class="pp-h"><span class="pp-av"><img src="assets/logo-sacri.png" alt=""></span><div><b>${HANDLE[k]}</b>${k === 'instagram' ? '' : ' ' + I('badge-check', 'vf')}<span>${fdl(p.d)} à ${p.h}${NB}h · ${NET[k].n}</span></div><span class="pp-net" style="background:${NET[k].c}">${I(NET[k].i)}</span></div>`;
    const cap = (p.cap || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
    let body;
    if (k === 'whatsapp') {
      body = `<div class="pp-wa">${p.img ? `<img src="${p.img}" alt="">` : ''}<p>${cap}</p><span class="pp-wt">${p.h}:00 ✓✓</span></div>`;
    } else {
      const capb = k === 'instagram' ? `<p class="pp-cap"><b>sacri.ci</b> ${cap}</p>` : `<p class="pp-cap">${cap}</p>`;
      body = (k === 'instagram' ? '' : capb) + (p.img ? `<div class="pp-img"><img src="${p.img}" alt="${p.t.replace(/"/g, '')}">${p.ty === 'Carrousel' ? '<span class="pp-car">1/4</span>' : ''}${p.ty === 'Reel' ? '<span class="pp-play">' + I('play') + '</span>' : ''}</div>` : '') +
        `<div class="pp-act"><span>${I(k === 'linkedin' ? 'thumbs-up' : 'heart')}<b>${fmt(lk)}</b></span><span>${I('message-square')}<b>${fmt(cm)}</b></span><span>${I(k === 'instagram' ? 'send' : 'share-2')}<b>${fmt(sh)}</b></span>${k === 'instagram' ? '<span class="r">' + I('bookmark') + '</span>' : ''}</div>` +
        (k === 'instagram' ? capb : '');
    }
    const others = p.on.length > 1 ? `<p class="pp-also">Aussi publiée sur ${p.on.slice(1).map(x => NET[x].n).join(' et ')} : chiffres additionnés ci-dessous.</p>` : '';
    const isTop = TOPS.includes(p), isFlop = FLOPS.includes(p);
    $('#m-box').innerHTML = `<div class="pp ${k}">${head}${body}</div>
      <aside class="pp-side"><span class="pill-demo"><i data-i="info"></i>Données de démonstration</span>
        <p class="pp-k">${CUR + 1} / ${LIST.length}</p><h3>${p.t}</h3><p class="pp-src">${p.ty} · ${p.src} · ${p.g}</p>
        <div class="pp-st"><div><b>${fmt(p.r)}</b><span>personnes atteintes</span></div><div><b>${fmt(p.i)}</b><span>interactions</span></div><div><b>${pct(p.i, p.r)}</b><span>taux d'interaction</span></div><div><b>${p.v}</b><span>demandes de devis</span></div></div>
        ${others}
        <div class="pp-why ${isFlop ? 'bad' : ''}">${I(isFlop ? 'trending-down' : 'trending-up')}<p><b>${isFlop ? "Pourquoi ça n'a pas marché" : isTop ? 'Pourquoi ça a marché' : 'À retenir'}</b>${why(p, !isFlop)}</p></div>
        <p class="pp-kb">Flèches du clavier pour naviguer, Échap pour fermer.</p></aside>`;
    paintIcons($('#m-box'));
    $('#m-prev').disabled = CUR === 0; $('#m-next').disabled = CUR === LIST.length - 1;
  }
  $('#m-prev').addEventListener('click', () => { if (CUR > 0) { CUR--; renderPost(); } });
  $('#m-next').addEventListener('click', () => { if (CUR < LIST.length - 1) { CUR++; renderPost(); } });
  $$('#mdl [data-x]').forEach(b => b.addEventListener('click', closePost));
  document.addEventListener('keydown', e => {
    if ($('#mdl').hidden) return;
    if (e.key === 'Escape') closePost();
    if (e.key === 'ArrowLeft') $('#m-prev').click();
    if (e.key === 'ArrowRight') $('#m-next').click();
  });
  let tx0 = null;
  $('#m-box').addEventListener('touchstart', e => { tx0 = e.touches[0].clientX; }, { passive: true });
  $('#m-box').addEventListener('touchend', e => { if (tx0 === null) return; const dx = e.changedTouches[0].clientX - tx0; if (Math.abs(dx) > 60) (dx < 0 ? $('#m-next') : $('#m-prev')).click(); tx0 = null; });

  // ---------- Top 3 / Flop 3 ----------
  let TOPS = [], FLOPS = [];
  function drawTopFlop() {
    const R = rows().filter(p => p.img && p.ty !== 'Message WhatsApp' && p.r > 0);
    const S2 = R.slice().sort((a, b) => b.taux - a.taux || b.r - a.r);
    TOPS = S2.slice(0, 3); FLOPS = S2.length > 3 ? S2.slice(-3).reverse() : [];
    const card = (p, k, bad) => `<button class="tfc${bad ? ' bad' : ''}" data-tf="${bad ? 'f' : 't'}${k}">
      <span class="tfi" style="--im:url(../${p.img})"><span class="tfr">${bad ? '' : '#'}${bad ? I('trending-down') : k + 1}</span><span class="tfn">${p.on.map(nd).join('')}</span></span>
      <span class="tfb"><span class="tft">${p.t}</span><span class="tfm"><span>${I('eye')}<b>${fmt(p.r)}</b> atteintes</span><span>${I('heart')}<b>${fmt(p.i)}</b> · ${pct(p.i, p.r)}</span></span>
      <span class="tfw">${why(p, !bad)}</span></span></button>`;
    $('#tf').innerHTML = TOPS.length ? `<div class="tfh top"><p class="ct">${I('trophy')}Top 3 des publications</p><p class="cs">Meilleur taux d'interaction sur les filtres choisis</p></div><div class="tfl">${TOPS.map((p, k) => card(p, k, false)).join('')}</div>` +
      (FLOPS.length ? `<div class="tfh flop"><p class="ct">${I('trending-down')}Flop 3</p><p class="cs">Les trois plus faibles, et ce qu'il faut changer</p></div><div class="tfl">${FLOPS.map((p, k) => card(p, k, true)).join('')}</div>` : '') : '';
    paintIcons($('#tf'));
  }
  $('#tf').addEventListener('click', e => { const b = e.target.closest('[data-tf]'); if (!b) return; const l = TOPS.concat(FLOPS); openPost(l, (b.dataset.tf[0] === 't' ? 0 : TOPS.length) + Number(b.dataset.tf.slice(1))); });

  // ---------- Bandeau de marque ----------
  function drawHero() {
    const tot = sum(NETS.map(n => D.abonnes[n][7])), dep = sum(NETS.map(n => D.DEPART[n]));
    $('#hero-k').innerHTML = `<b>${fmt(tot)}</b> abonnés sur 4 réseaux · <b>+${fmt(tot - dep)}</b> en 8 semaines · <b>${D.pubs.length}</b> publications`;
    $('#ribbon').innerHTML = D.ruban.map(r => `<figure class="rb"><img src="${r.i}" alt="" loading="lazy"><figcaption>${r.t}</figcaption></figure>`).join('');
  }

  // ---------- Avant, après ----------
  function drawAvap() {
    $('#avap').innerHTML = D.avap.map((x, k) => `<article class="av">
      <div class="av-s"><p class="av-l b">${I('arrow-left-right')}Avant · Reel du ${x.d}</p>
        <a class="av-im a" href="${x.url}" target="_blank" rel="noopener" style="background-image:url(${x.a})"><span class="av-real">Réel</span><span class="av-v">${I('play')}${fmt(x.v)} vues</span></a>
        <p class="av-t">${x.sj}</p><p class="av-m">${fmt(x.v)} vues · ${x.r == null ? 'réactions non affichées' : x.r + ' réactions'} · ${x.s} partage${x.s > 1 ? 's' : ''} <a href="${x.url}" target="_blank" rel="noopener">${I('external-link')}Voir sur Facebook</a></p></div>
      <div class="av-arrow">${I('chevron-right')}</div>
      <div class="av-s"><p class="av-l n">${I('sparkles')}Après · nouvelle série</p>
        <div class="av-im" style="background-image:url(${x.b})"></div>
        <p class="av-t">${x.t}</p><p class="av-w">${x.why}</p></div></article>`).join('');
    paintIcons($('#avap'));
  }

  // ---------- Meilleurs moments ----------
  function drawMoments() {
    const ns = nets(), H = D.heat, v = H.jours.map((_, j) => H.slots.map((_, s) => Math.round(sum(ns.map(n => H.v[n][j][s])) / ns.length)));
    const col = x => { const t = x / 100; const st = [[255, 247, 237], [253, 186, 116], [233, 91, 15], [154, 52, 18]]; const p = Math.min(2.999, t * 3), i = Math.floor(p), f = p - i; const c = st[i].map((a, k) => Math.round(a + (st[i + 1][k] - a) * f)); return `rgb(${c})`; };
    $('#hm-s').textContent = (F.net === 'tous' ? 'Moyenne des 4 réseaux' : NET[F.net].n) + ', heure d\'Abidjan';
    $('#hm').innerHTML = '<span></span>' + H.slots.map(s => `<span class="hc">${s}</span>`).join('') +
      H.jours.map((j, a) => `<span class="hl">${j}</span>` + v[a].map((x, b) => `<span class="c" style="background:${col(x)};color:${x > 55 ? '#fff' : '#9A3412'}" title="${j} ${H.slots[b]} : indice ${x} sur 100">${x}</span>`).join('')).join('');
    const all = []; v.forEach((r, a) => r.forEach((x, b) => all.push([a, b, x])));
    all.sort((a, b) => b[2] - a[2]);
    const J = { Lun: 'Lundi', Mar: 'Mardi', Mer: 'Mercredi', Jeu: 'Jeudi', Ven: 'Vendredi', Sam: 'Samedi', Dim: 'Dimanche' };
    $('#top').innerHTML = all.slice(0, 5).map((x, k) => `<li><span class="r">${k + 1}</span><div class="tx"><b>${J[H.jours[x[0]]]}, ${H.slots[x[1]]}</b><div class="bar2"><i style="width:${x[2]}%"></i></div></div><span class="s">${x[2]}</span></li>`).join('');
    const R = rows({ typ: false });
    const ty = TYPES.map(t => { const x = R.filter(p => p.ty === t); return [t, x.length ? +(sum(x.map(p => p.i)) / sum(x.map(p => p.r)) * 100).toFixed(1) : 0, x.length]; }).filter(x => x[2]).sort((a, b) => b[1] - a[1]);
    const pal = ['#E95B0F', '#0EA5E9', '#10B981', '#8B5CF6', '#F59E0B', '#64748B'];
    mk('c-ty', {
      type: 'bar',
      data: { labels: ty.map(x => x[0]), datasets: [{ label: "Taux d'interaction", data: ty.map(x => x[1]), backgroundColor: ty.map((x, i) => F.typ === 'tous' || F.typ === x[0] ? pal[i % 6] : '#CBD5E1'), borderRadius: 6, maxBarThickness: 26 }] },
      options: { indexAxis: 'y', plugins: { tooltip: { callbacks: { label: c => ' ' + pct(c.parsed.x, 100) + ' sur ' + ty[c.dataIndex][2] + ' publication' + (ty[c.dataIndex][2] > 1 ? 's' : '') } } },
        scales: { x: { grid, border: { display: false }, ticks: { ...tick, callback: v => v + NB + '%' }, beginAtZero: true }, y: { grid: { display: false }, ticks: { ...tick, color: '#0F172A' } } } },
      plugins: [valueLabels(NB + '%')]
    });
  }

  // ---------- Comparables ----------
  let cmpN = 'facebook';
  $('#cmp-n').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cmpN = b.dataset.n; $$('#cmp-n button').forEach(x => x.classList.toggle('on', x === b)); drawCmp(); });
  function drawCmp() {
    const L = D.comparables.filter(x => cmpN === 'tous' || x[1] === cmpN).slice().sort((a, b) => b[2] - a[2]);
    const others = L.filter(x => x[0] !== 'SACRI');
    $('#cmp-s').textContent = (cmpN === 'tous' ? 'Facebook et LinkedIn' : NET[cmpN].n) + ' · ' + others.length + ' comparable' + (others.length > 1 ? 's' : '') + ' sur 8';
    const lab = x => x[0] + (cmpN === 'tous' ? ' · ' + NET[x[1]].n : '');
    $('.ch-cmp').style.height = Math.max(200, L.length * (isPhone() ? 40 : 44) + 40) + 'px';
    mk('c-cmp', {
      type: 'bar',
      data: { labels: L.map(lab), datasets: [{ label: 'Abonnés', data: L.map(x => x[2]), backgroundColor: L.map(x => x[0] === 'SACRI' ? '#E95B0F' : (x[1] === 'linkedin' ? '#8B5CF6' : '#0EA5E9')), borderRadius: 6, maxBarThickness: 26 }] },
      options: { indexAxis: 'y',
        plugins: { tooltip: { callbacks: { label: c => ' ' + fmt(c.parsed.x) + ' abonnés', afterLabel: c => '   relevé : ' + L[c.dataIndex][3] } } },
        scales: { x: { grid, border: { display: false }, ticks: { ...tick, callback: v => v >= 1000 ? fmt(v / 1000) + NB + 'k' : fmt(v) }, beginAtZero: true },
          y: { grid: { display: false }, ticks: { ...tick, color: '#0F172A', font: c => ({ weight: /^SACRI/.test(c.tick && c.tick.label) ? '700' : '500' }), callback: function (v) { const s = this.getLabelForValue(v); return isPhone() && s.length > 18 ? s.slice(0, 17) + '…' : s; } } } } },
      plugins: [valueLabels()]
    });
  }

  // ---------- SARA ----------
  function drawSara() {
    const S = D.sara, E = S.entonnoir, tv = S.votes.facebook + S.votes.linkedin;
    const K = [['megaphone', '#E95B0F', 'Votes au sondage', fmt(tv), `${S.votes.facebook} Facebook, ${S.votes.linkedin} LinkedIn`],
      ['users-round', '#0EA5E9', 'Invitations envoyées', fmt(E[0][1]), 'WhatsApp et e-mail'],
      ['tent', '#10B981', 'Visites au stand annoncées', fmt(E[3][1]), pct(E[3][1], E[0][1]) + ' des invités'],
      ['target', '#8B5CF6', 'Rendez-vous commerciaux', fmt(E[4][1]), 'à tenir pendant le salon']];
    $('#sara-k').innerHTML = K.map(k => `<div class="kpi"><div class="kh"><span class="ki" style="background:${alpha(k[1], .12)};color:${k[1]}">${I(k[0])}</span>${k[2]}</div><p class="v">${k[3]}</p><p class="d">${k[4]}</p></div>`).join('');
    mk('c-vote', { type: 'pie', data: { labels: ['Facebook', 'LinkedIn'], datasets: [{ data: [S.votes.facebook, S.votes.linkedin], backgroundColor: [NET.facebook.c, NET.linkedin.c], borderColor: '#fff', borderWidth: 3 }] },
      options: { plugins: { legend: { display: true, position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: c => ' ' + c.label + ' : ' + c.parsed + ' votes (' + pct(c.parsed, tv, 0) + ')' } } } } });
    mk('c-sond', { type: 'bar', data: { labels: S.sondage.map(x => x[0]), datasets: [{ label: 'Part des votes', data: S.sondage.map(x => x[1]), backgroundColor: ['#E95B0F', '#0EA5E9', '#10B981', '#8B5CF6'], borderRadius: 6, maxBarThickness: 26 }] },
      options: { indexAxis: 'y', plugins: { tooltip: { callbacks: { label: c => ' ' + c.parsed.x + NB + '% des votes' } } },
        scales: { x: { grid, border: { display: false }, max: 50, ticks: { ...tick, callback: v => v + NB + '%' } }, y: { grid: { display: false }, ticks: { ...tick, color: '#0F172A', callback: function (v) { const s = this.getLabelForValue(v); return isPhone() ? s.replace('STIHL ', '') : s; } } } } },
      plugins: [valueLabels(NB + '%')] });
    const pal = ['#0F172A', '#334155', '#0EA5E9', '#10B981', '#E95B0F'];
    $('#funnel').innerHTML = E.map((s, i) => `<div class="fs"><span class="lb">${s[0]}</span><div class="fb2"><div class="ff" style="width:${(s[1] / E[0][1] * 100).toFixed(1)}%;background:${pal[i]}">${s[1]}</div></div><span class="pc">${i ? pct(s[1], E[0][1], 0) : '100' + NB + '%'}</span></div>`).join('');
  }

  // ---------- Navigation ----------
  const VIEWS = { ensemble: "Vue d'ensemble", publications: 'Publications', avap: 'Avant, après', moments: 'Meilleurs moments', comparables: 'Comparables', sara: 'Salon SARA' };
  let view = 'ensemble';
  function go(v, push) {
    if (!VIEWS[v]) v = 'ensemble'; view = v;
    $$('.view').forEach(x => x.classList.toggle('on', x.id === 'v-' + v));
    $$('[data-v]').forEach(x => x.classList.toggle('on', x.dataset.v === v));
    $('#crumb').textContent = VIEWS[v];
    if (push) { history.replaceState(null, '', v === 'ensemble' ? location.pathname : '#' + v); window.scrollTo(0, 0); }
    draw();
  }
  $$('[data-v]').forEach(b => b.addEventListener('click', () => go(b.dataset.v, true)));
  window.addEventListener('hashchange', () => go(location.hash.slice(1), false));
  function draw() {
    $('#k-pub').textContent = rows().length;
    ({ ensemble: drawEnsemble, publications: drawPubs, avap: drawAvap, moments: drawMoments, comparables: drawCmp, sara: drawSara })[view]();
  }
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(draw, 200); });
  paintIcons();
  syncF();
  go(location.hash.slice(1) || 'ensemble', false);
  window.__F = F; window.__setF = setF; window.__go = go;
})();

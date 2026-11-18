(function () {
  const D = window.D;
  const fmt = n => n.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, '\u00a0');
  const pct = (a, b) => (b ? (a / b * 100) : 0).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '\u00a0%';
  const sum = a => a.reduce((x, y) => x + y, 0);
  const NET = {
    facebook: { n: 'Facebook', c: '#1877F2' },
    linkedin: { n: 'LinkedIn', c: '#0B2E4F' },
    instagram: { n: 'Instagram', c: '#D62976' },
    whatsapp: { n: 'WhatsApp', c: '#25A244' }
  };
  const ICO = {
    facebook: '<svg viewBox="0 0 16 16"><path d="M9.2 16V8.7h2.4l.4-2.8H9.2V4.1c0-.8.2-1.4 1.4-1.4H12V.1C11.8.1 10.9 0 9.9 0 7.8 0 6.4 1.3 6.4 3.6v2.3H4v2.8h2.4V16z"/></svg>',
    linkedin: '<svg viewBox="0 0 16 16"><path d="M.4 5.3h3.3V16H.4zM2 0a1.9 1.9 0 1 1 0 3.8A1.9 1.9 0 0 1 2 0zm3.7 5.3h3.2v1.5c.4-.8 1.5-1.7 3.1-1.7 3.3 0 4 2.2 4 5V16h-3.3v-5.2c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V16H5.7z"/></svg>',
    instagram: '<svg viewBox="0 0 16 16"><path d="M8 1.4c2.1 0 2.4 0 3.2.1 2.2.1 3.2 1.1 3.3 3.3v6.4c-.1 2.2-1.1 3.2-3.3 3.3H4.8c-2.2-.1-3.2-1.1-3.3-3.3V4.8c.1-2.2 1.1-3.2 3.3-3.3C5.6 1.4 5.9 1.4 8 1.4M8 0C5.8 0 5.6 0 4.7.1 1.8.2.2 1.8.1 4.7 0 5.6 0 5.8 0 8s0 2.4.1 3.3c.1 2.9 1.7 4.5 4.6 4.6.9.1 1.1.1 3.3.1s2.4 0 3.3-.1c2.9-.1 4.5-1.7 4.6-4.6.1-.9.1-1.1.1-3.3s0-2.4-.1-3.3C15.8 1.8 14.2.2 11.3.1 10.4 0 10.2 0 8 0zm0 3.9a4.1 4.1 0 1 0 0 8.2 4.1 4.1 0 0 0 0-8.2zm0 6.8a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4zm4.3-7.9a1 1 0 1 0 0 1.9 1 1 0 0 0 0-1.9z"/></svg>',
    whatsapp: '<svg viewBox="0 0 16 16"><path d="M13.6 2.3A7.8 7.8 0 0 0 1.3 11.8L0 16l4.3-1.1a7.8 7.8 0 0 0 3.7.9 7.8 7.8 0 0 0 5.6-13.5zM8 14.4a6.5 6.5 0 0 1-3.3-.9l-.2-.1-2.6.7.7-2.5-.2-.3a6.5 6.5 0 1 1 5.6 3.1zm3.6-4.9c-.2-.1-1.2-.6-1.3-.6s-.3-.1-.4.1l-.6.8c-.1.1-.2.1-.4 0a5.3 5.3 0 0 1-2.6-2.3c-.2-.3.2-.3.6-1.1.1-.1 0-.3 0-.4l-.6-1.4c-.2-.4-.3-.3-.4-.3h-.4a.7.7 0 0 0-.5.2 2.2 2.2 0 0 0-.7 1.6c0 1 .7 1.9.8 2s1.4 2.1 3.3 2.9c1.2.5 1.7.6 2.3.5.4-.1 1.2-.5 1.3-1s.2-.9.1-1z"/></svg>'
  };
  const ico = k => `<span class="ico ${({ facebook: 'fb', linkedin: 'li', instagram: 'ig', whatsapp: 'wa' })[k]}">${ICO[k]}</span>`;
  document.querySelectorAll('[data-ico]').forEach(e => { e.innerHTML = ICO[e.dataset.ico]; });

  Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
  Chart.defaults.font.size = 12;
  Chart.defaults.color = '#878480';
  Chart.defaults.plugins.legend.display = false;
  Chart.defaults.maintainAspectRatio = false;
  const grid = { color: '#EFEEEC', drawTicks: false };
  const tick = { padding: 8 };
  const tf = { callbacks: { label: c => ' ' + c.dataset.label + ' : ' + fmt(c.parsed.y ?? c.parsed) } };

  // --- KPI
  const A = D.abonnes, S = D.semaines.length - 1;
  const totAb0 = D.DEPART.facebook + D.DEPART.linkedin;
  const totAbF = A.facebook[S] + A.linkedin[S] + A.instagram[S] + A.whatsapp[S];
  const nets = Object.keys(NET);
  const totP = sum(nets.map(k => sum(D.portee[k])));
  const totI = sum(nets.map(k => sum(D.interactions[k])));
  const totDev = sum(D.devisSemaine);
  const sondageVotes = D.sara.votes.facebook + D.sara.votes.linkedin;
  const kpis = [
    ['Abonnés, tous réseaux', fmt(totAbF), `<span class="up">+${fmt(totAbF - totAb0)}</span> depuis le relevé du 16/11`],
    ['Personnes atteintes', fmt(totP), 'cumul des 8 semaines'],
    ["Taux d'interaction", pct(totI, totP), fmt(totI) + ' réactions, commentaires, partages'],
    ['Demandes de devis', fmt(totDev), `dont <b>${D.devisSemaine[S]}</b> en semaine 8`],
    ['Nouveaux contacts', fmt(A.instagram[S] + A.whatsapp[S]), 'abonnés Instagram et inscrits WhatsApp']
  ];
  document.getElementById('kpis').innerHTML = kpis.map(k => `<div class="kpi"><p class="l">${k[0]}</p><p class="v">${k[1]}</p><p class="d">${k[2]}</p></div>`).join('');

  // --- Abonnés
  document.getElementById('leg-ab').innerHTML = nets.map(k => `<span><i class="sw" style="background:${NET[k].c}"></i>${NET[k].n}</span>`).join('');
  const lbl = D.semaines.map(s => s.split(' · ')[0]);
  const fullLbl = ['Départ'].concat(lbl);
  new Chart(document.getElementById('c-abonnes'), {
    type: 'line',
    data: {
      labels: fullLbl,
      datasets: nets.map(k => ({
        label: NET[k].n, data: [D.DEPART[k]].concat(A[k]), borderColor: NET[k].c, backgroundColor: NET[k].c,
        borderWidth: 2.4, pointRadius: 2.5, pointHoverRadius: 5, tension: .3, yAxisID: k === 'facebook' ? 'y2' : 'y',
        borderDash: k === 'facebook' ? [5, 4] : []
      }))
    },
    options: {
      interaction: { mode: 'index', intersect: false }, plugins: { tooltip: tf },
      scales: {
        x: { grid: { display: false }, ticks: tick },
        y: { position: 'left', grid, ticks: { ...tick, callback: v => fmt(v) }, beginAtZero: true, title: { display: true, text: 'LinkedIn, Instagram, WhatsApp' } },
        y2: { position: 'right', grid: { display: false }, ticks: { ...tick, callback: v => fmt(v) }, suggestedMin: 29400, title: { display: true, text: 'Facebook' } }
      }
    }
  });

  // --- Portée et interactions
  const pw = lbl.map((_, i) => sum(nets.map(k => D.portee[k][i])));
  const iw = lbl.map((_, i) => sum(nets.map(k => D.interactions[k][i])));
  new Chart(document.getElementById('c-portee'), {
    data: {
      labels: lbl,
      datasets: [
        { type: 'bar', label: 'Personnes atteintes', data: pw, backgroundColor: '#E95B0F', borderRadius: 4, yAxisID: 'y', order: 2 },
        { type: 'line', label: 'Interactions', data: iw, borderColor: '#3A3936', backgroundColor: '#3A3936', borderWidth: 2.4, pointRadius: 3, tension: .3, yAxisID: 'y2', order: 1 }
      ]
    },
    options: {
      interaction: { mode: 'index', intersect: false }, plugins: { tooltip: tf },
      scales: {
        x: { grid: { display: false }, ticks: tick },
        y: { grid, ticks: { ...tick, callback: v => fmt(v) }, beginAtZero: true },
        y2: { position: 'right', grid: { display: false }, ticks: { ...tick, callback: v => fmt(v) }, beginAtZero: true }
      }
    }
  });

  // --- Devis par réseau
  const dr = Object.entries(D.devisReseau);
  new Chart(document.getElementById('c-devis'), {
    type: 'doughnut',
    data: { labels: dr.map(x => NET[x[0]].n), datasets: [{ label: 'Demandes', data: dr.map(x => x[1]), backgroundColor: dr.map(x => NET[x[0]].c), borderColor: '#fff', borderWidth: 3 }] },
    options: { cutout: '64%', plugins: { tooltip: { callbacks: { label: c => ' ' + c.label + ' : ' + c.parsed } } } },
    plugins: [{ id: 'mid', afterDraw(ch) { const { ctx } = ch, m = ch.getDatasetMeta(0).data[0]; if (!m) return; ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = '#1F1F1F'; ctx.font = '700 30px Inter, sans-serif'; ctx.fillText(totDev, m.x, m.y + 6); ctx.fillStyle = '#878480'; ctx.font = '500 12px Inter, sans-serif'; ctx.fillText('demandes', m.x, m.y + 24); ctx.restore(); } }]
  });
  document.getElementById('dleg').innerHTML = dr.map(x => `<li>${ico(x[0])}${NET[x[0]].n}<b>${x[1]}</b><span class="pc">${Math.round(x[1] / totDev * 100)}\u00a0%</span></li>`).join('');

  const bars = (id, rows, unit, alt) => {
    const mx = Math.max(...rows.map(r => r[1]));
    document.getElementById(id).innerHTML = rows.map(r => `<div class="bar${alt ? ' alt' : ''}"><div class="bl"><span>${r[0]}</span><b>${r[1]}${unit || ''}</b></div><div class="bt"><div class="bf" style="width:${(r[1] / mx * 100).toFixed(1)}%"></div></div></div>`).join('');
  };
  bars('gammes', D.devisGamme);

  // --- Publications
  let filtre = 'tous', tri = 'date';
  const P = D.pubs.map(p => ({ ...p, taux: p.i / p.p }));
  const counts = { tous: P.length };
  nets.forEach(k => counts[k] = P.filter(p => p.r === k).length);
  const chips = document.getElementById('chips');
  chips.innerHTML = `<button class="all on" data-k="tous" role="tab">Tous <span class="c">${counts.tous}</span></button>` +
    nets.map(k => `<button data-k="${k}" role="tab">${ico(k)}${NET[k].n} <span class="c">${counts[k]}</span></button>`).join('');
  chips.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    filtre = b.dataset.k; chips.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); render();
  });
  document.getElementById('tri').addEventListener('change', e => { tri = e.target.value; render(); });
  const mois = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const fd = s => { const [y, m, d] = s.split('-').map(Number); return d + '\u00a0' + mois[m - 1]; };
  function render() {
    let rows = P.filter(p => filtre === 'tous' || p.r === filtre);
    const key = { date: p => p.d, portee: p => -p.p, taux: p => -p.taux, devis: p => -p.v * 1e6 - p.p }[tri];
    rows = rows.slice().sort((a, b) => (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0));
    const best = Math.max(...rows.map(r => r.taux));
    document.querySelector('#t-pubs tbody').innerHTML = rows.map(p => `<tr>
      <td class="dt">${fd(p.d)}</td>
      <td class="c-net"><span class="net">${ico(p.r)}${NET[p.r].n}</span></td>
      <td class="c-t"><span class="tt">${p.t}</span><span class="ts">${p.src}</span></td>
      <td class="n" data-l="Portée">${fmt(p.p)}</td>
      <td class="n" data-l="Interactions">${fmt(p.i)}</td>
      <td class="n${p.taux === best ? ' hi' : ''}" data-l="Taux">${pct(p.i, p.p)}</td>
      <td class="n" data-l="Devis"><span class="pill${p.v ? '' : ' z'}">${p.v}</span></td></tr>`).join('');
    const tp = sum(rows.map(r => r.p)), ti = sum(rows.map(r => r.i)), tv = sum(rows.map(r => r.v));
    document.querySelector('#t-pubs tfoot').innerHTML = `<tr><td class="dt"></td><td class="c-net"></td><td class="c-t">Total, ${rows.length} publication${rows.length > 1 ? 's' : ''}</td><td class="n" data-l="Portée">${fmt(tp)}</td><td class="n" data-l="Interactions">${fmt(ti)}</td><td class="n" data-l="Taux">${pct(ti, tp)}</td><td class="n" data-l="Devis"><span class="pill">${tv}</span></td></tr>`;
  }
  render();
  const gens = P.filter(p => /équipe|Academy/.test(p.t)), prod = P.filter(p => p.r === 'instagram' && !/équipe|Academy|SARA/.test(p.t));
  const tg = sum(gens.map(p => p.i)) / sum(gens.map(p => p.p)), tpd = sum(prod.map(p => p.i)) / sum(prod.map(p => p.p));
  document.getElementById('insight').innerHTML = `<b>Ce que le tableau ferait ressortir :</b> sur Instagram, les deux publications qui montrent des personnes (l'équipe, la SACRI Academy) atteignent un taux d'interaction de ${pct(tg * 100, 100)}, contre ${pct(tpd * 100, 100)} pour les publications produit. C'est la même tendance que celle relevée sur LinkedIn le 16/11 (29 réactions contre 3).`;

  // --- SARA
  const E = D.sara.entonnoir;
  const sk = [
    ['Votes au sondage', fmt(sondageVotes), `${D.sara.votes.facebook} sur Facebook, ${D.sara.votes.linkedin} sur LinkedIn`],
    ['Invitations envoyées', fmt(E[0][1]), 'clients et prospects, WhatsApp et e-mail'],
    ['Visites au stand annoncées', fmt(E[3][1]), pct(E[3][1], E[0][1]) + ' des invités'],
    ['Rendez-vous commerciaux', fmt(E[4][1]), 'à tenir pendant le salon']
  ];
  document.getElementById('sara-k').innerHTML = sk.map(k => `<div class="mini"><p class="l">${k[0]}</p><p class="v">${k[1]}</p><p class="d">${k[2]}</p></div>`).join('');
  bars('sondage', D.sara.sondage, '\u00a0%', false);
  document.getElementById('funnel').innerHTML = E.map((s, i) => `<div class="fs"><span>${s[0]}</span><span class="pc">${i ? pct(s[1], E[0][1]) : ''}</span><div class="fb2"><div class="ff" style="width:${(s[1] / E[0][1] * 100).toFixed(1)}%">${s[1]}</div></div></div>`).join('');
})();

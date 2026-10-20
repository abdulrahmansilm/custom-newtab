const KEY = 'startseite.v1';
const GROUP_W = 340, GAP = 18, COLS = 3;
const $ = s => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 10);
function el(tag, cls, text){ const e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }

/* Standard-Inhalt: leer (gilt nur, solange noch nichts gespeichert wurde) */
function defaults(){ return { groups: [] }; }

/* Speicher: in der Erweiterung chrome.storage.local (bleibt dauerhaft erhalten,
   wird von allen Tabs geteilt), sonst localStorage. */
const HAS_EXT = typeof chrome !== 'undefined' && !!(chrome.storage && chrome.storage.local);
async function loadData(){
  if(HAS_EXT){
    try { const r = await chrome.storage.local.get(KEY); if(r[KEY] && Array.isArray(r[KEY].groups)) return r[KEY]; } catch(e){}
  }
  try { const d = JSON.parse(localStorage.getItem(KEY)); if(d && Array.isArray(d.groups)) return d; } catch(e){}
  return defaults();
}
function save(){
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e){}
  if(HAS_EXT){ try { chrome.storage.local.set({ [KEY]: data }); } catch(e){} }
}

let data = null;
let editing = false;
let drag = null;

const normUrl = u => { u = u.trim(); return /^https?:\/\//i.test(u) ? u : 'https://' + u; };
const hostOf = u => { try { return new URL(normUrl(u)).hostname; } catch(e){ return ''; } };
const iconSrc = l => l.img || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostOf(l.url))}&sz=128`;

function iconEl(l){
  const ico = el('span', 'ico');
  const img = new Image();
  img.alt = '';
  if(l.img) img.className = 'full';
  img.onerror = () => { ico.replaceChildren(el('span', '', (l.name || '?')[0].toUpperCase())); };
  img.src = iconSrc(l);
  ico.append(img);
  return ico;
}

/* ---------- Positionen (x = Abstand der linken Kante von der Mitte, y = von oben) ---------- */
function cards(){ return [...document.querySelectorAll('.group')]; }
function place(card, g){
  const half = $('#board').clientWidth / 2;
  const x = Math.max(-half, Math.min(half - card.offsetWidth, g.x));
  card.style.left = `calc(50% + ${x}px)`;
  card.style.top = g.y + 'px';
}
function fitBoard(){
  let b = 0;
  cards().forEach(c => { b = Math.max(b, c.offsetTop + c.offsetHeight); });
  $('#board').style.minHeight = Math.max(b + 80, window.innerHeight * 0.6) + 'px';
}
function applyPositions(){
  if(!data) return;
  const els = cards();
  data.groups.forEach(g => { const c = els.find(x => x.dataset.gid === g.id); if(c) place(c, g); });
  fitBoard();
}
function autoLayout(){
  const els = cards();
  const x0 = -(COLS * GROUP_W + (COLS - 1) * GAP) / 2;
  const hs = Array(COLS).fill(30);
  data.groups.forEach(g => {
    const c = els.find(x => x.dataset.gid === g.id);
    const col = hs.indexOf(Math.min(...hs));
    g.x = Math.round(x0 + col * (GROUP_W + GAP));
    g.y = hs[col];
    hs[col] += (c ? c.offsetHeight : 160) + GAP;
  });
  save(); applyPositions();
}
function startMove(e, g, card){
  if(e.button !== 0) return;
  e.preventDefault();
  const board = $('#board');
  const sx = e.clientX, sy = e.clientY, ox = g.x, oy = g.y;
  card.classList.add('moving');
  const move = ev => {
    const half = board.clientWidth / 2;
    g.x = Math.round(Math.max(-half, Math.min(half - card.offsetWidth, ox + ev.clientX - sx)));
    g.y = Math.round(Math.max(0, oy + ev.clientY - sy));
    place(card, g); fitBoard();
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    card.classList.remove('moving');
    save();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

/* ---------- Rendern ---------- */
function render(){
  document.body.classList.toggle('edit', editing);
  const root = $('#board');
  root.replaceChildren();
  data.groups.forEach(g => root.append(groupEl(g)));
  if(!data.groups.length){
    root.append(el('div', 'empty', editing
      ? 'Klicke oben auf „+ Gruppe“, um zu starten.'
      : 'Noch leer. Klicke oben rechts auf „Bearbeiten“ und dann auf „+ Gruppe“.'));
  }
  if(data.groups.some(g => typeof g.x !== 'number' || typeof g.y !== 'number')) autoLayout();
  else applyPositions();
  renderLogo();
}

function groupEl(g){
  const card = el('section', 'group');
  card.dataset.gid = g.id;
  const head = el('header', 'ghead');

  if(editing){
    const h = el('span', 'handle', '⋮⋮');
    h.title = 'Ziehen, um die Gruppe zu verschieben';
    h.addEventListener('pointerdown', e => startMove(e, g, card));
    const inp = el('input', 'gname');
    inp.value = g.name;
    inp.onchange = () => { g.name = inp.value.trim() || 'Gruppe'; save(); };
    const del = el('button', 'icon-btn', '×');
    del.title = 'Gruppe löschen';
    del.onclick = () => {
      if(confirm(`Gruppe „${g.name}“ mit ${g.links.length} Link(s) löschen?`)){
        data.groups = data.groups.filter(x => x !== g); save(); render();
      }
    };
    head.append(h, inp, del);
  } else {
    head.append(el('h2', '', g.name));
  }
  card.append(head);

  const links = el('div', 'links');
  g.links.forEach(l => links.append(linkEl(g, l)));
  if(editing){
    const add = el('button', 'addlink');
    add.append(el('span', 'ico', '+'), el('span', '', 'Link'));
    add.onclick = () => openDialog(g, null);
    links.append(add);
    links.addEventListener('dragover', e => { if(drag && drag.type === 'link') e.preventDefault(); });
    links.addEventListener('drop', e => { if(drag && drag.type === 'link'){ e.preventDefault(); moveLink(g, null); } });
  }
  card.append(links);
  return card;
}

function linkEl(g, l){
  const a = el('a', 'link');
  a.title = l.url;
  a.href = editing ? '#' : normUrl(l.url);
  a.append(iconEl(l), el('span', 'lname', l.name));
  if(editing){
    a.draggable = true;
    a.addEventListener('click', e => { e.preventDefault(); openDialog(g, l); });
    a.addEventListener('dragstart', e => {
      drag = { type: 'link', gid: g.id, lid: l.id };
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', 'l');
      a.classList.add('dragging');
    });
    a.addEventListener('dragend', () => { drag = null; render(); });
    a.addEventListener('dragover', e => { if(drag && drag.type === 'link' && drag.lid !== l.id){ e.preventDefault(); a.classList.add('over'); } });
    a.addEventListener('dragleave', () => a.classList.remove('over'));
    a.addEventListener('drop', e => {
      if(!(drag && drag.type === 'link')) return;
      e.preventDefault(); e.stopPropagation();
      moveLink(g, l);
    });
  }
  return a;
}

function moveLink(targetGroup, beforeLink){
  const src = data.groups.find(x => x.id === drag.gid);
  if(!src) return;
  const i = src.links.findIndex(x => x.id === drag.lid);
  if(i < 0) return;
  const [moved] = src.links.splice(i, 1);
  let idx = beforeLink ? targetGroup.links.findIndex(x => x.id === beforeLink.id) : targetGroup.links.length;
  if(idx < 0) idx = targetGroup.links.length;
  targetGroup.links.splice(idx, 0, moved);
  save(); drag = null; render();
}

/* ---------- Dialog ---------- */
const dlg = $('#dlg');
let cur = null, imgData = '';

function previewUpdate(){
  const l = { name: $('#fname').value || '?', url: $('#furl').value, img: $('#fimg').value.trim() || imgData };
  $('#prev').replaceWith(Object.assign(iconEl(l), { id: 'prev' }));
}
function openDialog(g, l){
  cur = { g, l };
  $('#dtitle').textContent = l ? 'Link bearbeiten' : 'Neuer Link';
  $('#fname').value = l ? l.name : '';
  $('#furl').value = l ? l.url : '';
  const img = l ? l.img : '';
  imgData = img && img.startsWith('data:') ? img : '';
  $('#fimg').value = img && !imgData ? img : '';
  $('#fimg').placeholder = imgData ? 'Eigenes Bild hochgeladen' : 'leer = Icon der Webseite';
  $('#ffile').value = '';
  $('#bdel').style.display = l ? '' : 'none';
  previewUpdate();
  dlg.showModal();
  $('#fname').focus();
}
['fname', 'furl', 'fimg'].forEach(id => $('#' + id).addEventListener('input', () => {
  if(id === 'fimg'){ imgData = ''; $('#fimg').placeholder = 'leer = Icon der Webseite'; }
  previewUpdate();
}));
$('#resetImg').onclick = e => { e.preventDefault(); imgData = ''; $('#fimg').value = ''; $('#fimg').placeholder = 'leer = Icon der Webseite'; $('#ffile').value = ''; previewUpdate(); };
$('#ffile').onchange = e => {
  const file = e.target.files[0]; if(!file) return;
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const s = 96, c = document.createElement('canvas'); c.width = c.height = s;
      const k = Math.max(s / im.width, s / im.height), w = im.width * k, h = im.height * k;
      c.getContext('2d').drawImage(im, (s - w) / 2, (s - h) / 2, w, h);
      imgData = c.toDataURL('image/png');
      $('#fimg').value = ''; $('#fimg').placeholder = 'Eigenes Bild hochgeladen';
      previewUpdate();
    };
    im.src = r.result;
  };
  r.readAsDataURL(file);
};
$('#bcancel').onclick = () => dlg.close();
$('#bdel').onclick = () => {
  if(cur && cur.l){ cur.g.links = cur.g.links.filter(x => x !== cur.l); save(); render(); }
  dlg.close();
};
$('#f').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#fname').value.trim(), url = $('#furl').value.trim();
  if(!name || !url) return;
  const img = $('#fimg').value.trim() || imgData;
  if(cur.l){ Object.assign(cur.l, { name, url: normUrl(url), img }); }
  else { cur.g.links.push({ id: uid(), name, url: normUrl(url), img }); }
  save(); render(); dlg.close();
});

/* ---------- Werkzeugleiste ---------- */
$('#editBtn').onclick = () => { editing = !editing; $('#editBtn').textContent = editing ? '✓ Fertig' : '✎ Bearbeiten'; render(); };
$('#addGroupBtn').onclick = () => {
  let y = 30;
  cards().forEach(c => { y = Math.max(y, c.offsetTop + c.offsetHeight + GAP); });
  const g = { id: uid(), name: 'Neue Gruppe', links: [], x: -GROUP_W / 2, y };
  data.groups.push(g); save(); render();
  const card = document.querySelector(`[data-gid="${g.id}"]`);
  if(card){ card.scrollIntoView({ block: 'nearest' }); const i = card.querySelector('.gname'); if(i){ i.focus(); i.select(); } }
};
$('#arrangeBtn').onclick = () => {
  if(confirm('Alle Gruppen automatisch neu anordnen? Deine eigene Anordnung geht dabei verloren.')) autoLayout();
};
$('#exportBtn').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'startseite-backup.json'; a.click(); URL.revokeObjectURL(a.href);
};
$('#importBtn').onclick = () => $('#importFile').click();
$('#importFile').onchange = e => {
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if(!d || !Array.isArray(d.groups)) throw 0;
      if(confirm('Aktuelle Startseite durch die importierte ersetzen?')){ data = d; save(); render(); }
    } catch(_){ alert('Ungültige Datei.'); }
  };
  r.readAsText(f); e.target.value = '';
};
window.addEventListener('resize', applyPositions);

/* ---------- Logo ---------- */
function renderLogo(){
  const lg = data.logo, img = $('#logoImg'), has = !!(lg && lg.src);
  $('#logoWrap').classList.toggle('has', has);
  if(has){
    if(img.getAttribute('src') !== lg.src) img.src = lg.src;
    img.style.height = (lg.h || 120) + 'px';
    img.hidden = false;
    $('#logoSize').value = lg.h || 120;
  } else {
    img.hidden = true; img.removeAttribute('src');
  }
  $('#logoBtn').textContent = has ? '🖼 Logo ändern' : '🖼 Logo einfügen';
}
function setLogoFile(file){
  if(!file || !file.type.startsWith('image/')) return;
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const w0 = im.naturalWidth || 300, h0 = im.naturalHeight || 100;
      const k = Math.min(1, 1200 / w0, 600 / h0);
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w0 * k));
      c.height = Math.max(1, Math.round(h0 * k));
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      data.logo = { src: c.toDataURL('image/png'), h: (data.logo && data.logo.h) || 120 };
      save(); renderLogo(); applyPositions();
    };
    im.src = r.result;
  };
  r.readAsDataURL(file);
}
$('#logoBtn').onclick = () => $('#logoFile').click();
$('#logoFile').onchange = e => { setLogoFile(e.target.files[0]); e.target.value = ''; };
$('#logoDel').onclick = () => { data.logo = null; save(); renderLogo(); };
$('#logoSize').addEventListener('input', e => {
  if(data.logo){ data.logo.h = +e.target.value; $('#logoImg').style.height = data.logo.h + 'px'; }
});
$('#logoSize').addEventListener('change', () => save());
$('#logoWrap').addEventListener('dragover', e => {
  if(editing && e.dataTransfer.types.includes('Files')) e.preventDefault();
});
$('#logoWrap').addEventListener('drop', e => {
  if(editing && e.dataTransfer.files.length){ e.preventDefault(); setLogoFile(e.dataTransfer.files[0]); }
});
document.addEventListener('paste', e => {
  if(!editing || dlg.open) return;
  const f = [...(e.clipboardData ? e.clipboardData.files : [])].find(f => f.type.startsWith('image/'));
  if(f){ e.preventDefault(); setLogoFile(f); }
});

/* ---------- Start ---------- */
(async function init(){
  data = await loadData();
  render();
  save();            // Standard-Inhalt bzw. alte Daten sofort dauerhaft ablegen
})();

/* Änderungen aus einem anderen Tab übernehmen (eigene Speicherungen werden ignoriert) */
if(HAS_EXT){
  chrome.storage.onChanged.addListener((ch, area) => {
    if(area !== 'local' || !ch[KEY] || !ch[KEY].newValue || !data) return;
    if(editing || dlg.open) return;
    if(JSON.stringify(ch[KEY].newValue) === JSON.stringify(data)) return;
    data = ch[KEY].newValue; render();
  });
}

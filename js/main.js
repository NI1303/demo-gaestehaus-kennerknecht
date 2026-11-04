/* Gästehaus Kennerknecht: Belegungskalender (Demo, ohne echte Belegungen) + Anfrage-Prüfung */
(() => {
  const form = document.getElementById('req-form');
  const an = form.elements.anreise, ab = form.elements.abreise, nightsEl = document.getElementById('nights');
  const MIN = { salmaserhoehe: 3, dorfblick: 3, denneberg: 4 };
  const NAMES = { salmaserhoehe: 'Salmaser Höhe', dorfblick: 'Dorfblick', denneberg: 'Denneberg' };
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  an.min = ab.min = iso(today);
  const nights = () => (an.value && ab.value) ? Math.round((new Date(ab.value) - new Date(an.value)) / 864e5) : 0;
  const showNights = () => { const n = nights(); nightsEl.textContent = n > 0 ? n + (n === 1 ? ' Nacht' : ' Nächte') + ' ausgewählt' : ''; };

  // Kalender
  const box = document.getElementById('cal-months'), title = document.getElementById('cal-title');
  let offset = 0;
  const monthName = d => d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  function render() {
    const m0 = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const months = window.innerWidth >= 640 ? 2 : 1;
    box.innerHTML = '';
    for (let k = 0; k < months; k++) {
      const m = new Date(m0.getFullYear(), m0.getMonth() + k, 1);
      const wrap = document.createElement('div'); wrap.className = 'cal-m';
      let h = '<h4>' + monthName(m) + '</h4><div class="cal-grid">' + ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(w => '<span class="wd">' + w + '</span>').join('');
      const lead = (m.getDay() + 6) % 7;
      for (let i = 0; i < lead; i++) h += '<span></span>';
      const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const dt = new Date(m.getFullYear(), m.getMonth(), d), v = iso(dt);
        let cls = '';
        if (v === an.value || v === ab.value) cls = 'sel';
        else if (an.value && ab.value && v > an.value && v < ab.value) cls = 'range';
        h += '<button type="button" data-d="' + v + '" class="' + cls + '"' + (dt < today ? ' disabled' : '') + ' aria-label="' + dt.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) + '">' + d + '</button>';
      }
      wrap.innerHTML = h + '</div>';
      box.appendChild(wrap);
    }
    title.textContent = months === 2 ? monthName(m0) + ' – ' + monthName(new Date(m0.getFullYear(), m0.getMonth() + 1, 1)) : monthName(m0);
  }
  box.addEventListener('click', e => {
    const b = e.target.closest('button[data-d]'); if (!b) return;
    const v = b.dataset.d;
    if (!an.value || ab.value || v <= an.value) { an.value = v; ab.value = ''; }
    else ab.value = v;
    render(); showNights();
  });
  document.querySelectorAll('.cal-nav').forEach(b => b.addEventListener('click', () => { offset = Math.max(0, offset + +b.dataset.dir); render(); }));
  window.addEventListener('resize', render);
  [an, ab].forEach(i => i.addEventListener('change', () => { render(); showNights(); }));
  render();

  // „Diese Wohnung anfragen“ wählt die Wohnung im Formular
  document.querySelectorAll('[data-flat]').forEach(a => a.addEventListener('click', () => { form.elements.wohnung.value = a.dataset.flat; }));

  form.demoCheck = () => {
    const n = nights(), w = form.elements.wohnung.value;
    if (an.value && ab.value && n <= 0) { ab.classList.add('invalid'); return 'Die Abreise muss nach der Anreise liegen.'; }
    if (MIN[w] && n > 0 && n < MIN[w]) { ab.classList.add('invalid'); return 'Für die Ferienwohnung ' + NAMES[w] + ' gilt ein Mindestaufenthalt von ' + MIN[w] + ' Tagen.'; }
    const pers = (+form.elements.erwachsene.value || 0) + (+form.elements.kinder.value || 0);
    if ((w === 'salmaserhoehe' || w === 'dorfblick') && pers > 4) return 'Die Ferienwohnung ' + NAMES[w] + ' ist für 4 Personen – für 5 Personen passt die Ferienwohnung Denneberg.';
    if (w === 'denneberg' && pers > 5) return 'Die Ferienwohnung Denneberg ist für bis zu 5 Personen.';
    return '';
  };
  form.afterReset = () => { form.elements.erwachsene.value = 2; form.elements.kinder.value = 0; render(); showNights(); };
})();

/* Sommer/Winter-Umschalter: Panorama, Aktivitäten und Preise */
(() => {
  const root = document.documentElement;
  const set = s => {
    root.dataset.season = s;
    document.querySelectorAll('[data-season]').forEach(b => { if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', b.dataset.season === s); });
    try { localStorage.setItem('kk-season', s); } catch (e) {}
    document.querySelectorAll('.pm-season').forEach(t => { t.textContent = s === 'winter' ? 'WINTER' : 'SOMMER'; });
    const cv = document.querySelector('canvas[data-particles]');
    if (cv) {
      if (s === 'winter') { cv.removeAttribute('data-off'); cv.fxStart && cv.fxStart(); }
      else { cv.setAttribute('data-off', ''); cv.fxStop && cv.fxStop(); }
    }
  };
  document.querySelectorAll('button[data-season]').forEach(b => b.addEventListener('click', () => set(b.dataset.season)));
  set(root.dataset.season || 'sommer');
})();

/* Postkarten umdrehen */
(() => {
  document.querySelectorAll('[data-flip-btn]').forEach(b => {
    const pc = b.closest('.flat').querySelector('.pc');
    const back = pc.querySelector('.pc-back'), front = pc.querySelector('.pc-front');
    const sync = on => { pc.classList.toggle('flipped', on); b.setAttribute('aria-pressed', on); back.setAttribute('aria-hidden', !on); front.setAttribute('tabindex', on ? '-1' : '0'); };
    sync(false);
    b.addEventListener('click', () => sync(!pc.classList.contains('flipped')));
  });
})();

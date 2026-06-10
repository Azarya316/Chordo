import './style.css';

(() => {
  'use strict';

  // Base de l'API. En dev, vide => le proxy Vite redirige /api vers le backend.
  // En prod, définir VITE_API_URL (ex: https://api.chordo.app).
  const API = import.meta.env.VITE_API_URL || '';

  // ---------- Onglets ----------
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => t.classList.toggle('active', t === tab));
      panels.forEach((p) => p.classList.toggle('active', p.id === target));
    });
  });

  // ---------- Audio partagé ----------
  let audioCtx = null;
  function ctx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // Joue une note (fréquence Hz) avec une enveloppe douce type corde pincée.
  function pluck(freq, duration = 1.1) {
    const ac = ctx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const now = ac.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  // Fréquence d'une note nom+octave (ex: "E2") via A4 = 440 Hz.
  const NOTE_INDEX = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function noteToFreq(name) {
    const m = name.match(/^([A-G]#?)(\d)$/);
    if (!m) return 440;
    const semitone = NOTE_INDEX[m[1]] + (parseInt(m[2], 10) + 1) * 12;
    return 440 * Math.pow(2, (semitone - 69) / 12);
  }

  // ====================================================================
  // ANALYSEUR
  // ====================================================================
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const fileMeta = document.getElementById('fileMeta');
  const progress = document.getElementById('progress');
  const errorBox = document.getElementById('analyzeError');
  const results = document.getElementById('results');

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });
  ['dragover', 'dragenter'].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('drag'); })
  );
  ['dragleave', 'drop'].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove('drag'); })
  );
  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) handleFile(fileInput.files[0]);
  });

  function fmtBytes(n) {
    if (n < 1024) return `${n} o`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
    return `${(n / 1024 / 1024).toFixed(1)} Mo`;
  }

  async function handleFile(file) {
    errorBox.classList.add('hidden');
    results.classList.add('hidden');
    fileMeta.classList.remove('hidden');
    fileMeta.innerHTML = `<b>📄 ${file.name}</b> · ${fmtBytes(file.size)} · ${file.type || 'type inconnu'}`;
    progress.classList.remove('hidden');

    const form = new FormData();
    form.append('song', file);

    try {
      const res = await fetch(`${API}/api/upload`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur serveur');
      renderResults(data.analysis);
    } catch (err) {
      errorBox.textContent = `⚠️ ${err.message}`;
      errorBox.classList.remove('hidden');
    } finally {
      progress.classList.add('hidden');
    }
  }

  function renderResults(a) {
    const chordEl = document.getElementById('chordResult');
    const notesEl = document.getElementById('notesResult');
    const metaEl = document.getElementById('metaResult');

    chordEl.innerHTML = a.chords && a.chords.length
      ? a.chords.map((c, i) => `<span class="chip${i ? ' secondary' : ''}">${c}</span>`).join('')
      : '<span class="empty">Aucun accord clair détecté (essaie un extrait monophonique ou arpégé).</span>';

    if (a.dominantNotes && a.dominantNotes.length) {
      const max = a.dominantNotes[0].count || 1;
      notesEl.innerHTML = a.dominantNotes.map((n) => {
        const pct = Math.round((n.count / max) * 100);
        return `<div class="bar-row"><span class="bar-note">${n.note}</span>` +
          `<span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>` +
          `<span class="bar-pct">${Math.round(n.strength * 100)}%</span></div>`;
      }).join('');
    } else {
      notesEl.innerHTML = '<span class="empty">Aucune note détectée.</span>';
    }

    const meta = [
      ['Titre', a.title || '—'],
      ['Durée', a.durationSec ? `${a.durationSec}s` : '—'],
      ['Format', a.format || '—'],
      ['Trames analysées', a.framesAnalyzed],
      ['Trames tonales', a.framesWithPitch],
    ];
    metaEl.innerHTML = meta.map(([k, v]) => `<li><b>${k}:</b> ${v}</li>`).join('');
    results.classList.remove('hidden');
  }

  // ====================================================================
  // BIBLIOTHÈQUE D'ACCORDS
  // ====================================================================
  const chordGrid = document.getElementById('chordGrid');
  const stringRow = document.getElementById('stringRow');

  // Dessine un diagramme de manche SVG.
  function chordDiagram(positions) {
    const W = 120, H = 140, left = 18, right = 102, top = 26, bottom = 124;
    const stringGap = (right - left) / 5;
    const fretGap = (bottom - top) / 4;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%">`;
    // Sillet épais en haut.
    svg += `<rect x="${left}" y="${top - 4}" width="${right - left}" height="4" fill="#e8eaf0"/>`;
    // Cases.
    for (let f = 0; f <= 4; f += 1) {
      const y = top + f * fretGap;
      svg += `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#3a4150" stroke-width="1.5"/>`;
    }
    // Cordes.
    for (let s = 0; s < 6; s += 1) {
      const x = left + s * stringGap;
      svg += `<line x1="${x}" y1="${top}" x2="${x}" y2="${bottom}" stroke="#5a6273" stroke-width="1.5"/>`;
    }
    // Marqueurs.
    positions.forEach((pos, s) => {
      const x = left + s * stringGap;
      if (pos === -1) {
        svg += `<text x="${x}" y="${top - 8}" fill="#fca5a5" font-size="11" text-anchor="middle">✕</text>`;
      } else if (pos === 0) {
        svg += `<circle cx="${x}" cy="${top - 11}" r="4.5" fill="none" stroke="#4ade80" stroke-width="1.5"/>`;
      } else {
        const y = top + (pos - 0.5) * fretGap;
        svg += `<circle cx="${x}" cy="${y}" r="7" fill="#ff8a3d"/>`;
      }
    });
    svg += '</svg>';
    return svg;
  }

  // Fréquences des cordes à vide pour sonoriser un accord.
  const OPEN_STRINGS = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];
  function strumChord(positions) {
    positions.forEach((pos, s) => {
      if (pos === -1) return;
      const freq = OPEN_STRINGS[s] * Math.pow(2, pos / 12);
      setTimeout(() => pluck(freq, 1.4), s * 55);
    });
  }

  async function loadChords() {
    try {
      const res = await fetch(`${API}/api/chords`);
      const data = await res.json();
      renderChordGrid(data.chords);
      renderTuner(data.tuning);
    } catch {
      chordGrid.innerHTML = '<p class="empty">Impossible de charger la bibliothèque.</p>';
    }
  }

  function renderChordGrid(chords) {
    chordGrid.innerHTML = chords.map((c, i) =>
      `<div class="chord-card" data-idx="${i}">` +
      `<h3>${c.name}</h3><div class="chord-label">${c.label || ''}</div>` +
      chordDiagram(c.positions) + '</div>'
    ).join('');
    chordGrid.querySelectorAll('.chord-card').forEach((card) => {
      card.addEventListener('click', () => strumChord(chords[+card.dataset.idx].positions));
    });
  }

  function renderTuner(tuning) {
    stringRow.innerHTML = tuning.map((t, i) =>
      `<button class="string-btn" data-idx="${i}" data-freq="${t.freq}">` +
      `<div class="s-note">${t.note.replace(/\d/, '')}<sub>${t.note.match(/\d/)[0]}</sub></div>` +
      `<div class="s-freq">${t.freq} Hz</div></button>`
    ).join('');
    stringRow.querySelectorAll('.string-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        pluck(parseFloat(btn.dataset.freq), 1.6);
        btn.classList.add('playing');
        setTimeout(() => btn.classList.remove('playing'), 600);
      });
    });
  }

  // ====================================================================
  // MÉTRONOME
  // ====================================================================
  const metroToggle = document.getElementById('metroToggle');
  const tempo = document.getElementById('tempo');
  const tempoVal = document.getElementById('tempoVal');
  const beatDots = document.getElementById('beatDots');
  let metroTimer = null;
  let beat = 0;
  const BEATS = 4;

  beatDots.innerHTML = Array.from({ length: BEATS }, () => '<span class="beat-dot"></span>').join('');
  const dots = beatDots.querySelectorAll('.beat-dot');

  tempo.addEventListener('input', () => {
    tempoVal.textContent = tempo.value;
    if (metroTimer) { stopMetro(); startMetro(); }
  });

  function tick() {
    dots.forEach((d, i) => d.classList.toggle('on', i === beat));
    const freq = beat === 0 ? 1320 : 880; // premier temps accentué
    pluck(freq, 0.08);
    beat = (beat + 1) % BEATS;
  }

  function startMetro() {
    beat = 0;
    const interval = 60000 / parseInt(tempo.value, 10);
    tick();
    metroTimer = window.setInterval(tick, interval);
    metroToggle.textContent = 'Arrêter';
  }
  function stopMetro() {
    window.clearInterval(metroTimer);
    metroTimer = null;
    dots.forEach((d) => d.classList.remove('on'));
    metroToggle.textContent = 'Démarrer';
  }
  metroToggle.addEventListener('click', () => (metroTimer ? stopMetro() : startMetro()));

  loadChords();
})();

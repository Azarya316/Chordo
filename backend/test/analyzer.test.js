// Test minimal sans framework : génère des sons de test via ffmpeg
// puis vérifie que l'analyseur détecte les bonnes notes.
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { analyzeFile } = require('../services/audioAnalyzer');

function makeTone(freqExpr, durationSec) {
  const out = path.join(os.tmpdir(), `chordo-test-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`);
  execFileSync('ffmpeg', [
    '-f', 'lavfi',
    '-i', `sine=frequency=${freqExpr}:duration=${durationSec}`,
    '-ar', '22050', '-ac', '1',
    '-loglevel', 'error', '-y', out,
  ]);
  return out;
}

async function run() {
  let passed = 0;

  // 1) Un La (A4 = 440 Hz) doit ressortir comme note dominante "A".
  const aFile = makeTone(440, 1.5);
  try {
    const res = await analyzeFile(aFile);
    assert.ok(res.dominantNotes.length > 0, 'doit détecter au moins une note');
    assert.strictEqual(res.dominantNotes[0].note, 'A', `note dominante attendue A, reçu ${res.dominantNotes[0].note}`);
    assert.ok(res.durationSec > 1, 'durée doit être ~1.5s');
    console.log('OK  - détection note dominante A (440 Hz)');
    passed += 1;
  } finally {
    fs.unlinkSync(aFile);
  }

  // 2) Un Mi grave (E2 ≈ 82.41 Hz) doit ressortir comme "E".
  const eFile = makeTone(82.41, 1.5);
  try {
    const res = await analyzeFile(eFile);
    assert.strictEqual(res.dominantNotes[0].note, 'E', `note dominante attendue E, reçu ${res.dominantNotes[0].note}`);
    console.log('OK  - détection note dominante E (82.41 Hz)');
    passed += 1;
  } finally {
    fs.unlinkSync(eFile);
  }

  // 3) Fichier invalide -> rejet propre.
  const badFile = path.join(os.tmpdir(), `chordo-bad-${Date.now()}.wav`);
  fs.writeFileSync(badFile, 'pas un audio');
  try {
    await analyzeFile(badFile);
    throw new Error('aurait dû échouer sur un fichier invalide');
  } catch (err) {
    assert.ok(/ffmpeg|court|invalide/i.test(err.message), 'erreur attendue sur fichier invalide');
    console.log('OK  - rejet propre d\'un fichier invalide');
    passed += 1;
  } finally {
    fs.unlinkSync(badFile);
  }

  console.log(`\n${passed}/3 tests réussis.`);
}

run().catch((err) => {
  console.error('ÉCHEC:', err.message);
  process.exit(1);
});

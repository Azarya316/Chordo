const { spawn } = require('child_process');
const Pitchfinder = require('pitchfinder');
const { Note, Chord } = require('@tonaljs/tonal');

const SAMPLE_RATE = 22050;
const FRAME_SIZE = 4096;
const HOP_SIZE = 2048;
// Probabilité minimale (algorithme Macleod) pour accepter une détection.
const MIN_PROBABILITY = 0.9;
// Bornes de fréquence plausibles pour une guitare (Mi grave ~82 Hz à ~1.2 kHz).
const MIN_FREQ = 70;
const MAX_FREQ = 1300;

/**
 * Décode n'importe quel fichier audio en PCM mono float32 grâce à ffmpeg.
 * @param {string} filePath chemin du fichier uploadé
 * @returns {Promise<Float32Array>}
 */
function decodeToPcm(filePath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-i', filePath,
      '-ac', '1',
      '-ar', String(SAMPLE_RATE),
      '-f', 'f32le',
      '-hide_banner',
      '-loglevel', 'error',
      'pipe:1',
    ];
    const ff = spawn('ffmpeg', args);
    const chunks = [];
    let stderr = '';

    ff.stdout.on('data', (chunk) => chunks.push(chunk));
    ff.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    ff.on('error', reject);
    ff.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`ffmpeg a échoué (code ${code}): ${stderr.trim()}`));
      }
      const buffer = Buffer.concat(chunks);
      const samples = new Float32Array(
        buffer.buffer,
        buffer.byteOffset,
        Math.floor(buffer.length / 4)
      );
      resolve(samples);
    });
  });
}

/**
 * Détecte la suite de notes jouées dans un signal PCM.
 * @param {Float32Array} samples
 * @returns {{notes: Array, pitchClasses: Array}}
 */
function detectNotes(samples) {
  // Macleod (autocorrélation normalisée) est nettement plus fiable que YIN
  // sur les notes graves de guitare (Mi2 ≈ 82 Hz).
  const detectPitch = Pitchfinder.Macleod({ sampleRate: SAMPLE_RATE, bufferSize: FRAME_SIZE });
  const pitchClassCount = {};
  let detectedFrames = 0;
  let totalFrames = 0;

  for (let start = 0; start + FRAME_SIZE <= samples.length; start += HOP_SIZE) {
    totalFrames += 1;
    const frame = samples.subarray(start, start + FRAME_SIZE);

    // Ignorer les trames quasi silencieuses (RMS faible).
    let sumSq = 0;
    for (let i = 0; i < frame.length; i += 1) sumSq += frame[i] * frame[i];
    const rms = Math.sqrt(sumSq / frame.length);
    if (rms < 0.01) continue;

    const result = detectPitch(frame);
    const freq = result && result.freq;
    if (!freq || result.probability < MIN_PROBABILITY) continue;
    if (freq < MIN_FREQ || freq > MAX_FREQ) continue;

    const noteName = Note.fromFreq(freq);
    const pc = Note.pitchClass(noteName);
    if (!pc) continue;

    detectedFrames += 1;
    pitchClassCount[pc] = (pitchClassCount[pc] || 0) + 1;
  }

  const pitchClasses = Object.entries(pitchClassCount)
    .map(([note, count]) => ({
      note,
      count,
      strength: detectedFrames ? +(count / detectedFrames).toFixed(3) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return { pitchClasses, detectedFrames, totalFrames };
}

/**
 * Devine les accords probables à partir des classes de hauteur dominantes.
 */
function guessChords(pitchClasses) {
  if (pitchClasses.length === 0) return [];
  // Garder les notes représentant au moins 8 % des trames détectées (max 5).
  const significant = pitchClasses
    .filter((p) => p.strength >= 0.08)
    .slice(0, 5)
    .map((p) => p.note);

  if (significant.length < 2) return [];
  const detected = Chord.detect(significant);
  return detected.slice(0, 5);
}

/**
 * Pipeline complet d'analyse d'un fichier audio.
 * @param {string} filePath
 * @param {object} [metadata] métadonnées optionnelles (durée, etc.)
 */
async function analyzeFile(filePath, metadata = {}) {
  const samples = await decodeToPcm(filePath);
  const durationSec = samples.length / SAMPLE_RATE;

  if (samples.length < FRAME_SIZE) {
    throw new Error('Le fichier audio est trop court ou invalide.');
  }

  const { pitchClasses, detectedFrames, totalFrames } = detectNotes(samples);
  const chords = guessChords(pitchClasses);

  return {
    durationSec: +durationSec.toFixed(2),
    sampleRate: SAMPLE_RATE,
    framesAnalyzed: totalFrames,
    framesWithPitch: detectedFrames,
    dominantNotes: pitchClasses.slice(0, 8),
    chords,
    ...metadata,
  };
}

module.exports = { analyzeFile, detectNotes, guessChords, decodeToPcm, SAMPLE_RATE };

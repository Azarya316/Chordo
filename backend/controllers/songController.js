const fs = require('fs/promises');
const mm = require('music-metadata');
const { analyzeFile } = require('../services/audioAnalyzer');
const { CHORDS, STRING_TUNING } = require('../data/chordLibrary');

exports.analyzeSong = async (req, res) => {
  const songFile = req.file;
  if (!songFile) {
    return res.status(400).json({ error: 'Aucun fichier reçu.' });
  }

  try {
    let metadata = {};
    try {
      const parsed = await mm.parseFile(songFile.path);
      metadata = {
        title: parsed.common.title || songFile.originalname,
        format: parsed.format.container || null,
        bitrate: parsed.format.bitrate || null,
      };
    } catch {
      // Les métadonnées sont optionnelles : on continue même si la lecture échoue.
      metadata = { title: songFile.originalname };
    }

    const analysis = await analyzeFile(songFile.path, metadata);
    return res.json({
      message: 'Analyse terminée',
      filename: songFile.originalname,
      analysis,
    });
  } catch (err) {
    return res.status(500).json({ error: `Échec de l'analyse: ${err.message}` });
  } finally {
    // Nettoyage du fichier temporaire.
    fs.unlink(songFile.path).catch(() => {});
  }
};

exports.getChords = (req, res) => {
  res.json({ tuning: STRING_TUNING, chords: CHORDS });
};

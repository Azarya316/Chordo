exports.analyzeSong = (req, res) => {
    const songFile = req.file;
    if (!songFile) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }
  
    // Logique future d’analyse ici
    res.json({ message: 'Fichier reçu', filename: songFile.filename });
  };
  
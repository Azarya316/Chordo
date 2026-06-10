const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const songRoutes = require('./routes/songRoutes');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', songRoutes);

// Sert le frontend statique.
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// Endpoint de santé.
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Gestionnaire d'erreurs global.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || 'Erreur interne du serveur.' });
});

module.exports = app;

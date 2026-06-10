const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const songRoutes = require('./routes/songRoutes');

dotenv.config();
const app = express();

// API uniquement : le frontend (Vite) est servi séparément.
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', songRoutes);

// Endpoint de santé.
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Gestionnaire d'erreurs global.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || 'Erreur interne du serveur.' });
});

module.exports = app;

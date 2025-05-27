const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const songRoutes = require('./routes/songRoutes');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', songRoutes);

module.exports = app;

const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler } = require('./middlewares/errorHandler');
const { notFound } = require('./middlewares/notFound');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./modules/auth/auth.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
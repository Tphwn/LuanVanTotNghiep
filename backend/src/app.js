const express = require('express');
const cors = require('cors');
const path = require('path');

const { errorHandler } = require('./middlewares/errorHandler');
const { notFound } = require('./middlewares/notFound');

const authMiddleware = require('./middlewares/auth.middleware');
const adminMiddleware = require('./middlewares/adminMiddleware');

const app = express();

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'))
);

/* =========================
   AUTH
========================= */

app.use(
  '/api/auth',
  require('./modules/auth/auth.routes')
);

/* =========================
   ADMIN
========================= */

app.use(
  '/api/admin/users',
  authMiddleware,
  adminMiddleware,
  require('./modules/admin/user/adminUser.routes')
);

/* =========================
   404 + ERROR
========================= */

app.use(notFound);
app.use(errorHandler);

module.exports = app;
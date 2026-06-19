const express = require('express');
const cors = require('cors');
const path = require('path');

const { errorHandler } = require('./middlewares/errorHandler');
const { notFound } = require('./middlewares/notFound');
const registerRoutes = require('./routes');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:517\d$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

registerRoutes(app);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

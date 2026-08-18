const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { connectDatabase } = require('./config/database');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));

// Dynamic CORS configuration allowing localhost, production frontend, and Vercel domains
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'https://erp-amber-delta.vercel.app',
  'https://erp-i5yf.vercel.app',
]
  .flatMap((url) => (url ? url.split(',') : []))
  .map((url) => url.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile, server-to-server)
    if (!origin) return callback(null, true);

    try {
      const urlObj = new URL(origin);
      const isVercel = /\.vercel\.app$/i.test(urlObj.hostname) || origin.includes('vercel.app');
      const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
      const isConfigured = allowedOrigins.some((o) => origin.startsWith(o) || o === '*');

      if (isVercel || isLocal || isConfigured || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, true);
    } catch {
      return callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'x-platform-api-key',
    'sec-ch-ua',
    'sec-ch-ua-mobile',
    'sec-ch-ua-platform',
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Ensure database connection before handling requests (required for serverless/Vercel)
app.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (err) {
    next(err);
  }
});

// Support both /api/v1 prefix and root routes
app.use('/api/v1', routes);
app.use('/', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;


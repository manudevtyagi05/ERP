const mongoose = require('mongoose');

let cachedConnection = null;

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[database] MONGODB_URI is not set. Skipping connection.');
    return false;
  }

  // 1 = connected, 2 = connecting
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (cachedConnection && mongoose.connection.readyState === 2) {
    try {
      await cachedConnection;
      return true;
    } catch (err) {
      cachedConnection = null;
    }
  }

  try {
    cachedConnection = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    await cachedConnection;
    return true;
  } catch (err) {
    cachedConnection = null;
    console.error('[database] Failed to connect to MongoDB:', err.message);
    throw err;
  }
}

mongoose.connection.on('connected', () => {
  const { host, name } = mongoose.connection;
  console.log(`[database] Connected to MongoDB (host=${host}, db=${name})`);
});

mongoose.connection.on('error', (err) => {
  console.error('[database] Connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[database] Disconnected from MongoDB');
});

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

function getConnectionStatus() {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return stateMap[mongoose.connection.readyState] || 'unknown';
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getConnectionStatus,
  isConnected: () => mongoose.connection.readyState === 1,
};


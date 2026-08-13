const mongoose = require('mongoose');

let isConnected = false;

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[database] MONGODB_URI is not set. Skipping connection.');
    return false;
  }

  mongoose.connection.on('connected', () => {
    isConnected = true;
    const { host, name } = mongoose.connection;
    console.log(`[database] Connected to MongoDB (host=${host}, db=${name})`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('[database] Connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[database] Disconnected from MongoDB');
  });

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    return true;
  } catch (err) {
    console.error('[database] Failed to connect to MongoDB:', err.message);
    return false;
  }
}

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

module.exports = { connectDatabase, disconnectDatabase, getConnectionStatus, isConnected: () => isConnected };

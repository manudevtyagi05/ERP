const ApiResponse = require('../utils/ApiResponse');
const { getConnectionStatus } = require('../config/database');

function getHealth(req, res) {
  return ApiResponse.success(res, {
    message: 'Service is healthy',
    data: {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      database: getConnectionStatus(),
    },
  });
}

module.exports = { getHealth };

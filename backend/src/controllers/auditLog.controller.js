const AuditLog = require('../models/AuditLog.model');

async function listAuditLogs(req, res) {
  try {
    const { action, objectType, limit = 50 } = req.query;
    const filter = { companyId: req.user.companyId };
    if (action) filter.action = action;
    if (objectType) filter.objectType = objectType;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.json({ success: true, data: logs.map((l) => l.toSafeJSON()) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  listAuditLogs,
};

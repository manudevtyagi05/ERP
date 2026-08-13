const Notification = require('../models/Notification.model');
const User = require('../models/User.model');

const TYPE_PREFERENCE_KEY = {
  ASSIGNED: 'assigned',
  REASSIGNED: 'assigned',
  STATUS_CHANGED: 'statusChanged',
  COMMENT: 'comment',
};

async function listNotifications(companyId, userId, { page = 1, limit = 20 } = {}) {
  const filter = { companyId, userId };

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    Notification.countDocuments(filter),
  ]);

  return {
    items: items.map((n) => n.toSafeJSON()),
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

async function getUnreadCount(companyId, userId) {
  const count = await Notification.countDocuments({ companyId, userId, read: false });
  return { count };
}

async function markAsRead(companyId, userId, notificationId) {
  await Notification.updateOne({ _id: notificationId, companyId, userId }, { $set: { read: true } });
}

async function markAllAsRead(companyId, userId) {
  await Notification.updateMany({ companyId, userId, read: false }, { $set: { read: true } });
}

/**
 * Fire-and-forget notification creation. Failures here must never break the
 * issue-mutation flow that triggered them, so callers should not await-fail on this.
 */
async function notify(companyId, { userId, type, title, message, issueId, issueKey, actorId }) {
  if (!userId) return null;
  // Don't notify users about their own actions.
  if (actorId && String(actorId) === String(userId)) return null;

  try {
    const preferenceKey = TYPE_PREFERENCE_KEY[type];
    if (preferenceKey) {
      const recipient = await User.findById(userId).select('notificationPreferences');
      if (recipient && recipient.notificationPreferences?.[preferenceKey] === false) {
        return null;
      }
    }

    return await Notification.create({
      companyId,
      userId,
      type,
      title,
      message,
      issueId: issueId || null,
      issueKey: issueKey || null,
      actorId: actorId || null,
    });
  } catch (err) {
    console.error('[notification] Failed to create notification:', err.message);
    return null;
  }
}

module.exports = { listNotifications, getUnreadCount, markAsRead, markAllAsRead, notify };

const Issue = require('../models/Issue.model');
const Project = require('../models/Project.model');
const User = require('../models/User.model');
const { ISSUE_STATUSES } = require('../models/Issue.model');
const ApiError = require('../utils/ApiError');
const notificationService = require('./notification.service');

function actorFromUser(user) {
  return {
    id: user._id.toString(),
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
  };
}

function activityId() {
  return `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pushActivity(issue, type, message, actor, { fromValue = null, toValue = null } = {}) {
  issue.activity.push({
    id: activityId(),
    type,
    message,
    fromValue: fromValue !== null && fromValue !== undefined ? String(fromValue) : null,
    toValue: toValue !== null && toValue !== undefined ? String(toValue) : null,
    actor,
    createdAt: new Date().toISOString(),
  });
}

// Assignee must always be resolved server-side from a real, active user in the
// caller's company — the frontend may only supply an assigneeId, never a
// free-form assignee object, otherwise a client could fabricate task ownership.
async function resolveAssignee(companyId, assigneeId) {
  if (!assigneeId) return null;

  const assignedUser = await User.findOne({ _id: assigneeId, companyId, deletedAt: null });
  if (!assignedUser || !assignedUser.isActive) {
    throw new ApiError(400, 'Assignee must be an active member of your company');
  }

  return {
    id: assignedUser._id.toString(),
    name: `${assignedUser.firstName} ${assignedUser.lastName}`,
    email: assignedUser.email,
    role: assignedUser.role,
    department: assignedUser.department || '',
  };
}

function applyAssigneeChange(issue, nextAssignee, actor) {
  // issue.assignee is a Mongoose single-nested subdocument: assigning
  // `issue.assignee = nextAssignee` mutates that subdocument's fields in
  // place rather than swapping in a new object, so a live reference to it
  // would already show the *new* name by the time the activity message
  // below is built. Snapshot the previous values into a plain object first.
  const previousAssignee = issue.assignee
    ? { id: issue.assignee.id, name: issue.assignee.name }
    : null;
  const previousId = previousAssignee?.id || null;
  const nextId = nextAssignee?.id || null;

  if (previousId === nextId) return false;

  issue.assignee = nextAssignee;
  issue.assignedAt = nextAssignee ? new Date() : null;

  if (!previousId && nextAssignee) {
    pushActivity(issue, 'ASSIGNED', `Assigned to ${nextAssignee.name}`, actor, {
      toValue: nextAssignee.name,
    });
  } else if (previousId && !nextAssignee) {
    pushActivity(issue, 'UNASSIGNED', `Unassigned from ${previousAssignee.name}`, actor, {
      fromValue: previousAssignee.name,
    });
  } else if (previousId && nextAssignee) {
    pushActivity(
      issue,
      'REASSIGNED',
      `Reassigned from ${previousAssignee.name} to ${nextAssignee.name}`,
      actor,
      { fromValue: previousAssignee.name, toValue: nextAssignee.name }
    );
  }

  return true;
}

function applyStatusChange(issue, nextStatus, actor) {
  if (!ISSUE_STATUSES.includes(nextStatus)) {
    throw new ApiError(400, `Invalid status '${nextStatus}'`);
  }

  const previousStatus = issue.status;
  if (previousStatus === nextStatus) return false;

  issue.status = nextStatus;

  if (nextStatus === 'IN_PROGRESS' && !issue.startedAt) {
    issue.startedAt = new Date();
  }

  if (nextStatus === 'DONE') {
    issue.completedAt = new Date();
    pushActivity(
      issue,
      'COMPLETED',
      `Marked as completed (${previousStatus.replace('_', ' ')} → Done)`,
      actor,
      { fromValue: previousStatus, toValue: nextStatus }
    );
  } else if (previousStatus === 'DONE') {
    issue.completedAt = null;
    pushActivity(issue, 'REOPENED', `Reopened (Done → ${nextStatus.replace('_', ' ')})`, actor, {
      fromValue: previousStatus,
      toValue: nextStatus,
    });
  } else {
    pushActivity(
      issue,
      'STATUS_CHANGED',
      `Status changed from ${previousStatus.replace('_', ' ')} to ${nextStatus.replace('_', ' ')}`,
      actor,
      { fromValue: previousStatus, toValue: nextStatus }
    );
  }

  return true;
}

async function notifyAssignee(companyId, issue, user, { reassigned } = {}) {
  if (!issue.assignee?.id) return;
  await notificationService.notify(companyId, {
    userId: issue.assignee.id,
    type: reassigned ? 'REASSIGNED' : 'ASSIGNED',
    title: reassigned ? `${issue.key} was reassigned to you` : `You were assigned to ${issue.key}`,
    message: issue.title,
    issueId: issue._id,
    issueKey: issue.key,
    actorId: user._id,
  });
}

async function listIssues(companyId, userId, queryParams = {}) {
  const { projectKey, status, type, priority, assigneeId, search, milestoneId, scope } = queryParams;
  const filter = { companyId, deletedAt: null };

  if (projectKey && projectKey !== 'ALL') {
    filter.projectKey = projectKey.toUpperCase();
  }

  if (status && status !== 'ALL') {
    if (status === 'OPEN') {
      filter.status = { $in: ['TODO', 'BACKLOG'] };
    } else if (status === 'IN_PROGRESS') {
      filter.status = { $in: ['IN_PROGRESS', 'IN_REVIEW'] };
    } else {
      filter.status = status;
    }
  }

  if (type && type !== 'ALL') {
    filter.type = type;
  }

  if (priority && priority !== 'ALL') {
    filter.priority = priority;
  }

  if (assigneeId && assigneeId !== 'ALL') {
    filter['assignee.id'] = assigneeId;
  }

  if (milestoneId) {
    filter.milestoneId = milestoneId;
  }

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { key: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
    ];
  }

  // Default experience is personal: unless the caller explicitly opts into the
  // company-wide "all tasks" view, scope every query down to what this user
  // created or is assigned to. This is enforced here (not just hidden in the
  // UI) so an employee can never pull another employee's task list by guessing
  // query params.
  if (scope !== 'all') {
    filter.$and = [{ $or: [{ 'assignee.id': String(userId) }, { createdBy: userId }] }];
  }

  const issues = await Issue.find(filter).sort({ createdAt: -1 });
  return issues.map((i) => i.toSafeJSON());
}

async function getIssueByIdOrKey(companyId, idOrKey) {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrKey);
  const query = { companyId, deletedAt: null };
  if (isObjectId) {
    query._id = idOrKey;
  } else {
    query.key = idOrKey.toUpperCase();
  }

  const issue = await Issue.findOne(query);
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  return issue.toSafeJSON();
}

async function createIssue(companyId, payload, user) {
  const projectKey = (payload.projectKey || 'CORE').toUpperCase().trim();
  const project = await Project.findOne({ companyId, key: projectKey, deletedAt: null });
  if (!project) {
    throw new ApiError(404, `Project with key '${projectKey}' not found`);
  }

  // Count existing issues to generate sequential issue key
  const count = await Issue.countDocuments({ companyId, projectId: project._id });
  const issueNumber = count + 101;
  const key = `${projectKey}-${issueNumber}`;

  const reporter = actorFromUser(user);
  const resolvedAssignee = payload.assigneeId ? await resolveAssignee(companyId, payload.assigneeId) : null;
  const assignee = resolvedAssignee || {
    id: reporter.id,
    name: reporter.name,
    email: reporter.email,
    role: user.role,
    department: user.department || '',
  };

  if (payload.status && !ISSUE_STATUSES.includes(payload.status)) {
    throw new ApiError(400, `Invalid status '${payload.status}'`);
  }

  const issue = new Issue({
    companyId,
    projectId: project._id,
    projectKey: project.key,
    projectName: project.name,
    key,
    issueNumber,
    title: payload.title.trim(),
    description: payload.description || '',
    type: payload.type || 'Task',
    status: payload.status || 'TODO',
    priority: payload.priority || 'MEDIUM',
    assignee,
    assignedAt: new Date(),
    reporter,
    storyPoints: Number(payload.storyPoints) || 3,
    dueDate: payload.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    epic: payload.epic || 'General Work',
    milestoneId: payload.milestoneId || null,
    labels: payload.labels || ['General'],
    subtasks: [],
    comments: [],
    activity: [],
    createdBy: user._id,
  });

  const actor = actorFromUser(user);
  pushActivity(issue, 'CREATED', `${actor.name} created this issue`, actor);
  pushActivity(issue, 'ASSIGNED', `Assigned to ${assignee.name}`, actor, { toValue: assignee.name });

  await issue.save();

  if (assignee.id !== actor.id) {
    await notifyAssignee(companyId, issue, user, { reassigned: false });
  }

  return issue.toSafeJSON();
}

async function updateIssue(companyId, id, payload, user) {
  const issue = await Issue.findOne({ _id: id, companyId, deletedAt: null });
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  const actor = actorFromUser(user);
  let assigneeChanged = false;

  if (payload.title && payload.title.trim() !== issue.title) {
    pushActivity(issue, 'TITLE_CHANGED', `Title changed to "${payload.title.trim()}"`, actor, {
      fromValue: issue.title,
      toValue: payload.title.trim(),
    });
    issue.title = payload.title.trim();
  }

  if (payload.description !== undefined && payload.description !== issue.description) {
    pushActivity(issue, 'DESCRIPTION_CHANGED', 'Description updated', actor);
    issue.description = payload.description;
  }

  if (payload.type) issue.type = payload.type;

  if (payload.status && payload.status !== issue.status) {
    applyStatusChange(issue, payload.status, actor);
  }

  if (payload.priority && payload.priority !== issue.priority) {
    pushActivity(
      issue,
      'PRIORITY_CHANGED',
      `Priority changed from ${issue.priority} to ${payload.priority}`,
      actor,
      { fromValue: issue.priority, toValue: payload.priority }
    );
    issue.priority = payload.priority;
  }

  if (payload.storyPoints !== undefined) issue.storyPoints = Number(payload.storyPoints);

  if (payload.dueDate && payload.dueDate !== issue.dueDate) {
    pushActivity(issue, 'DUE_DATE_CHANGED', `Due date changed to ${payload.dueDate}`, actor, {
      fromValue: issue.dueDate,
      toValue: payload.dueDate,
    });
    issue.dueDate = payload.dueDate;
  }

  if (payload.epic !== undefined) issue.epic = payload.epic;

  if (payload.milestoneId !== undefined && String(payload.milestoneId || '') !== String(issue.milestoneId || '')) {
    pushActivity(issue, 'MILESTONE_CHANGED', 'Milestone updated', actor);
    issue.milestoneId = payload.milestoneId || null;
  }

  if (payload.labels) issue.labels = payload.labels;
  if (payload.subtasks) issue.subtasks = payload.subtasks;

  if (payload.assigneeId !== undefined) {
    const nextAssignee = payload.assigneeId ? await resolveAssignee(companyId, payload.assigneeId) : null;
    assigneeChanged = applyAssigneeChange(issue, nextAssignee, actor);
  }

  issue.updatedBy = user._id;
  await issue.save();

  if (assigneeChanged) {
    await notifyAssignee(companyId, issue, user, { reassigned: true });
  }

  return issue.toSafeJSON();
}

async function assignIssue(companyId, id, assigneeId, user) {
  const issue = await Issue.findOne({ _id: id, companyId, deletedAt: null });
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  const actor = actorFromUser(user);
  const nextAssignee = assigneeId ? await resolveAssignee(companyId, assigneeId) : null;
  const changed = applyAssigneeChange(issue, nextAssignee, actor);

  issue.updatedBy = user._id;
  await issue.save();

  if (changed) {
    await notifyAssignee(companyId, issue, user, { reassigned: true });
  }

  return issue.toSafeJSON();
}

async function moveIssueStatus(companyId, id, status, user) {
  const issue = await Issue.findOne({ _id: id, companyId, deletedAt: null });
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  const actor = actorFromUser(user);
  const changed = applyStatusChange(issue, status, actor);

  issue.updatedBy = user._id;
  await issue.save();

  if (changed && issue.assignee?.id) {
    await notificationService.notify(companyId, {
      userId: issue.assignee.id,
      type: 'STATUS_CHANGED',
      title: `${issue.key} moved to ${status.replace('_', ' ')}`,
      message: issue.title,
      issueId: issue._id,
      issueKey: issue.key,
      actorId: user._id,
    });
  }

  return issue.toSafeJSON();
}

async function deleteIssue(companyId, id, user) {
  const issue = await Issue.findOne({ _id: id, companyId, deletedAt: null });
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  issue.deletedAt = new Date();
  issue.updatedBy = user._id;
  await issue.save();
  return { message: 'Issue deleted' };
}

async function addComment(companyId, id, content, user) {
  const issue = await Issue.findOne({ _id: id, companyId, deletedAt: null });
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  const comment = {
    id: `c-${Date.now()}`,
    author: {
      id: user._id.toString(),
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    },
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  issue.comments.push(comment);
  pushActivity(issue, 'COMMENT_ADDED', 'Added a comment', comment.author);
  await issue.save();

  const recipientIds = new Set();
  if (issue.assignee?.id) recipientIds.add(issue.assignee.id);
  if (issue.reporter?.id) recipientIds.add(issue.reporter.id);

  await Promise.all(
    [...recipientIds].map((recipientId) =>
      notificationService.notify(companyId, {
        userId: recipientId,
        type: 'COMMENT',
        title: `New comment on ${issue.key}`,
        message: comment.content,
        issueId: issue._id,
        issueKey: issue.key,
        actorId: user._id,
      })
    )
  );

  return issue.toSafeJSON();
}

async function toggleSubtask(companyId, id, subtaskId) {
  const issue = await Issue.findOne({ _id: id, companyId, deletedAt: null });
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  const subtask = issue.subtasks.find((s) => s.id === subtaskId);
  if (subtask) {
    subtask.completed = !subtask.completed;
  }
  await issue.save();
  return issue.toSafeJSON();
}

async function getActivity(companyId, id) {
  const issue = await Issue.findOne({ _id: id, companyId, deletedAt: null });
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }
  return [...issue.activity].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

async function getStats(companyId, userId, { scope } = {}) {
  const filter = { companyId, deletedAt: null };
  if (scope === 'mine') {
    filter.$or = [{ 'assignee.id': String(userId) }, { createdBy: userId }];
  }

  const issues = await Issue.find(filter);
  const today = new Date().toISOString().split('T')[0];
  const upcomingLimit = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const totalIssuesCount = issues.length;
  const openIssuesCount = issues.filter((i) => i.status === 'TODO' || i.status === 'BACKLOG').length;
  const inProgressCount = issues.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'IN_REVIEW').length;
  const completedCount = issues.filter((i) => i.status === 'DONE').length;
  const totalStoryPoints = issues.reduce((acc, i) => acc + (i.storyPoints || 0), 0);
  const completedStoryPoints = issues
    .filter((i) => i.status === 'DONE')
    .reduce((acc, i) => acc + (i.storyPoints || 0), 0);

  const overdueCount = issues.filter((i) => i.status !== 'DONE' && i.dueDate && i.dueDate < today).length;
  const dueTodayCount = issues.filter((i) => i.status !== 'DONE' && i.dueDate === today).length;
  const upcomingCount = issues.filter(
    (i) => i.status !== 'DONE' && i.dueDate > today && i.dueDate <= upcomingLimit
  ).length;

  return {
    totalIssuesCount,
    openIssuesCount,
    inProgressCount,
    completedCount,
    totalStoryPoints,
    completedStoryPoints,
    completionRate: totalIssuesCount > 0 ? Math.round((completedCount / totalIssuesCount) * 100) : 0,
    overdueCount,
    dueTodayCount,
    upcomingCount,
  };
}

module.exports = {
  listIssues,
  getIssueByIdOrKey,
  createIssue,
  updateIssue,
  assignIssue,
  moveIssueStatus,
  deleteIssue,
  addComment,
  toggleSubtask,
  getActivity,
  getStats,
};

const Issue = require('../models/Issue.model');
const Project = require('../models/Project.model');
const User = require('../models/User.model');
const Sprint = require('../models/Sprint.model');
const Epic = require('../models/Epic.model');
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
  const {
    projectKey,
    projectId,
    status,
    type,
    priority,
    assigneeId,
    search,
    sprintId,
    epicId,
    fixVersionId,
    componentId,
    milestoneId,
    scope,
    jql,
  } = queryParams;

  const filter = { companyId, deletedAt: null };

  if (projectId) {
    filter.projectId = projectId;
  }

  if (projectKey && projectKey !== 'ALL') {
    filter.projectKey = projectKey.toUpperCase();
  }

  if (sprintId) {
    if (sprintId === 'BACKLOG' || sprintId === 'null') {
      filter.sprintId = null;
    } else {
      filter.sprintId = sprintId;
    }
  }

  if (epicId) {
    filter.epicId = epicId;
  }

  if (fixVersionId) {
    filter.fixVersionIds = fixVersionId;
  }

  if (componentId) {
    filter.componentIds = componentId;
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

  // Parse simple JQL queries if provided
  if (jql) {
    // Examples: project = WEB AND status = "In Progress"
    const terms = jql.split(/\s+AND\s+/i);
    for (const term of terms) {
      const match = term.match(/(\w+)\s*(=|!=|IN|CONTAINS|~)\s*['"]?([^'"]+)['"]?/i);
      if (match) {
        const [, field, op, val] = match;
        const cleanVal = val.trim();
        const fLower = field.toLowerCase();

        if (fLower === 'project' || fLower === 'projectkey') {
          filter.projectKey = cleanVal.toUpperCase();
        } else if (fLower === 'status') {
          const normStatus = cleanVal.toUpperCase().replace(/\s+/g, '_');
          filter.status = op === '!=' ? { $ne: normStatus } : normStatus;
        } else if (fLower === 'priority') {
          filter.priority = op === '!=' ? { $ne: cleanVal.toUpperCase() } : cleanVal.toUpperCase();
        } else if (fLower === 'type' || fLower === 'issuetype') {
          filter.type = op === '!=' ? { $ne: cleanVal } : cleanVal;
        } else if (fLower === 'assignee') {
          if (cleanVal.toLowerCase() === 'currentuser()') {
            filter['assignee.id'] = String(userId);
          } else {
            filter['assignee.name'] = { $regex: cleanVal, $options: 'i' };
          }
        } else if (fLower === 'text' || fLower === 'summary') {
          filter.title = { $regex: cleanVal, $options: 'i' };
        }
      }
    }
  }

  if (scope !== 'all' && !jql) {
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

  // Resolve epic name if epicId passed
  let epicName = payload.epic || '';
  if (payload.epicId) {
    const ep = await Epic.findOne({ _id: payload.epicId, companyId });
    if (ep) epicName = ep.name;
  }

  const origEst = Number(payload.originalEstimate) || 8;

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
    startDate: payload.startDate || null,
    sprintId: payload.sprintId || null,
    epicId: payload.epicId || null,
    epic: epicName,
    componentIds: payload.componentIds || [],
    fixVersionIds: payload.fixVersionIds || [],
    affectedVersionIds: payload.affectedVersionIds || [],
    originalEstimate: origEst,
    remainingEstimate: Number(payload.remainingEstimate) || origEst,
    timeSpent: 0,
    labels: payload.labels || ['General'],
    subtasks: [],
    comments: [],
    workLogs: [],
    issueLinks: [],
    watchers: [
      {
        id: user._id.toString(),
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      },
    ],
    votes: [],
    activity: [],
    devInfo: {
      branches: [{ name: `feature/${key.toLowerCase()}-impl`, url: '#' }],
      pullRequests: [],
      buildStatus: 'Passed',
      deploymentStatus: 'Production',
    },
    customFields: payload.customFields || {},
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

  if (payload.startDate !== undefined) issue.startDate = payload.startDate;

  if (payload.sprintId !== undefined) {
    if (String(payload.sprintId || '') !== String(issue.sprintId || '')) {
      pushActivity(issue, 'SPRINT_CHANGED', 'Sprint updated', actor);
      issue.sprintId = payload.sprintId || null;
    }
  }

  if (payload.epicId !== undefined) {
    if (String(payload.epicId || '') !== String(issue.epicId || '')) {
      pushActivity(issue, 'EPIC_CHANGED', 'Epic updated', actor);
      issue.epicId = payload.epicId || null;
      if (payload.epicId) {
        const ep = await Epic.findOne({ _id: payload.epicId, companyId });
        if (ep) issue.epic = ep.name;
      } else {
        issue.epic = '';
      }
    }
  }

  if (payload.epic !== undefined) issue.epic = payload.epic;
  if (payload.componentIds) issue.componentIds = payload.componentIds;
  if (payload.fixVersionIds) issue.fixVersionIds = payload.fixVersionIds;
  if (payload.affectedVersionIds) issue.affectedVersionIds = payload.affectedVersionIds;
  if (payload.labels) issue.labels = payload.labels;
  if (payload.subtasks) issue.subtasks = payload.subtasks;
  if (payload.originalEstimate !== undefined) issue.originalEstimate = Number(payload.originalEstimate);
  if (payload.remainingEstimate !== undefined) issue.remainingEstimate = Number(payload.remainingEstimate);
  if (payload.customFields) issue.customFields = payload.customFields;

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
    reactions: {},
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

async function addReaction(companyId, id, commentId, emoji, user) {
  const issue = await Issue.findOne({ _id: id, companyId, deletedAt: null });
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  const comment = issue.comments.find((c) => c.id === commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  if (!comment.reactions) comment.reactions = new Map();
  const currentReactors = comment.reactions.get(emoji) || [];
  const uId = user._id.toString();

  if (currentReactors.includes(uId)) {
    comment.reactions.set(
      emoji,
      currentReactors.filter((r) => r !== uId)
    );
  } else {
    comment.reactions.set(emoji, [...currentReactors, uId]);
  }

  await issue.save();
  return issue.toSafeJSON();
}

async function logWork(companyId, id, { timeSpent, remainingEstimate, description }, user) {
  const issue = await Issue.findOne({ _id: id, companyId, deletedAt: null });
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  const hours = Number(timeSpent) || 1;
  const rem = remainingEstimate !== undefined ? Number(remainingEstimate) : Math.max(0, issue.remainingEstimate - hours);

  const workLog = {
    id: `wl-${Date.now()}`,
    author: actorFromUser(user),
    timeSpent: hours,
    remainingEstimate: rem,
    description: description || '',
    date: new Date().toISOString(),
  };

  issue.workLogs.push(workLog);
  issue.timeSpent = (issue.timeSpent || 0) + hours;
  issue.remainingEstimate = rem;

  pushActivity(
    issue,
    'WORKLOG_ADDED',
    `Logged ${hours}h of work (${rem}h remaining)`,
    workLog.author
  );

  await issue.save();
  return issue.toSafeJSON();
}

async function linkIssue(companyId, id, { relationship, targetIssueKey }, user) {
  const issue = await Issue.findOne({ _id: id, companyId, deletedAt: null });
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  const targetIssue = await Issue.findOne({
    companyId,
    key: targetIssueKey.toUpperCase().trim(),
    deletedAt: null,
  });

  if (!targetIssue) {
    throw new ApiError(404, `Target issue ${targetIssueKey} not found`);
  }

  const link = {
    id: `lnk-${Date.now()}`,
    relationship,
    targetIssueId: targetIssue._id.toString(),
    targetIssueKey: targetIssue.key,
    targetIssueTitle: targetIssue.title,
    targetIssueStatus: targetIssue.status,
  };

  issue.issueLinks.push(link);
  pushActivity(
    issue,
    'LINK_ADDED',
    `Linked as "${relationship}" to ${targetIssue.key}`,
    actorFromUser(user)
  );

  await issue.save();
  return issue.toSafeJSON();
}

async function deleteLink(companyId, id, linkId) {
  const issue = await Issue.findOne({ _id: id, companyId, deletedAt: null });
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  issue.issueLinks = issue.issueLinks.filter((l) => l.id !== linkId);
  await issue.save();
  return issue.toSafeJSON();
}

async function toggleWatcher(companyId, id, user) {
  const issue = await Issue.findOne({ _id: id, companyId, deletedAt: null });
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  const uId = user._id.toString();
  const isWatching = issue.watchers.some((w) => w.id === uId);

  if (isWatching) {
    issue.watchers = issue.watchers.filter((w) => w.id !== uId);
  } else {
    issue.watchers.push(actorFromUser(user));
  }

  await issue.save();
  return issue.toSafeJSON();
}

async function toggleVote(companyId, id, user) {
  const issue = await Issue.findOne({ _id: id, companyId, deletedAt: null });
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  const uId = user._id.toString();
  const hasVoted = issue.votes.includes(uId);

  if (hasVoted) {
    issue.votes = issue.votes.filter((v) => v !== uId);
  } else {
    issue.votes.push(uId);
  }

  await issue.save();
  return issue.toSafeJSON();
}

async function addSubtask(companyId, id, { title, assigneeId }, user) {
  const issue = await Issue.findOne({ _id: id, companyId, deletedAt: null });
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  const assignedUser = assigneeId ? await resolveAssignee(companyId, assigneeId) : null;

  const subtask = {
    id: `sub-${Date.now()}`,
    title: title.trim(),
    completed: false,
    status: 'TODO',
    assignee: assignedUser || actorFromUser(user),
  };

  issue.subtasks.push(subtask);
  pushActivity(issue, 'SUBTASK_ADDED', `Added subtask: ${subtask.title}`, actorFromUser(user));

  await issue.save();
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
    subtask.status = subtask.completed ? 'DONE' : 'TODO';
  }
  await issue.save();
  return issue.toSafeJSON();
}

async function deleteSubtask(companyId, id, subtaskId) {
  const issue = await Issue.findOne({ _id: id, companyId, deletedAt: null });
  if (!issue) {
    throw new ApiError(404, 'Issue not found');
  }

  issue.subtasks = issue.subtasks.filter((s) => s.id !== subtaskId);
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
  addReaction,
  logWork,
  linkIssue,
  deleteLink,
  toggleWatcher,
  toggleVote,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  getActivity,
  getStats,
};

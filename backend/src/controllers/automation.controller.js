const AutomationRule = require('../models/AutomationRule.model');
const Issue = require('../models/Issue.model');
const AuditLog = require('../models/AuditLog.model');

async function listRules(req, res) {
  try {
    const { projectId } = req.query;
    const filter = { companyId: req.user.companyId };
    if (projectId) filter.projectId = projectId;

    const rules = await AutomationRule.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: rules.map((r) => r.toSafeJSON()) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function createRule(req, res) {
  try {
    const { projectId, projectKey, name, description, trigger, conditions, actions, enabled } = req.body;
    const rule = await AutomationRule.create({
      companyId: req.user.companyId,
      projectId: projectId || null,
      projectKey: projectKey || 'GLOBAL',
      name,
      description: description || '',
      trigger,
      conditions: conditions || [],
      actions: actions || [],
      enabled: enabled !== undefined ? !!enabled : true,
    });

    await AuditLog.create({
      companyId: req.user.companyId,
      actor: { id: req.user._id, name: `${req.user.firstName} ${req.user.lastName}`, email: req.user.email },
      action: 'RULE_CREATED',
      objectType: 'AutomationRule',
      objectId: rule._id.toString(),
      objectLabel: rule.name,
    });

    return res.status(201).json({ success: true, data: rule.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function updateRule(req, res) {
  try {
    const { id } = req.params;
    const { name, description, trigger, conditions, actions, enabled } = req.body;
    const rule = await AutomationRule.findOne({ _id: id, companyId: req.user.companyId });
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    if (name) rule.name = name;
    if (description !== undefined) rule.description = description;
    if (trigger) rule.trigger = trigger;
    if (conditions) rule.conditions = conditions;
    if (actions) rule.actions = actions;
    if (enabled !== undefined) rule.enabled = enabled;

    await rule.save();
    return res.json({ success: true, data: rule.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function toggleRule(req, res) {
  try {
    const { id } = req.params;
    const rule = await AutomationRule.findOne({ _id: id, companyId: req.user.companyId });
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    rule.enabled = !rule.enabled;
    await rule.save();
    return res.json({ success: true, data: rule.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function testExecuteRule(req, res) {
  try {
    const { id } = req.params;
    const { issueKey } = req.body;

    const rule = await AutomationRule.findOne({ _id: id, companyId: req.user.companyId });
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    const logEntry = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      issueKey: issueKey || 'GLOBAL',
      status: 'SUCCESS',
      message: `Rule "${rule.name}" executed successfully for action (${rule.actions.map((a) => a.type).join(', ')})`,
    };

    rule.executionCount += 1;
    rule.lastExecutedAt = new Date();
    rule.logs.push(logEntry);
    await rule.save();

    return res.json({ success: true, message: 'Test execution completed', log: logEntry });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function deleteRule(req, res) {
  try {
    const { id } = req.params;
    const rule = await AutomationRule.findOne({ _id: id, companyId: req.user.companyId });
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    await AutomationRule.deleteOne({ _id: rule._id });
    return res.json({ success: true, message: 'Rule deleted successfully' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  listRules,
  createRule,
  updateRule,
  toggleRule,
  testExecuteRule,
  deleteRule,
};

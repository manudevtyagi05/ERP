const Component = require('../models/Component.model');
const Project = require('../models/Project.model');
const Issue = require('../models/Issue.model');
const AuditLog = require('../models/AuditLog.model');

async function listComponents(req, res) {
  try {
    const { projectId } = req.query;
    const filter = { companyId: req.user.companyId };
    if (projectId) filter.projectId = projectId;

    const components = await Component.find(filter).sort({ name: 1 });

    const componentsWithStats = await Promise.all(
      components.map(async (comp) => {
        const issues = await Issue.find({
          componentIds: comp._id.toString(),
          companyId: req.user.companyId,
        });

        const completedCount = issues.filter((i) => i.status === 'DONE').length;

        return {
          ...comp.toSafeJSON(),
          issuesCount: issues.length,
          completedCount,
        };
      })
    );

    return res.json({ success: true, data: componentsWithStats });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function createComponent(req, res) {
  try {
    const { projectId, name, description, lead, defaultAssignee } = req.body;
    const project = await Project.findOne({ _id: projectId, companyId: req.user.companyId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const component = await Component.create({
      companyId: req.user.companyId,
      projectId: project._id,
      projectKey: project.key,
      name,
      description: description || '',
      lead: lead || null,
      defaultAssignee: defaultAssignee || null,
      createdBy: req.user._id,
    });

    await AuditLog.create({
      companyId: req.user.companyId,
      projectId: project._id,
      actor: { id: req.user._id, name: `${req.user.firstName} ${req.user.lastName}`, email: req.user.email },
      action: 'COMPONENT_CREATED',
      objectType: 'Component',
      objectId: component._id.toString(),
      objectLabel: component.name,
    });

    return res.status(201).json({ success: true, data: component.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function updateComponent(req, res) {
  try {
    const { id } = req.params;
    const { name, description, lead, defaultAssignee } = req.body;
    const component = await Component.findOne({ _id: id, companyId: req.user.companyId });
    if (!component) {
      return res.status(404).json({ success: false, message: 'Component not found' });
    }

    if (name) component.name = name;
    if (description !== undefined) component.description = description;
    if (lead !== undefined) component.lead = lead;
    if (defaultAssignee !== undefined) component.defaultAssignee = defaultAssignee;

    await component.save();
    return res.json({ success: true, data: component.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function deleteComponent(req, res) {
  try {
    const { id } = req.params;
    const component = await Component.findOne({ _id: id, companyId: req.user.companyId });
    if (!component) {
      return res.status(404).json({ success: false, message: 'Component not found' });
    }

    await Issue.updateMany(
      { componentIds: component._id.toString() },
      { $pull: { componentIds: component._id.toString() } }
    );
    await Component.deleteOne({ _id: component._id });

    return res.json({ success: true, message: 'Component deleted successfully' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  listComponents,
  createComponent,
  updateComponent,
  deleteComponent,
};

const Dashboard = require('../models/Dashboard.model');

async function listDashboards(req, res) {
  try {
    let dashboards = await Dashboard.find({ companyId: req.user.companyId }).sort({ isDefault: -1, createdAt: 1 });
    if (dashboards.length === 0) {
      const defaultDashboard = await Dashboard.create({
        companyId: req.user.companyId,
        name: 'Executive Engineering Dashboard',
        description: 'Primary overview of sprint velocity, assigned items, release progress and active issues.',
        isDefault: true,
        owner: {
          id: req.user._id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email,
        },
        widgets: [
          { id: 'w1', type: 'STATS_KPIS', title: 'Key Metrics & Completion', colSpan: 24, config: {} },
          { id: 'w2', type: 'ASSIGNED_TO_ME', title: 'Assigned to Me', colSpan: 12, config: { limit: 6 } },
          { id: 'w3', type: 'STATUS_PIE', title: 'Issue Status Breakdown', colSpan: 12, config: {} },
          { id: 'w4', type: 'SPRINT_BURNDOWN', title: 'Active Sprint Health & Burndown', colSpan: 12, config: {} },
          { id: 'w5', type: 'ACTIVITY_STREAM', title: 'Team Activity Feed', colSpan: 12, config: { limit: 6 } },
        ],
      });
      dashboards = [defaultDashboard];
    }

    return res.json({ success: true, data: dashboards.map((d) => d.toSafeJSON()) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function createDashboard(req, res) {
  try {
    const { name, description, widgets, isDefault } = req.body;
    const dashboard = await Dashboard.create({
      companyId: req.user.companyId,
      name,
      description: description || '',
      isDefault: !!isDefault,
      owner: {
        id: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
      },
      widgets: widgets || [
        { id: 'w1', type: 'STATS_KPIS', title: 'Key Performance Indicators', colSpan: 24, config: {} },
        { id: 'w2', type: 'ASSIGNED_TO_ME', title: 'Assigned to Me', colSpan: 12, config: {} },
        { id: 'w3', type: 'STATUS_PIE', title: 'Issue Status Breakdown', colSpan: 12, config: {} },
      ],
    });

    return res.status(201).json({ success: true, data: dashboard.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function updateDashboard(req, res) {
  try {
    const { id } = req.params;
    const { name, description, widgets, isDefault } = req.body;
    const dashboard = await Dashboard.findOne({ _id: id, companyId: req.user.companyId });
    if (!dashboard) {
      return res.status(404).json({ success: false, message: 'Dashboard not found' });
    }

    if (name) dashboard.name = name;
    if (description !== undefined) dashboard.description = description;
    if (widgets) dashboard.widgets = widgets;
    if (isDefault !== undefined) dashboard.isDefault = isDefault;

    await dashboard.save();
    return res.json({ success: true, data: dashboard.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function deleteDashboard(req, res) {
  try {
    const { id } = req.params;
    const dashboard = await Dashboard.findOne({ _id: id, companyId: req.user.companyId });
    if (!dashboard) {
      return res.status(404).json({ success: false, message: 'Dashboard not found' });
    }

    await Dashboard.deleteOne({ _id: dashboard._id });
    return res.json({ success: true, message: 'Dashboard deleted successfully' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  listDashboards,
  createDashboard,
  updateDashboard,
  deleteDashboard,
};

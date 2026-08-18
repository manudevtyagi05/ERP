const Filter = require('../models/Filter.model');
const Issue = require('../models/Issue.model');

async function listFilters(req, res) {
  try {
    const filters = await Filter.find({ companyId: req.user.companyId }).sort({ isFavorite: -1, createdAt: -1 });
    return res.json({ success: true, data: filters.map((f) => f.toSafeJSON()) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function createFilter(req, res) {
  try {
    const { name, description, query, visibility, isFavorite, projectId } = req.body;
    const filter = await Filter.create({
      companyId: req.user.companyId,
      name,
      description: description || '',
      query,
      owner: {
        id: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
      },
      visibility: visibility || 'ORGANIZATION',
      isFavorite: !!isFavorite,
      projectId: projectId || null,
    });

    return res.status(201).json({ success: true, data: filter.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function updateFilter(req, res) {
  try {
    const { id } = req.params;
    const { name, description, query, visibility, isFavorite } = req.body;
    const filter = await Filter.findOne({ _id: id, companyId: req.user.companyId });
    if (!filter) {
      return res.status(404).json({ success: false, message: 'Filter not found' });
    }

    if (name) filter.name = name;
    if (description !== undefined) filter.description = description;
    if (query) filter.query = query;
    if (visibility) filter.visibility = visibility;
    if (isFavorite !== undefined) filter.isFavorite = isFavorite;

    await filter.save();
    return res.json({ success: true, data: filter.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function toggleFavorite(req, res) {
  try {
    const { id } = req.params;
    const filter = await Filter.findOne({ _id: id, companyId: req.user.companyId });
    if (!filter) {
      return res.status(404).json({ success: false, message: 'Filter not found' });
    }

    filter.isFavorite = !filter.isFavorite;
    await filter.save();
    return res.json({ success: true, data: filter.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function deleteFilter(req, res) {
  try {
    const { id } = req.params;
    const filter = await Filter.findOne({ _id: id, companyId: req.user.companyId });
    if (!filter) {
      return res.status(404).json({ success: false, message: 'Filter not found' });
    }

    await Filter.deleteOne({ _id: filter._id });
    return res.json({ success: true, message: 'Filter deleted successfully' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  listFilters,
  createFilter,
  updateFilter,
  toggleFavorite,
  deleteFilter,
};

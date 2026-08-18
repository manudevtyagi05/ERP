const Board = require('../models/Board.model');
const Project = require('../models/Project.model');

async function getBoardByProject(req, res) {
  try {
    const { projectId } = req.params;
    let board = await Board.findOne({ projectId, companyId: req.user.companyId });
    if (!board) {
      const project = await Project.findOne({ _id: projectId, companyId: req.user.companyId });
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      board = await Board.create({
        companyId: req.user.companyId,
        projectId: project._id,
        projectKey: project.key,
        name: `${project.name} Board`,
        type: 'SCRUM',
        columns: [
          { id: 'BACKLOG', title: 'Backlog', status: 'BACKLOG', wipLimit: 0, color: '#94a3b8' },
          { id: 'TODO', title: 'To Do', status: 'TODO', wipLimit: 0, color: '#60a5fa' },
          { id: 'IN_PROGRESS', title: 'In Progress', status: 'IN_PROGRESS', wipLimit: 5, color: '#3b82f6' },
          { id: 'IN_REVIEW', title: 'In Review', status: 'IN_REVIEW', wipLimit: 3, color: '#f59e0b' },
          { id: 'DONE', title: 'Done', status: 'DONE', wipLimit: 0, color: '#22c55e' },
        ],
      });
    }

    return res.json({ success: true, data: board.toSafeJSON() });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function updateBoardColumns(req, res) {
  try {
    const { projectId } = req.params;
    const { columns, name, type } = req.body;

    let board = await Board.findOne({ projectId, companyId: req.user.companyId });
    if (!board) {
      const project = await Project.findOne({ _id: projectId, companyId: req.user.companyId });
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      board = new Board({
        companyId: req.user.companyId,
        projectId: project._id,
        projectKey: project.key,
      });
    }

    if (columns) board.columns = columns;
    if (name) board.name = name;
    if (type) board.type = type;

    await board.save();
    return res.json({ success: true, data: board.toSafeJSON() });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  getBoardByProject,
  updateBoardColumns,
};

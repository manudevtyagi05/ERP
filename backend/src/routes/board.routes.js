const express = require('express');
const router = express.Router();
const boardController = require('../controllers/board.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/project/:projectId', boardController.getBoardByProject);
router.put('/project/:projectId', boardController.updateBoardColumns);

module.exports = router;

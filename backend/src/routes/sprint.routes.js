const express = require('express');
const router = express.Router();
const sprintController = require('../controllers/sprint.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', sprintController.listSprints);
router.post('/', sprintController.createSprint);
router.put('/:id', sprintController.updateSprint);
router.post('/:id/start', sprintController.startSprint);
router.post('/:id/complete', sprintController.completeSprint);
router.delete('/:id', sprintController.deleteSprint);

module.exports = router;

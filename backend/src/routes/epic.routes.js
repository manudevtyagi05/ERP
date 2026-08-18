const express = require('express');
const router = express.Router();
const epicController = require('../controllers/epic.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', epicController.listEpics);
router.post('/', epicController.createEpic);
router.put('/:id', epicController.updateEpic);
router.delete('/:id', epicController.deleteEpic);

module.exports = router;

const express = require('express');
const router = express.Router();
const componentController = require('../controllers/component.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', componentController.listComponents);
router.post('/', componentController.createComponent);
router.put('/:id', componentController.updateComponent);
router.delete('/:id', componentController.deleteComponent);

module.exports = router;

const express = require('express');
const router = express.Router();
const filterController = require('../controllers/filter.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', filterController.listFilters);
router.post('/', filterController.createFilter);
router.put('/:id', filterController.updateFilter);
router.post('/:id/favorite', filterController.toggleFavorite);
router.delete('/:id', filterController.deleteFilter);

module.exports = router;

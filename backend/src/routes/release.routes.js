const express = require('express');
const router = express.Router();
const releaseController = require('../controllers/release.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', releaseController.listReleases);
router.post('/', releaseController.createRelease);
router.put('/:id', releaseController.updateRelease);
router.delete('/:id', releaseController.deleteRelease);

module.exports = router;

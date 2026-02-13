const express = require('express');
const router = express.Router();
const { getSystemStatus, updateMaintenanceMode } = require('../controllers/systemController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/status', getSystemStatus);
router.put('/maintenance', protect, authorize('Admin'), updateMaintenanceMode);

module.exports = router;

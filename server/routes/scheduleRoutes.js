const express = require('express');
const router = express.Router();
const {
    upsertSchedule,
    getTodaySchedule,
    getAllSchedules,
    deleteSchedule
} = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/today', protect, getTodaySchedule);

// Admin routes
router.use(protect);
router.use(authorize('Admin'));

router.route('/')
    .get(getAllSchedules)
    .post(upsertSchedule);

router.route('/:id')
    .delete(deleteSchedule);

module.exports = router;

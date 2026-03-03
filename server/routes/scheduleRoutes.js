const express = require('express');
const router = express.Router();
const {
    upsertSchedule,
    getTodaySchedule,
    getAllSchedules,
    deleteSchedule,
    getMyExams
} = require('../controllers/scheduleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/today', protect, getTodaySchedule);
router.get('/my-exams', protect, getMyExams);

// Admin routes
router.use(protect);
router.use(authorize('Admin'));

router.route('/')
    .get(getAllSchedules)
    .post(upsertSchedule);

router.route('/:id')
    .delete(deleteSchedule);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
    getAllAttendance,
    getStudentAttendance,
    updateAttendance,
    bulkUpdateAttendance,
    clearAttendance,
    deleteAttendance
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(authorize('Admin'), getAllAttendance)
    .delete(authorize('Admin'), clearAttendance);

router.get('/my-attendance', getStudentAttendance);

router.route('/:id')
    .put(updateAttendance)
    .delete(authorize('Admin'), deleteAttendance);

router.post('/bulk', bulkUpdateAttendance);

module.exports = router;

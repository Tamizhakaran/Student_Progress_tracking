const express = require('express');
const router = express.Router();
const {
    getAllAttendance,
    getStudentAttendance,
    updateAttendance,
    bulkUpdateAttendance,
    clearAttendance,
    deleteAttendance,
    debugAttendance
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(authorize('Admin'), getAllAttendance)
    .delete(authorize('Admin'), clearAttendance);

router.get('/my-attendance', getStudentAttendance);

// IMPORTANT: /bulk must be declared BEFORE /:id to prevent Express
// from treating "bulk" as an id parameter.
router.get('/debug', authorize('Admin'), debugAttendance);
router.post('/bulk', authorize('Admin'), bulkUpdateAttendance);

router.route('/:id')
    .put(updateAttendance)
    .delete(authorize('Admin'), deleteAttendance);

module.exports = router;

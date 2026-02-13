const express = require('express');
const router = express.Router();
const {
    upsertMark,
    getStudentMarks,
    getMyMarks
} = require('../controllers/markController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my-marks', protect, getMyMarks);

// Admin routes
router.use(protect);
router.use(authorize('Admin'));

router.post('/', upsertMark);
router.get('/student/:studentId', getStudentMarks);

module.exports = router;

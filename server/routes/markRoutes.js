const express = require('express');
const router = express.Router();
const {
    upsertMark,
    getStudentMarks,
    getMyMarks,
    deleteMark
} = require('../controllers/markController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my-marks', protect, getMyMarks);

// Admin routes
router.use(protect);
router.use(authorize('Admin'));

router.post('/', upsertMark);
router.get('/student/:studentId', getStudentMarks);
router.delete('/:id', deleteMark);

module.exports = router;

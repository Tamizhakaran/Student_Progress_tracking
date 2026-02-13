const express = require('express');
const {
    getStudents,
    getTopPerformers,
    updateStudent,
    createStudent,
    deleteStudent,
    getStudentRank
} = require('../controllers/studentController');

const router = express.Router();

const { protect, authorize } = require('../middleware/authMiddleware');

// Public route for all authenticated users (before admin authorization)
router.get('/top-performers', protect, getTopPerformers);
router.get('/rank', protect, getStudentRank);

// Admin-only routes
router.use(protect);
router.use(authorize('Admin'));

router.route('/')
    .get(getStudents)
    .post(createStudent);

router.route('/:id')
    .put(updateStudent)
    .delete(deleteStudent);

module.exports = router;

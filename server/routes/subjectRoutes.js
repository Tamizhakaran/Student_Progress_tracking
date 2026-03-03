const express = require('express');
const router = express.Router();
const {
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    bulkCreateSubjects
} = require('../controllers/subjectController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getSubjects)
    .post(authorize('Admin'), createSubject);

router.post('/bulk', authorize('Admin'), bulkCreateSubjects);

router.route('/:id')
    .put(authorize('Admin'), updateSubject)
    .delete(authorize('Admin'), deleteSubject);

module.exports = router;

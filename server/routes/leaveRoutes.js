const express = require('express');
const router = express.Router();
const {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    updateLeaveStatus
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', authorize('Student'), applyLeave);
router.get('/my', authorize('Student'), getMyLeaves);

router.get('/admin/all', authorize('Admin'), getAllLeaves);
router.put('/:id/status', authorize('Admin'), updateLeaveStatus);

module.exports = router;

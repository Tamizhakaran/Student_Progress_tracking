const express = require('express');
const router = express.Router();
const {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    updateLeaveStatus,
    deleteLeave
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', authorize('Student'), applyLeave);
router.get('/my', authorize('Student'), getMyLeaves);

router.get('/admin/all', authorize('Admin'), getAllLeaves);
router.put('/:id/status', authorize('Admin'), updateLeaveStatus);
router.delete('/:id', authorize('Admin'), deleteLeave);

module.exports = router;

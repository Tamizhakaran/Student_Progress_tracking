const express = require('express');
const router = express.Router();
const {
    getFees,
    getStudentFees,
    createFee,
    updateFee,
    deleteFee,
    bulkUpdateFees
} = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('Admin'), getFees)
    .post(protect, authorize('Admin'), createFee);

router.put('/bulk', protect, authorize('Admin'), bulkUpdateFees);

router.get('/myfees', protect, getStudentFees);

router.route('/:id')
    .put(protect, authorize('Admin'), updateFee)
    .delete(protect, authorize('Admin'), deleteFee);

module.exports = router;

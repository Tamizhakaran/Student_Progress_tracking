const express = require('express');
const router = express.Router();
const {
    getPlacements,
    createPlacement,
    updatePlacement,
    deletePlacement
} = require('../controllers/placementController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/')
    .get(getPlacements)
    .post(authorize('Admin'), createPlacement);

router.route('/:id')
    .put(protect, authorize('Admin'), updatePlacement)
    .delete(protect, authorize('Admin'), deletePlacement);

module.exports = router;

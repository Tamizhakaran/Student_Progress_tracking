const Placement = require('../models/Placement');
const asyncHandler = require('express-async-handler');

// @desc    Get all placements
// @route   GET /api/placements
// @access  Public
const getPlacements = asyncHandler(async (req, res) => {
    let query = {};
    
    // Admin isolation logic
    if (req.user) {
        if (req.user.role === 'Admin') {
            // Super Admin sees everything, others see only their own
            if (req.user.email !== 'admin@bitsathy.ac.in') {
                query.adminId = req.user._id;
            }
        } else if (req.user.role === 'Student') {
            // Students see placements from their own admin
            if (req.user.adminId) {
                query.adminId = req.user.adminId;
            }
        }
    }

    const placements = await Placement.find(query).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        count: placements.length,
        data: placements
    });
});

// @desc    Create a placement record
// @route   POST /api/placements
// @access  Private/Admin
const createPlacement = asyncHandler(async (req, res) => {
    const placement = await Placement.create({
        ...req.body,
        adminId: req.user._id
    });
    res.status(201).json({
        success: true,
        data: placement
    });
});

// @desc    Update a placement record
// @route   PUT /api/placements/:id
// @access  Private/Admin
const updatePlacement = asyncHandler(async (req, res) => {
    let placement = await Placement.findById(req.params.id);

    if (!placement) {
        res.status(404);
        throw new Error('Placement record not found');
    }

    placement = await Placement.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: placement
    });
});

// @desc    Delete a placement record
// @route   DELETE /api/placements/:id
// @access  Private/Admin
const deletePlacement = asyncHandler(async (req, res) => {
    const placement = await Placement.findById(req.params.id);

    if (!placement) {
        res.status(404);
        throw new Error('Placement record not found');
    }

    await placement.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

module.exports = {
    getPlacements,
    createPlacement,
    updatePlacement,
    deletePlacement
};

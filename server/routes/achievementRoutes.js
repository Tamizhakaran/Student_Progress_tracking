const express = require('express');
const router = express.Router();
const {
    submitAchievement,
    getMyAchievements,
    getAllAchievements,
    verifyAchievement,
    getAchievementStats,
    deleteAchievement
} = require('../controllers/achievementController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.post('/', upload.single('certificate'), submitAchievement);
router.get('/my', getMyAchievements);
router.get('/stats', getAchievementStats);

router.get('/admin/all', authorize('Admin'), getAllAchievements);
router.put('/:id/verify', authorize('Admin'), verifyAchievement);
router.delete('/:id', authorize('Admin'), deleteAchievement);

module.exports = router;

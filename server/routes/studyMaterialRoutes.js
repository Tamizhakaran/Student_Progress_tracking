const express = require('express');
const router = express.Router();
const {
    getStudyMaterials,
    createStudyMaterial,
    deleteStudyMaterial
} = require('../controllers/studyMaterialController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getStudyMaterials)
    .post(authorize('Admin'), createStudyMaterial);

router.route('/:id')
    .delete(authorize('Admin'), deleteStudyMaterial);

module.exports = router;

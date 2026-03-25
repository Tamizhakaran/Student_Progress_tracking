const Achievement = require('../models/Achievement');
const User = require('../models/User');
const fs = require('fs');

// @desc    Submit a new achievement
// @route   POST /api/achievements
// @access  Private (Student)
exports.submitAchievement = async (req, res) => {
    try {
        console.log('Submission Body:', req.body);
        console.log('Submission File:', req.file);
        console.log('User from request:', req.user);

        const { eventName, certificationName, date, notes } = req.body;

        if (!req.file) {
            console.error('Submission Error: No file provided');
            return res.status(400).json({
                success: false,
                message: 'Please provide a certificate file'
            });
        }

        let certificatePath = `/uploads/certificates/${req.file.filename}`;
        
        try {
            // Convert to Base64 to prevent data loss on ephemeral file systems (like Render)
            const fileData = fs.readFileSync(req.file.path);
            certificatePath = `data:${req.file.mimetype};base64,${fileData.toString('base64')}`;

            // Delete the temporary file
            fs.unlinkSync(req.file.path);
        } catch (fileErr) {
            console.error("Error converting certificate to Base64:", fileErr);
        }

        console.log('Certificate Path Length:', certificatePath.length > 200 ? 'Base64 String' : certificatePath);

        const achievement = await Achievement.create({
            student: req.user._id,
            eventName,
            certificationName,
            date,
            notes,
            certificate: certificatePath
        });

        console.log('Achievement saved to MongoDB:', achievement);

        res.status(201).json({
            success: true,
            data: achievement
        });
    } catch (error) {
        console.error('Submission Error Exception:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get current student's achievements
// @route   GET /api/achievements/my
// @access  Private (Student)
exports.getMyAchievements = async (req, res) => {
    try {
        console.log('Fetching achievements for student ID:', req.user?._id);
        const achievements = await Achievement.find({ student: req.user._id })
            .sort({ date: -1 });

        console.log(`Found ${achievements.length} achievements`);

        res.status(200).json({
            success: true,
            count: achievements.length,
            data: achievements
        });
    } catch (error) {
        console.error('GetMyAchievements Error:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all achievements (Admin)
// @route   GET /api/achievements
// @access  Private (Admin)
exports.getAllAchievements = async (req, res) => {
    try {
        const students = await User.find({ role: 'Student', adminId: req.user._id }).select('_id');
        const studentIds = students.map(s => s._id);

        const achievements = await Achievement.find({ student: { $in: studentIds } })
            .populate('student', 'name registerNumber department')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: achievements.length,
            data: achievements
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Verify or reject an achievement
// @route   PUT /api/achievements/:id/verify
// @access  Private (Admin)
exports.verifyAchievement = async (req, res) => {
    try {
        const { status, notes } = req.body;

        if (!['Verified', 'Rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const achievement = await Achievement.findById(req.params.id).populate('student');
        if (!achievement) {
            return res.status(404).json({
                success: false,
                message: 'Achievement not found'
            });
        }

        // Check if student belongs to this admin
        if (achievement.student.adminId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to verify this achievement'
            });
        }

        achievement.status = status;
        achievement.verifiedBy = req.user._id;
        achievement.adminRemark = req.body.remark || '';
        await achievement.save();

        res.status(200).json({
            success: true,
            data: achievement
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get dashboard stats (Achievement count)
// @route   GET /api/achievements/stats
// @access  Private (Student)
exports.getAchievementStats = async (req, res) => {
    try {
        const verifiedCount = await Achievement.countDocuments({
            student: req.user._id,
            status: 'Verified'
        });

        res.status(200).json({
            success: true,
            verifiedCount
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete an achievement record
// @route   DELETE /api/achievements/:id
// @access  Private (Admin)
exports.deleteAchievement = async (req, res) => {
    try {
        const achievement = await Achievement.findById(req.params.id).populate('student');
        if (!achievement) {
            return res.status(404).json({
                success: false,
                message: 'Achievement not found'
            });
        }

        // Check if student belongs to this admin
        if (achievement.student.adminId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this achievement'
            });
        }

        await Achievement.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

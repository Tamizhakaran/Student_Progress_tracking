const mongoose = require('mongoose');

async function findStudentIssue() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/edutrack_x');
        const Attendance = require('./models/Attendance');

        const records = await Attendance.find({}).populate('student', 'name email');

        const studentStats = {};
        records.forEach(r => {
            const sid = r.student?._id?.toString() || r.student?.toString();
            if (!studentStats[sid]) studentStats[sid] = [];
            studentStats[sid].push(r);
        });

        for (const [sid, logs] of Object.entries(studentStats)) {
            if (logs.length >= 4) { // Look for any student with records
                console.log(`\nStudent: ${logs[0].student?.name || sid} (${sid})`);
                logs.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(l => {
                    console.log(`  Raw Date: ${l.date.toISOString()} | Slot: ${l.slot} | Status: ${l.status} | CreatedAt: ${l.createdAt.toISOString()}`);
                });
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findStudentIssue();

/**
 * Calculates a student's attendance percentage using the two-session (FN/AN) rule:
 *   - Present in BOTH sessions on a day  → 1.0 day
 *   - Present in ONLY ONE session         → 0.5 days
 *   - Absent in both sessions             → 0 days
 *
 * @param {Array} records - Attendance records for the student (each with .date, .slot, .status)
 * @returns {string} Percentage string like "87.5"
 */
export const calcAttendancePercentage = (records) => {
    const dayMap = {}; // { 'YYYY-MM-DD': { FN: bool, AN: bool } }

    records.forEach(r => {
        // Use UTC date string to avoid timezone shifts
        const d = new Date(r.date);
        const dateKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        if (!dayMap[dateKey]) dayMap[dateKey] = { FN: false, AN: false };
        if (['Present', 'Late'].includes(r.status)) {
            dayMap[dateKey][r.slot] = true;
        }
    });

    let totalDays = 0;
    let presentDays = 0;

    Object.values(dayMap).forEach(day => {
        // totalDays += 1;
        if (day.FN !== undefined) totalDays += 0.5;
        if (day.AN !== undefined) totalDays += 0.5;

        if (day.FN) presentDays += 0.5;
        if (day.AN) presentDays += 0.5;
    });

    return totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '0.0';
};

/**
 * Returns per-day attendance summary for a student.
 * @param {Array} records - Attendance records
 * @returns {{ totalDays, presentDays, halfDays, fullDays, absentDays, percentage }}
 */
export const calcAttendanceBreakdown = (records) => {
    const dayMap = {};

    records.forEach(r => {
        const d = new Date(r.date);
        const dateKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        if (!dayMap[dateKey]) dayMap[dateKey] = { FN: false, AN: false };
        if (['Present', 'Late'].includes(r.status)) {
            dayMap[dateKey][r.slot] = true;
        }
    });

    let totalDays = 0, presentDays = 0, fullDays = 0, halfDays = 0, absentDays = 0;

    Object.values(dayMap).forEach(day => {
        // totalDays += 1; // Correct to session-based possible days
        if (day.FN !== undefined) totalDays += 0.5;
        if (day.AN !== undefined) totalDays += 0.5;

        const sessions = (day.FN ? 1 : 0) + (day.AN ? 1 : 0);
        if (sessions === 2) { fullDays++; presentDays += 1.0; }
        else if (sessions === 1) { halfDays++; presentDays += 0.5; }
        else {
            // Only count as absent if records exist for those slots but are not present
            if (day.FN === false || day.AN === false) absentDays += ((day.FN === false ? 0.5 : 0) + (day.AN === false ? 0.5 : 0));
        }
    });

    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '0.0';
    return { totalDays, presentDays, fullDays, halfDays, absentDays, percentage };
};

const System = require('../models/System');

const getSystemStatus = async (req, res) => {
    try {
        let system = await System.findOne();
        if (!system) {
            system = await System.create({ isMaintenanceMode: false });
        }
        res.json(system);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateMaintenanceMode = async (req, res) => {
    try {
        const { isMaintenanceMode } = req.body;
        let system = await System.findOne();
        if (!system) {
            system = await System.create({ isMaintenanceMode });
        } else {
            system.isMaintenanceMode = isMaintenanceMode;
            await system.save();
        }
        res.json(system);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSystemStatus,
    updateMaintenanceMode,
};

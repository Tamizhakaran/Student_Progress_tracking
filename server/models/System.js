const mongoose = require('mongoose');

const systemSchema = mongoose.Schema(
    {
        isMaintenanceMode: {
            type: Boolean,
            required: true,
            default: false,
        },
        maintenanceMessage: {
            type: String,
            default: 'Currently the page is not available. It is under maintenance.',
        },
    },
    {
        timestamps: true,
    }
);

const System = mongoose.model('System', systemSchema);

module.exports = System;

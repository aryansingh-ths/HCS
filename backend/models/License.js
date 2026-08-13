const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
    client: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Client',
        required: true 
    },
    hardwareId: { 
        type: String, 
        required: true 
    },
    modules: [{ 
        type: String 
    }],
    expiresAt: { 
        type: Date, 
        required: true 
    },
    licenseKey: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['ACTIVE', 'REVOKED', 'EXPIRED'], 
        default: 'ACTIVE' 
    },
    networkInfo: {
        publicIp: { type: String },
        localIp: { type: String },
        city: { type: String },
        country: { type: String }
    },
     hostname: { 
        type: String, 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('License', licenseSchema);
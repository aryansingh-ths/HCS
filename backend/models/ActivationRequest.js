const mongoose = require('mongoose');

const activationRequestSchema = new mongoose.Schema({
    
    // ==========================================
    // 1. TELEMETRY DATA (Auto-populated by the hotel server)
    // ==========================================
    hardwareId: { 
        type: String, 
        required: true, 
        index: true,
        description: "The unique identifier combining OS Hostname and MAC Address"
    },
    macAddress: { 
        type: String, 
        required: true 
    },
    hostname: { 
        type: String, 
        required: true 
    },
    networkInfo: {
        publicIp: { type: String },
        localIp: { type: String },
        city: { type: String },
        country: { type: String }
    },

    // ==========================================
    // 2. QUEUE STATE (Manages the workflow)
    // ==========================================
    status: { 
        type: String, 
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'FETCHED'], 
        default: 'PENDING',
        index: true 
    },

    // ==========================================
    // 3. APPROVAL DATA (Added by Sales Team in UI)
    // ==========================================
    // Links to your CRM Client collection
    clientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Client' 
    },
    licensedModules: [{ 
        type: String,
        enum: ['FRONT_DESK', 'DINING', 'HOUSEKEEPING', 'FINANCE', 'SALES', 'Travel']
    }],
    validMonths: { 
        type: Number 
    },

    // ==========================================
    // 4. THE PAYLOAD (The Cryptographic Key)
    // ==========================================
    // This remains null until the sales agent clicks 'Approve'
    generatedLicenseKey: { 
        type: String 
    },

    // ==========================================
    // 5. AUDIT TRAIL (Security Tracking)
    // ==========================================
    approvedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' // Links to the Sales Agent who clicked approve
    },
    approvedAt: { 
        type: Date 
    },
    
    // Auto-delete stale requests after 24 hours if no one approves them
    expiresAt: { 
        type: Date, 
        default: () => Date.now() + 24 * 60 * 60 * 1000 
    }

}, { 
    timestamps: true // Automatically adds createdAt and updatedAt
});

// TTL Index: Automatically removes documents when 'expiresAt' is reached
activationRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 1800 });

module.exports = mongoose.model('ActivationRequest', activationRequestSchema);

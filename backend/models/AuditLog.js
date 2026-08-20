const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN_SUCCESS',
            'LOGIN_FAILED',
            'CLIENT_CREATED',
            'CLIENT_UPDATED',
            'CLIENT_DELETED',
            'LICENSE_GENERATED',
            'LICENSE_REVOKED',
            'ACTIVATION_APPROVED',
            'ACTIVATION_REJECTED'
        ]
    },
    entityType: {
        type: String,
        enum: ['Client', 'License', 'ActivationRequest', 'Auth']
    },
    entityId: {
        type: mongoose.Schema.Types.Mixed
    },
    user: {
        type: String,
        required: true,
        default: 'System Admin'
    },
    details: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);

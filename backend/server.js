require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

const License = require('./models/License');
const ActivationRequest = require('./models/ActivationRequest');
const Client = require('./models/Client');
const AuditLog = require('./models/AuditLog');

// Audit Logger Helper
const logAudit = async (action, entityType, entityId, user, details) => {
    try {
        await AuditLog.create({ action, entityType, entityId, user, details });
    } catch (err) {
        console.error("Failed to write audit log:", err);
    }
};

// Load the Private Key safely into memory
let privateKey;
try {
    privateKey = fs.readFileSync('private.pem', 'utf8');
} catch (err) {
    console.error("❌ CRITICAL: private.pem not found. Run generateKeys.js first.");
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Database'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));


// ==========================================
// 🔐 ROUTE: AUTHENTICATION
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    // We only have one admin user configured via environment variables
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'admin';

    if (username === validUsername && password === validPassword) {
        // Successful login: Generate a session token
        const token = jwt.sign({ role: 'admin', username }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '12h' });
        await logAudit('LOGIN_SUCCESS', 'Auth', null, username, 'Administrator logged in successfully.');
        return res.json({ success: true, message: "Login successful", token });
    } else {
        await logAudit('LOGIN_FAILED', 'Auth', null, username || 'Unknown', 'Failed login attempt with invalid credentials.');
        return res.status(401).json({ success: false, error: "Invalid credentials" });
    }
});

// Middleware to protect dashboard routes
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Unauthorized access. No token provided." });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired session token." });
    }
};

// ==========================================
// 🏢 ROUTE: CLIENT MANAGEMENT
// ==========================================
app.post('/api/clients', authMiddleware, async (req, res) => {
    try {
        const { name, propertyName, contact, email, status } = req.body;
        
        // Generate unique IDs
        const clientId = 'CLT-' + require('crypto').randomBytes(3).toString('hex').toUpperCase();
        const propertyId = 'PRP-' + require('crypto').randomBytes(3).toString('hex').toUpperCase();

        const newClient = new Client({ clientId, propertyId, name, propertyName, contact, email, status });
        await newClient.save();
        await logAudit('CLIENT_CREATED', 'Client', newClient._id, req.user.username, `Created new client: ${name}`);
        res.status(201).json(newClient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create client." });
    }
});

app.get('/api/clients', authMiddleware, async (req, res) => {
    try {
        const clients = await Client.find().sort({ createdAt: -1 });
        res.json(clients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch clients." });
    }
});

app.put('/api/clients/:id', authMiddleware, async (req, res) => {
    try {
        const { name, propertyName, contact, email, status } = req.body;
        const updatedClient = await Client.findByIdAndUpdate(
            req.params.id,
            { name, propertyName, contact, email, status },
            { new: true } // Return the updated document
        );
        if (!updatedClient) return res.status(404).json({ error: "Client not found." });
        await logAudit('CLIENT_UPDATED', 'Client', updatedClient._id, req.user.username, `Updated client details: ${name}`);
        res.json(updatedClient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update client." });
    }
});

app.delete('/api/clients/:id', authMiddleware, async (req, res) => {
    try {
        const deletedClient = await Client.findByIdAndDelete(req.params.id);
        if (!deletedClient) return res.status(404).json({ error: "Client not found." });
        await logAudit('CLIENT_DELETED', 'Client', req.params.id, req.user.username, `Deleted client: ${deletedClient.name}`);
        res.json({ message: "Client deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete client." });
    }
});

// ==========================================
// 📡 ROUTE: ACTIVATION REQUESTS (AUTO-PING)
// ==========================================
app.post('/api/activation-requests', async (req, res) => {
    try {
        const { hardwareId, macAddress, hostname, networkInfo } = req.body;
        const newRequest = new ActivationRequest({ hardwareId, macAddress, hostname, networkInfo });
        await newRequest.save();
        res.status(201).json({ message: "Activation request received", request: newRequest });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create activation request." });
    }
});

app.post('/api/activation-requests/:id/approve', authMiddleware, async (req, res) => {
    try {
        const { clientId, validMonths, modules } = req.body;
        const requestId = req.params.id;

        const request = await ActivationRequest.findById(requestId);
        if (!request) return res.status(404).json({ error: "Request not found" });

        const client = await Client.findById(clientId);
        if (!client) return res.status(404).json({ error: "Client not found" });

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + parseInt(validMonths));

        const payload = {
            client: client.name,
            machine_id: request.hardwareId,
            modules: modules
        };

        const licenseKey = jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: `${validMonths * 30}d`
        });

        // Update Request
        request.status = 'APPROVED';
        request.clientId = clientId;
        request.licensedModules = modules;
        request.validMonths = validMonths;
        request.generatedLicenseKey = licenseKey;
        await request.save();

        // Create License record
        const newLicense = new License({
            client: clientId,
            hardwareId: request.hardwareId,
            modules,
            expiresAt,
            licenseKey,
            networkInfo: request.networkInfo,
            hostname: request.hostname
        });
        await newLicense.save();

        await logAudit('ACTIVATION_APPROVED', 'ActivationRequest', request._id, req.user.username, `Approved activation request for hardware ID: ${request.hardwareId}`);

        res.json({ message: "Approved successfully", licenseKey });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Approval failed." });
    }
});

app.get('/api/activation-requests/:hardwareId/status', async (req, res) => {
    try {
        const { hardwareId } = req.params;
        const request = await ActivationRequest.findOne({ hardwareId }).sort({ createdAt: -1 });
        if (!request) return res.status(404).json({ error: "No request found" });

        if (request.status === 'APPROVED') {
            request.status = 'FETCHED'; // Mark as fetched
            await request.save();
            return res.json({ status: 'APPROVED', licenseKey: request.generatedLicenseKey });
        }
        res.json({ status: request.status });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch status." });
    }
});

// ==========================================
// 🔑 ROUTE: GENERATE LICENSE KEY
// ==========================================
app.post('/api/licenses/generate', authMiddleware, async (req, res) => {
    try {
        const { clientId, machineId, validMonths, modules, networkInfo, hostname } = req.body;

        if (!clientId || !machineId || !validMonths || !modules || !hostname) {
            return res.status(400).json({ error: "Missing required fields." });
        }
        
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ error: "Client not found." });
        }

        // 1. Calculate precise expiration date for MongoDB tracking
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + parseInt(validMonths));

        // 2. Build the Payload for the Local Hotel Server
        const payload = {
            client: client.name,
            machine_id: machineId,
            modules: modules
        };

        // 3. Cryptographically Sign the Key (Using RS256)
        const licenseKey = jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: `${validMonths * 30}d` // e.g., 365d
        });

        // 4. Save Record to MongoDB
        const newLicense = new License({
            client: clientId,
            hardwareId: machineId,
            modules,
            expiresAt,
            licenseKey,
            networkInfo,
            hostname
        });
        await newLicense.save();

        await logAudit('LICENSE_GENERATED', 'License', newLicense._id, req.user.username, `Generated manual license for machine: ${machineId}`);

        res.status(201).json({
            message: "License generated successfully",
            licenseKey,
            expiresAt
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error during key generation." });
    }
});

// ==========================================
// 📥 ROUTE: GET PENDING ACTIVATION REQUESTS
// ==========================================
app.get('/api/activation-requests', authMiddleware, async (req, res) => {
    try {
        const requests = await ActivationRequest.find({ status: 'PENDING' });
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch activation requests" });
    }
});

// ==========================================
// 📊 ROUTE: ANALYTICS DASHBOARD
// ==========================================
app.get('/api/analytics', authMiddleware, async (req, res) => {
    try {
        const totalClients = await Client.countDocuments();
        const pendingRequests = await ActivationRequest.countDocuments({ status: 'PENDING' });
        
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        const licenses = await License.find();
        
        let activeLicenses = 0;
        let revokedLicenses = 0;
        let expiringSoon = 0;

        licenses.forEach(lic => {
            if (lic.status === 'REVOKED') {
                revokedLicenses++;
            } else if (lic.expiresAt < now) {
                // Technically expired
            } else if (lic.status === 'ACTIVE') {
                activeLicenses++;
                if (lic.expiresAt < thirtyDaysFromNow) {
                    expiringSoon++;
                }
            }
        });

        res.json({
            totalClients,
            pendingRequests,
            activeLicenses,
            revokedLicenses,
            expiringSoon
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
});

// ==========================================
// 📋 ROUTE: GET ALL LICENSES
// ==========================================
app.get('/api/licenses', authMiddleware, async (req, res) => {
    try {
        const licenses = await License.find().populate('client').sort({ createdAt: -1 });
        res.json(licenses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch licenses" });
    }
});

// ==========================================
// 🚫 ROUTE: REVOKE LICENSE (KILL SWITCH)
// ==========================================
app.put('/api/licenses/:id/revoke', authMiddleware, async (req, res) => {
    try {
        const license = await License.findById(req.params.id);
        if (!license) return res.status(404).json({ error: "License not found" });

        await License.updateOne({ _id: license._id }, { $set: { status: 'REVOKED' } });

        await logAudit('LICENSE_REVOKED', 'License', license._id, req.user?.username || 'System Admin', `Revoked license for hardware ID: ${license.hardwareId || 'Unknown'}`);

        license.status = 'REVOKED';
        res.json({ message: "License revoked successfully.", license });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to revoke license" });
    }
});

// ==========================================
// 🛡️ ROUTE: VALIDATE LICENSE (PUBLIC FOR CLIENTS)
// ==========================================
app.get('/api/licenses/validate/:hardwareId', async (req, res) => {
    try {
        const { hardwareId } = req.params;
        // Find the most recent license for this machine
        const license = await License.findOne({ hardwareId }).sort({ createdAt: -1 });
        
        if (!license) {
            return res.json({ valid: false, reason: "NO_LICENSE_FOUND" });
        }

        if (license.status === 'REVOKED') {
            return res.json({ valid: false, reason: "LICENSE_REVOKED" });
        }

        const now = new Date();
        if (license.expiresAt < now || license.status === 'EXPIRED') {
            return res.json({ valid: false, reason: "LICENSE_EXPIRED" });
        }

        // It is active
        res.json({ valid: true, status: "ACTIVE" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to validate license" });
    }
});

app.get('/health',(req,res)=>{
    res.status(200).json({ message: "OK" });
})

// ==========================================
// 📜 ROUTE: AUDIT LOGS
// ==========================================
app.get('/api/audit-logs', authMiddleware, async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch audit logs." });
    }
});

// ==========================================
// 🌐 SERVE FRONTEND (For Hostinger / Production)
// ==========================================
const path = require('path');

// Resolve the path to the frontend directory
let distPath = path.resolve(__dirname, '..', 'frontend', 'dist');

// Safety check
if (fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'))) {
    console.log("-----------------------------------------");
    console.log("Serving Frontend Build from:", distPath);
    console.log("-----------------------------------------");
    
    // Serve the static files from the frontend directory
    app.use(express.static(distPath));

    // Catch-all route for React Router (only if it's not an API route)
    app.get(/.*/, (req, res, next) => {
        if (req.path.startsWith('/api/')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    console.log("⚠️ Frontend build not found at:", distPath);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Control System Backend running on port ${PORT}`));
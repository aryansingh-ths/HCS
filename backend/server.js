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
// 🏢 ROUTE: CLIENT MANAGEMENT
// ==========================================
app.post('/api/clients', async (req, res) => {
    try {
        const { name, propertyName, contact, email, status } = req.body;
        
        // Generate unique IDs
        const clientId = 'CLT-' + require('crypto').randomBytes(3).toString('hex').toUpperCase();
        const propertyId = 'PRP-' + require('crypto').randomBytes(3).toString('hex').toUpperCase();

        const newClient = new Client({ clientId, propertyId, name, propertyName, contact, email, status });
        await newClient.save();
        res.status(201).json(newClient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create client." });
    }
});

app.get('/api/clients', async (req, res) => {
    try {
        const clients = await Client.find().sort({ createdAt: -1 });
        res.json(clients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch clients." });
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

app.post('/api/activation-requests/:id/approve', async (req, res) => {
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
app.post('/api/licenses/generate', async (req, res) => {
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
app.get('/api/activation-requests', async (req, res) => {
    try {
        const requests = await ActivationRequest.find({ status: 'PENDING' });
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch activation requests" });
    }
});

// ==========================================
// 📋 ROUTE: GET ALL LICENSES
// ==========================================
app.get('/api/licenses', async (req, res) => {
    try {
        const licenses = await License.find().populate('client').sort({ createdAt: -1 });
        res.json(licenses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch licenses" });
    }
});

app.get('/health',(req,res)=>{
    res.status(200).json({ message: "OK" });
})

// ==========================================
// 🌐 SERVE FRONTEND (For Hostinger / Production)
// ==========================================
const path = require('path');

// Resolve the path to the frontend directory
let distPath = path.resolve(__dirname, '..', 'frontend');

// Safety check
if (fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'))) {
    console.log("-----------------------------------------");
    console.log("Serving Frontend Build from:", distPath);
    console.log("-----------------------------------------");
    
    // Serve the static files from the frontend directory
    app.use(express.static(distPath));

    // Catch-all route for React Router (only if it's not an API route)
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    console.log("⚠️ Frontend build not found at:", distPath);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Control System Backend running on port ${PORT}`));
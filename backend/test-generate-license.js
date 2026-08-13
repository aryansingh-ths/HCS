const http = require('http');

const data = JSON.stringify({
    clientName: "Grand Plaza Hotel",
    machineId: "HW-MAC-001A-B2",
    validMonths: 12,
    modules: ["FRONT_DESK", "HOUSEKEEPING", "SALES"],
    hostname: "Reception-PC-1",
    networkInfo: {
        publicIp: "203.0.113.45",
        localIp: "192.168.1.10",
        city: "New York",
        country: "USA"
    }
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/licenses/generate',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

console.log("🚀 Sending POST request to http://localhost:5000/api/licenses/generate...");
console.log("📦 Payload:");
console.log(JSON.stringify(JSON.parse(data), null, 2));
console.log("\nWaiting for response...\n");

const req = http.request(options, (res) => {
    let responseBody = '';

    console.log(`✅ STATUS: ${res.statusCode}`);

    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log('\n--- RESPONSE BODY ---');
        try {
            const json = JSON.parse(responseBody);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.log(responseBody);
        }
        console.log('---------------------\n');
    });
});

req.on('error', (e) => {
    console.error(`❌ Problem with request: ${e.message}`);
    console.error(`💡 Make sure your backend server is currently running (e.g. 'node server.js' or 'npm run dev').`);
});

// Write data to request body
req.write(data);
req.end();

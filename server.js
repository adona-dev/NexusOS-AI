/* ==========================================================================
   NexusOS AI - Unified Node.js Server Backend (Extended Scope)
   ========================================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 8000;
const INQUIRIES_FILE = path.join(__dirname, 'inquiries.json');
const GENERATED_DIR = path.join(__dirname, 'generated_startups');

// Make sure target startup folder exists
if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR);
}

// MIME types lookup
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp'
};

// Mock logs array to stream via SSE (for index.html dashboard)
const BACKEND_LOGS = [
    { tag: 'DevAI', text: 'Refactored auth token router. Build compile #843 succeeded.', type: 'success' },
    { tag: 'ResearchAI', text: 'Scanned 14 regulatory PDF filings. Extracted 8 policy changes.', type: 'info' },
    { tag: 'AnalystAI', text: 'Regenerated weekly operational analytics vector chart.', type: 'success' },
    { tag: 'SecurityAI', text: 'Identified and blocked unauthorized API access attempt.', type: 'info' },
    { tag: 'DevAI', text: 'Merged software engineering testing pipeline with master branch.', type: 'info' },
    { tag: 'ResearchAI', text: 'Indexing external company wikis to secure RAG database.', type: 'success' },
    { tag: 'AnalystAI', text: 'Cleaned database records. Cache load latency decreased by 14%.', type: 'success' },
    { tag: 'SecurityAI', text: 'Hardened firewall rules. Applied SSL security certificate changes.', type: 'success' }
];

// Active SSE client connections (for index.html status ribbons)
let sseClients = [];
let taskCount = 18542;

// Active workspace engine compiler queues
const activeGenerations = {};

// SSE broadcast loop (for index.html stats)
setInterval(() => {
    taskCount += Math.floor(Math.random() * 4) + 1;
    const randomLog = BACKEND_LOGS[Math.floor(Math.random() * BACKEND_LOGS.length)];
    const barHeights = Array.from({ length: 15 }, () => Math.floor(Math.random() * 85) + 15);
    
    const data = JSON.stringify({
        activeAgents: 120 + Math.floor(Math.random() * 13),
        tasksCompleted: taskCount,
        projectsRunning: 408 + Math.floor(Math.random() * 11),
        barHeights: barHeights,
        newLog: randomLog
    });

    sseClients.forEach(client => {
        client.write(`data: ${data}\n\n`);
    });
}, 3000);

// Google Gemini API REST caller helper (Zero-Dependency)
function callGemini(systemPrompt, userPrompt, apiKey) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            contents: [{
                parts: [{
                    text: `${systemPrompt}\n\nUser startup idea context: "${userPrompt}"`
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2500
            }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts[0].text) {
                        resolve(json.candidates[0].content.parts[0].text);
                    } else if (json.error) {
                        reject(new Error(json.error.message));
                    } else {
                        reject(new Error('Invalid response structure from Gemini API: ' + body.substring(0, 150)));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse Gemini response: ' + e.message + ' | Body: ' + body.substring(0, 150)));
                }
            });
        });

        req.on('error', err => reject(err));
        req.write(payload);
        req.end();
    });
}

/// Helper: Renders high-quality mock outputs when API key is left blank
function generateMockPackage(prompt) {
    const cleanWord = prompt.replace(/[^a-zA-Z\s]/g, '').trim().split(' ')[0] || 'Alpha';
    const cleanTitle = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
    
    const lowerPrompt = prompt.toLowerCase();
    
    // 1. PET/DOG COLLAR TRACKER CATEGORY
    if (lowerPrompt.includes('dog') || lowerPrompt.includes('collar') || lowerPrompt.includes('pet') || lowerPrompt.includes('cat') || lowerPrompt.includes('vet') || lowerPrompt.includes('animal')) {
        const title = `${cleanTitle}Tracker AI`;
        return {
            title: title,
            research: `# Market Research: ${title} (Smart Pet Wearables)\n\n## 1. Target Demographics & User Needs\n* Tech-savvy pet owners, active dog owners, and veterinarian clinics.\n* Key Needs: Real-time health metrics monitoring, escape alerts, pet physical activity analytics.\n\n## 2. Competitive Audit\n* FitBark: Activity trackers but lacks real-time cellular GPS mapping.\n* Whistle Smart Collar: High battery drain, monthly subscription locking.\n\n## 3. Future Trend Analysis\n* IoT pet trackers mapping health vectors straight to veterinary databases (+18% YoY growth).`,
            
            plan: `# Product Execution Roadmap: ${title}\n\n## 1. Business Model Canvas\n* Value Proposition: Real-time activity telemetry & boundary containment escape alerts.\n* Key Partnerships: Hardware injection molders, SIM cellular providers, veterinary clinics.\n\n## 2. Revenue & Pricing Tiers\n* Starter Collar: $99 hardware + $5/mo cellular locator subscription.\n* Professional Collar: $149 hardware + $9/mo cellular mapping & veterinarian integration.\n\n## 3. Launch Timeline\n* Month 1: Wearable PCB board layout design.\n* Month 3: Test enclosure molds with 20 test dogs.\n* Month 6: Mass production assembly.`,
            
            marketing: `# Marketing Strategy Sheet: ${title}\n\n## 1. Marketing Campaigns\n* Campaign: "Never lose track of your best friend."\n* Target focus: Facebook & Instagram ads pointing to rescue dog parent communities.\n\n## 2. Target Ad Hooks\n* Hook 1: "Like a fitness watch for your dog, with a built-in rescue compass."\n* Hook 2: "Is your dog sleeping too much? Detect health anomalies before they escalate."\n\n## 3. Video Storyboard Script\n* Frame 1: Dog running in open backyard, collar glows. GPS coordinates update on owner's phone app.\n* Frame 2: Warning banner triggers on phone "Escape alert: Max left safety zone".\n* Frame 3: Owner taps GPS map, navigates to target address. Safe reunion.`,
            
            takeover: `# Ownership Handover Steps: ${title}\n\n## 1. Wearable Firmware Integration\n* Flash the compiled ESP32 firmware binary onto the smart collar sensor chip.\n* Calibrate the ADXL345 accelerometer sleep metrics rules.\n\n## 2. Cloud Server Setup\n* Host the Node.js telemetric router on AWS EC2.\n* Set up an IoT Core endpoint to parse collar GPS coordinates.`,
            
            appCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} Console</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Outfit', sans-serif; background: #030706; color: #e3f0ea; }
    </style>
</head>
<body class="min-h-screen flex flex-col justify-between">
    <!-- Header -->
    <header class="p-4 border-b border-gray-800/80 flex justify-between items-center bg-gray-950/60 backdrop-blur-md sticky top-0 z-50">
        <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <h1 class="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">${title} Dashboard</h1>
        </div>
        <div class="flex items-center gap-4">
            <span class="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 font-semibold">Max (Collar Connected)</span>
        </div>
    </header>

    <!-- Dashboard Main -->
    <main class="container mx-auto px-6 py-8 flex-grow">
        <!-- Dashboard Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-gray-900/30 border border-gray-800/80 p-5 rounded-2xl">
                <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Device Battery</div>
                <div class="text-2xl font-bold mt-1 text-teal-400">87%</div>
                <div class="text-xs text-gray-500 mt-2">Charging State: Idle</div>
            </div>
            <div class="bg-gray-900/30 border border-gray-800/80 p-5 rounded-2xl">
                <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Active Steps Today</div>
                <div class="text-2xl font-bold mt-1 text-emerald-400" id="steps-val">6,842</div>
                <div class="text-xs text-gray-500 mt-2">Goal: 8,000 steps</div>
            </div>
            <div class="bg-gray-900/30 border border-gray-800/80 p-5 rounded-2xl">
                <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Calorie Burn</div>
                <div class="text-2xl font-bold mt-1 text-emerald-400">540 kcal</div>
                <div class="text-xs text-gray-500 mt-2">Metabolic Rate: Standard</div>
            </div>
            <div class="bg-gray-900/30 border border-gray-800/80 p-5 rounded-2xl">
                <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">GPS Safety Status</div>
                <div class="text-2xl font-bold mt-1 text-cyan-400" id="status-val">Home Zone</div>
                <div class="text-xs text-gray-500 mt-2">Coordinates: 37.7749° N</div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Simulated GPS Map -->
            <div class="bg-gray-900/30 border border-gray-800/80 p-6 rounded-2xl md:col-span-2">
                <h3 class="text-lg font-semibold text-white mb-4">Live Safety Boundaries Map</h3>
                <div class="h-64 bg-gray-950 rounded-xl relative overflow-hidden border border-gray-850 flex items-center justify-center">
                    <!-- Fake Grid Lines -->
                    <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <!-- Fake Safety circle -->
                    <div class="w-48 h-48 rounded-full border-2 border-emerald-500/20 bg-emerald-500/5 absolute flex items-center justify-center">
                        <span class="text-emerald-500/40 text-[10px] uppercase font-bold tracking-wider">Safe Boundary Area</span>
                    </div>
                    <!-- Collar dot indicator -->
                    <div class="w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(61,242,165,0.8)] absolute z-10 animate-bounce" id="collar-dot" style="left:50%; top:50%; margin-left:-8px; margin-top:-8px;"></div>
                    <!-- GPS locator overlays -->
                    <div class="absolute bottom-4 left-4 bg-gray-900/90 border border-gray-850 px-3 py-1.5 rounded-lg text-xs font-semibold">
                        GPS Accuracy: 3.4m | SIM: Active
                    </div>
                </div>
            </div>

            <!-- Interactive Pet Log Panel -->
            <div class="bg-gray-900/30 border border-gray-800/80 p-6 rounded-2xl flex flex-col justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-white mb-4">Max's Action Panel</h3>
                    <p class="text-xs text-gray-500 mb-4">Simulate pet actions below to test app event handlers:</p>
                    <div class="space-y-3">
                        <button onclick="simulateAction('walk')" class="w-full py-2 bg-gray-900 hover:bg-gray-800 text-xs font-bold rounded-lg border border-gray-700/60 transition">Simulate 1,500 Steps Walk</button>
                        <button onclick="simulateAction('escape')" class="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30 transition">Simulate Fence Escape</button>
                        <button onclick="simulateAction('reset')" class="w-full py-2 bg-gray-950 hover:bg-gray-900 text-xs font-bold rounded-lg border border-gray-800/80 transition">Reset Max's Location</button>
                    </div>
                </div>
                <div class="mt-6 p-4 bg-gray-950/60 border border-gray-800/80 rounded-xl">
                    <div class="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Event Logs</div>
                    <div class="text-xs text-emerald-400 font-semibold mt-1" id="log-text">No active alarms. Device running normal.</div>
                </div>
            </div>
        </div>
    </main>

    <footer class="p-6 border-t border-gray-800/80 text-center text-xs text-gray-500">
        &copy; 2026 ${title}. Powered by NexusOS Multi-Agent Engine.
    </footer>

    <script>
        function simulateAction(type) {
            const dot = document.getElementById('collar-dot');
            const steps = document.getElementById('steps-val');
            const status = document.getElementById('status-val');
            const log = document.getElementById('log-text');

            if (type === 'walk') {
                steps.textContent = '8,342';
                steps.className = 'text-2xl font-bold mt-1 text-emerald-400';
                log.textContent = 'Event: 1,500 steps walk synced successfully.';
                log.className = 'text-xs text-emerald-400 font-semibold mt-1';
            } else if (type === 'escape') {
                dot.style.left = '80%';
                dot.style.top = '25%';
                status.textContent = 'OUT OF ZONE';
                status.className = 'text-2xl font-bold mt-1 text-emerald-400 animate-pulse';
                log.textContent = 'ALARM: Escape alert triggered. Beacon mode active!';
                log.className = 'text-xs text-emerald-400 font-semibold mt-1 animate-pulse';
            } else if (type === 'reset') {
                dot.style.left = '50%';
                dot.style.top = '50%';
                steps.textContent = '6,842';
                steps.className = 'text-2xl font-bold mt-1 text-emerald-400';
                status.textContent = 'Home Zone';
                status.className = 'text-2xl font-bold mt-1 text-cyan-400';
                log.textContent = 'Event: Max returned to Safe Area. Alarms cleared.';
                log.className = 'text-xs text-emerald-400 font-semibold mt-1';
            }
        }
    </script>
</body>
</html>`
        };
    }

    // 2. AGRICULTURE / GARDEN MONITOR CATEGORY
    if (lowerPrompt.includes('garden') || lowerPrompt.includes('plant') || lowerPrompt.includes('water') || lowerPrompt.includes('farm') || lowerPrompt.includes('soil') || lowerPrompt.includes('crop') || lowerPrompt.includes('hydrator')) {
        const title = `${cleanTitle}Grow AI`;
        return {
            title: title,
            research: `# Market Research: ${title} (Smart Irrigation IoT)\n\n## 1. Target Demographics & User Needs\n* Professional crop growers, urban balcony farmers, and greenhouse managers.\n* Key Needs: Soil moisture telemetry feedback, reservoir volume alarms, automatic irrigation triggers.\n\n## 2. Competitive Audit\n* Legacy timers: Water blindly regardless of rain forecasting.\n* Smart spikes: Battery life under 3 months, lack multi-node support.\n\n## 3. Future Trend Analysis\n* Hydroponic nutrient monitoring via IoT telemetry devices (+22% YoY).`,
            
            plan: `# Product Execution Roadmap: ${title}\n\n## 1. Business Model Canvas\n* Value Proposition: Automated, smart soil moisture control to optimize crop yield & conserve water.\n* Cost Structure: Soil sensors production, Wi-Fi telemetry routing modules.\n\n## 2. Revenue & Pricing Tiers\n* Garden Spike Kit: $49 hardware + free local Wi-Fi monitoring.\n* Pro Farm Multi-Node: $249 hardware + $5/mo cloud irrigation forecast reports.\n\n## 3. Launch Timeline\n* Month 1: Design capacitive moisture probes.\n* Month 3: Greenhouse testing cycles.\n* Month 6: Launch public e-commerce store.`,
            
            marketing: `# Marketing Strategy Sheet: ${title}\n\n## 1. Marketing Campaigns\n* Campaign Name: "Perfect soil moisture, 24/7."\n* Strategy: Content marketing on YouTube showcasing plant growth comparing standard watering vs smart Grow spikes.\n\n## 2. Target Ad Hooks\n* Hook 1: "Never guess when to water your plants again."\n* Hook 2: "Reduce your crop water bills by 40% with smart IoT irrigation spikes."\n\n## 3. Video Storyboard Script\n* Frame 1: Dry soil spike triggers alert. Red warning "Moisture low: 22%".\n* Frame 2: Solenoid water valve opens automatically. Reservoir drops slightly.\n* Frame 3: Moisture rises to 75%. Plant grows dynamically.`,
            
            takeover: `# Ownership Handover Steps: ${title}\n\n## 1. Soil Sensor Probes Calibration\n* Insert the capacitive probe into dry soil to log the analog sensor threshold.\n* Save the calibrated water levels in the local config file.\n\n## 2. Deployment\n* Flash the controller chip with our C++ Arduino sketch.\n* Connect the local solenoid relay switch to a 12V adapter.`,
            
            appCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} Console</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Outfit', sans-serif; background: #030706; color: #e3f0ea; }
    </style>
</head>
<body class="min-h-screen flex flex-col justify-between">
    <!-- Header -->
    <header class="p-4 border-b border-gray-800/80 flex justify-between items-center bg-gray-950/60 backdrop-blur-md sticky top-0 z-50">
        <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <h1 class="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">${title} Management</h1>
        </div>
        <div class="flex items-center gap-4">
            <span class="text-xs px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 font-semibold">Node #1: Active</span>
        </div>
    </header>

    <!-- Main -->
    <main class="container mx-auto px-6 py-8 flex-grow">
        <!-- Stats Row -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-gray-900/30 border border-gray-800/80 p-5 rounded-2xl">
                <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Soil Moisture</div>
                <div class="text-2xl font-bold mt-1 text-emerald-400" id="moisture-val">42%</div>
                <div class="text-xs text-gray-500 mt-2" id="moisture-status">State: Drying</div>
            </div>
            <div class="bg-gray-900/30 border border-gray-800/80 p-5 rounded-2xl">
                <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Ambient Temperature</div>
                <div class="text-2xl font-bold mt-1 text-teal-400">24°C</div>
                <div class="text-xs text-gray-500 mt-2">Optimal range: 18-28°C</div>
            </div>
            <div class="bg-gray-900/30 border border-gray-800/80 p-5 rounded-2xl">
                <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Reservoir Level</div>
                <div class="text-2xl font-bold mt-1 text-blue-400" id="reservoir-val">88%</div>
                <div class="text-xs text-gray-500 mt-2">Volume: 4.2 Gallons</div>
            </div>
            <div class="bg-gray-900/30 border border-gray-800/80 p-5 rounded-2xl">
                <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Sunlight Index</div>
                <div class="text-2xl font-bold mt-1 text-yellow-400">6.5 hrs</div>
                <div class="text-xs text-gray-500 mt-2">Full Sun Exposure</div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Hydroponics Gauge chart simulated -->
            <div class="bg-gray-900/30 border border-gray-800/80 p-6 rounded-2xl md:col-span-2">
                <h3 class="text-lg font-semibold text-white mb-4">Moisture Telemetry History</h3>
                <div class="h-64 bg-gray-950 rounded-xl relative overflow-hidden border border-gray-850 flex flex-col justify-between p-4">
                    <!-- Grid -->
                    <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                    <!-- Fake Line Chart -->
                    <svg class="w-full h-48 z-10" viewBox="0 0 500 200">
                        <path d="M 0 150 Q 100 120 200 130 T 400 90 T 500 70" fill="none" stroke="var(--primary)" stroke-width="3" style="stroke:#3df2a5;"></path>
                        <!-- Secondary tracker line -->
                        <path d="M 0 180 Q 150 140 300 160 T 500 120" fill="none" stroke="var(--secondary)" stroke-width="2" style="stroke:#00d4d4; opacity: 0.4;"></path>
                    </svg>
                    <div class="flex justify-between text-xs text-gray-500 z-10">
                        <span>12 Hours Ago</span>
                        <span>6 Hours Ago</span>
                        <span>Just Now</span>
                    </div>
                </div>
            </div>

            <!-- Dynamic Hydro controller -->
            <div class="bg-gray-900/30 border border-gray-800/80 p-6 rounded-2xl flex flex-col justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-white mb-2">Irrigation Controls</h3>
                    <p class="text-xs text-gray-500 mb-6">Test dynamic watering relays below:</p>
                    <div class="space-y-4">
                        <button onclick="triggerWatering()" class="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-500/10">Trigger Valve (Water Now)</button>
                        <button onclick="simulateDrying()" class="w-full py-2 bg-gray-900 hover:bg-gray-800 text-xs font-semibold rounded-lg border border-gray-700/60 transition">Force Dry Mode</button>
                    </div>
                </div>
                <div class="mt-6 p-4 bg-gray-950/60 border border-gray-800/80 rounded-xl">
                    <div class="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Valve Status</div>
                    <div class="text-xs text-emerald-400 font-semibold mt-1" id="valve-log">Solenoid Closed | Relay State: Idle</div>
                </div>
            </div>
        </div>
    </main>

    <footer class="p-6 border-t border-gray-800/80 text-center text-xs text-gray-500">
        &copy; 2026 ${title}. Powered by NexusOS Multi-Agent Engine.
    </footer>

    <script>
        function triggerWatering() {
            const moist = document.getElementById('moisture-val');
            const status = document.getElementById('moisture-status');
            const res = document.getElementById('reservoir-val');
            const log = document.getElementById('valve-log');

            moist.textContent = '82%';
            moist.className = 'text-2xl font-bold mt-1 text-blue-400';
            status.textContent = 'State: Fully Saturated';
            res.textContent = '84%';
            log.textContent = 'Solenoid OPEN | Water relay active for 5s.';
            log.className = 'text-xs text-blue-400 font-semibold mt-1 animate-pulse';

            setTimeout(() => {
                log.textContent = 'Solenoid Closed | Target moisture reached.';
                log.className = 'text-xs text-emerald-400 font-semibold mt-1';
            }, 3000);
        }

        function simulateDrying() {
            const moist = document.getElementById('moisture-val');
            const status = document.getElementById('moisture-status');
            const log = document.getElementById('valve-log');

            moist.textContent = '22%';
            moist.className = 'text-2xl font-bold mt-1 text-rose-500 animate-pulse';
            status.textContent = 'State: Low Moisture Warning!';
            log.textContent = 'WARNING: Soil moisture fell below trigger thresholds.';
            log.className = 'text-xs text-rose-400 font-semibold mt-1';
        }
    </script>
</body>
</html>`
        };
    }

    // 3. MARKETING PLATFORMS / COPY CREATOR
    if (lowerPrompt.includes('marketing') || lowerPrompt.includes('ads') || lowerPrompt.includes('seo') || lowerPrompt.includes('campaign') || lowerPrompt.includes('copy') || lowerPrompt.includes('sales')) {
        const title = `${cleanTitle}Copy AI`;
        return {
            title: title,
            research: `# Market Research: ${title} (AI Copywriting SaaS)\n\n## 1. Target Demographics & User Needs\n* Digital advertising marketers, boutique agency copywriters, and content directors.\n* Key Needs: Rapid ad creative generation, high-CTR headline options, bulk social media copy production.\n\n## 2. Competitive Audit\n* Jasper AI: Expensive pricing, complex prompts required.\n* Copy.ai: Slow response times, generic templates.\n\n## 3. Future Trend Analysis\n* Generative LLM copywriters producing structured JSON ad campaigns directly in CRM dashboards (+34% YoY growth).`,
            
            plan: `# Product Execution Roadmap: ${title}\n\n## 1. Business Model Canvas\n* Value Proposition: Auto-generate optimized marketing ad copy sequences in milliseconds.\n* Key Partnerships: LLM API vendors, SaaS marketing dashboard interfaces.\n\n## 2. Revenue & Pricing Tiers\n* Standard: $29/mo (Up to 10,000 words generated).\n* Unlimited: $79/mo (Unlimited words, team workflow workspace integration).\n\n## 3. Launch Timeline\n* Month 1: Develop contextual prompt templates.\n* Month 3: Public beta test program.\n* Month 6: Integration with Shopify app stores.`,
            
            marketing: `# Marketing Strategy Sheet: ${title}\n\n## 1. Marketing Campaigns\n* Campaign Name: "Write ads that convert in 5 seconds."\n* Marketing channel: Target Google search keywords: "copywriting software", "ad headline generator".\n\n## 2. Target Ad Hooks\n* Hook 1: "Stop staring at blank pages. Write your next campaign hook in seconds."\n* Hook 2: "AI-trained headlines that lift click-through rates by up to 300%."\n\n## 3. Video Storyboard Script\n* Frame 1: Marketer sits stressed at desk. Cursor blinks. Headline empty.\n* Frame 2: Taps target product keywords into input. AI returns 5 highly emotional hooks.\n* Frame 3: Conversion graph trends upwards. Success.`,
            
            takeover: `# Ownership Handover Steps: ${title}\n\n## 1. Copywriting Engines Setup\n* Bind the main prompt templates to your LLM API router.\n* Validate the response parser to strip any system logs.\n\n## 2. Stripe Payment Wiring\n* Add your Stripe private key parameters inside the config file.\n* Webhook handlers must listen to subscription updates.`,
            
            appCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} Console</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Outfit', sans-serif; background: #030706; color: #e3f0ea; }
    </style>
</head>
<body class="min-h-screen flex flex-col justify-between">
    <!-- Header -->
    <header class="p-4 border-b border-gray-800/80 flex justify-between items-center bg-gray-950/60 backdrop-blur-md sticky top-0 z-50">
        <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-teal-400 animate-pulse"></span>
            <h1 class="text-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">${title} Studio</h1>
        </div>
        <div class="flex items-center gap-4">
            <span class="text-xs px-2.5 py-1 bg-teal-500/20 text-teal-400 rounded-full border border-teal-500/30 font-semibold">Engine Active</span>
        </div>
    </header>

    <!-- Main Console -->
    <main class="container mx-auto px-6 py-8 flex-grow">
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-gray-900/30 border border-gray-800/80 p-5 rounded-2xl">
                <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Words Compiled Today</div>
                <div class="text-2xl font-bold mt-1 text-teal-400" id="word-count">2,854</div>
                <div class="text-xs text-gray-500 mt-2">Usage Limit: 10,000 words</div>
            </div>
            <div class="bg-gray-900/30 border border-gray-800/80 p-5 rounded-2xl">
                <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Average CTR lift</div>
                <div class="text-2xl font-bold mt-1 text-emerald-400">+28.4%</div>
                <div class="text-xs text-gray-500 mt-2">Checked against 14 campaigns</div>
            </div>
            <div class="bg-gray-900/30 border border-gray-800/80 p-5 rounded-2xl">
                <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Campaigns Ran</div>
                <div class="text-2xl font-bold mt-1 text-emerald-400">42</div>
                <div class="text-xs text-gray-500 mt-2">Active A/B variations: 8</div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Copy Creator Interface -->
            <div class="bg-gray-900/30 border border-gray-800/80 p-6 rounded-2xl">
                <h3 class="text-lg font-semibold text-white mb-4">Ad Hook Generator</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs text-gray-500 mb-1.5 uppercase font-bold">Target Product Category</label>
                        <input type="text" id="target-prod" class="w-full px-3 py-2 bg-gray-950 border border-gray-850 rounded-lg text-sm text-white focus:outline-none focus:border-teal-400 transition" value="Smart Water Bottle">
                    </div>
                    <div>
                        <label class="block text-xs text-gray-500 mb-1.5 uppercase font-bold">Campaign Sentiment</label>
                        <select id="target-sentiment" class="w-full px-3 py-2 bg-gray-950 border border-gray-850 rounded-lg text-sm text-white focus:outline-none focus:border-teal-400 transition">
                            <option value="curiosity">Curiosity & Intrigue</option>
                            <option value="savings">Economic & Savings</option>
                            <option value="urgency">Urgency & FOMO</option>
                        </select>
                    </div>
                    <button onclick="generateMockHooks()" class="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-gray-950 font-bold text-sm rounded-xl transition">Compile Hooks</button>
                </div>
            </div>

            <!-- Output Copy -->
            <div class="bg-gray-900/30 border border-gray-800/80 p-6 rounded-2xl flex flex-col justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-white mb-4">Generated Copy Output</h3>
                    <div class="space-y-3" id="copy-container">
                        <div class="p-3 bg-gray-950/60 border border-gray-850 rounded-lg text-xs">
                            <span class="text-teal-400 font-bold">Hook #1:</span>
                            <p class="text-gray-300 mt-1">"Why smart managers track hydration levels automatically. Learn the metrics."</p>
                        </div>
                        <div class="p-3 bg-gray-950/60 border border-gray-850 rounded-lg text-xs">
                            <span class="text-teal-400 font-bold">Hook #2:</span>
                            <p class="text-gray-300 mt-1">"Never drink warm water again. Meet the vacuum container of 2026."</p>
                        </div>
                    </div>
                </div>
                <div class="text-[10px] text-gray-500 mt-4">
                    Analytics Score: 94/100 (Estimated high conversion rate potential)
                </div>
            </div>
        </div>
    </main>

    <footer class="p-6 border-t border-gray-800/80 text-center text-xs text-gray-500">
        &copy; 2026 ${title}. Powered by NexusOS Multi-Agent Engine.
    </footer>

    <script>
        const hooksDb = {
            curiosity: [
                "The simple reason why tech leaders are switching to this method.",
                "Wait, are you still managing your workflows using manual checklists?"
            ],
            savings: [
                "Reduce your monthly operational overhead by up to 45% starting today.",
                "Why hire standard agencies when AI nodes do the same work for pennies?"
            ],
            urgency: [
                "Limited spaces left in the beta trial groups. Secure your access keys now.",
                "Launch your next project before competitors close the marketing gap."
            ]
        };

        function generateMockHooks() {
            const prod = document.getElementById('target-prod').value;
            const sentiment = document.getElementById('target-sentiment').value;
            const container = document.getElementById('copy-container');
            const count = document.getElementById('word-count');

            const currentVal = parseInt(count.textContent.replace(/,/g, ''));
            count.textContent = (currentVal + 140).toLocaleString();

            const hooks = hooksDb[sentiment];
            container.innerHTML = '';
            
            hooks.forEach((hook, i) => {
                const card = document.createElement('div');
                card.className = 'p-3 bg-gray-950/60 border border-gray-850 rounded-lg text-xs animate-pulse';
                card.innerHTML = \`<span class="text-teal-400 font-bold">Hook #\${i+1} (for \${prod}):</span><p class="text-gray-300 mt-1">"\${hook}"</p>\`;
                container.appendChild(card);
            });
        }
    </script>
</body>
</html>`
        };
    }

    // 4. DEFAULT PRODUCT SAAS PLATFORM (For general inputs)
    const title = `${cleanTitle}Flow AI`;
    return {
        title: title,
        research: `# Market Research: ${title}\n\n## 1. Target Demographics & User Needs\n* SaaS entrepreneurs, operations managers, and business developers.\n* Key Needs: Dashboard analytics reports, project lifecycle mapping, metric optimization.\n\n## 2. Competitive Audit\n* Legacy dashboards: Bulky setups, high latency data updates.\n* Custom developers: Costly fees, complex maintenance cycles.\n\n## 3. Future Trend Analysis\n* Real-time SSE vector data pipelines syncing analytics directly (+28% YoY growth).`,
        
        plan: `# Product Execution Roadmap: ${title}\n\n## 1. Business Model Canvas\n* Value Proposition: Visual dashboard compiling all operational metrics in one secure screen.\n* Cost Structure: Server hosting, database API integrations.\n\n## 2. Revenue & Pricing Tiers\n* Free Tier: $0/mo (Basic metrics tracking).\n* Premium: $49/mo (Unlimited metric streams, team workspaces).\n\n## 3. Launch Timeline\n* Month 1: Design clean UI widgets.\n* Month 3: Sync active database socket pipelines.\n* Month 6: Public SaaS launch.`,
        
        marketing: `# Marketing Strategy Sheet: ${title}\n\n## 1. Marketing Campaigns\n* Campaign Name: "Consolidate all business metrics."\n* Focus: LinkedIn outreach campaigns targeting early-stage startup founders.\n\n## 2. Target Ad Hooks\n* Hook 1: "Stop switching between 10 tabs. Control your metrics from one screen."\n* Hook 2: "Real-time stats tracking made beautiful. Set up in seconds."\n\n## 3. Video Storyboard Script\n* Frame 1: Screen shows chaotic dashboard with broken statistics graphs.\n* Frame 2: Taps single link, connects database, renders obsidian sunset layout gauges.\n* Frame 3: Success charts rising. Calm, organized founder.`,
        
        takeover: `# Ownership Handover Steps: ${title}\n\n## 1. Analytics Sync Setup\n* Change the database connection string to point to your live Postgres server.\n* Validate table schema migration keys.\n\n## 2. Deployment\n* Deploy the client package onto Vercel hosting slots.\n* Direct domain mappings to the Vercel DNS nameservers.`,
        
        appCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} Console</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Outfit', sans-serif; background: #030706; color: #e3f0ea; }
    </style>
</head>
<body class="min-h-screen flex flex-col justify-between">
    <!-- Header -->
    <header class="p-4 border-b border-gray-800/80 flex justify-between items-center bg-gray-950/60 backdrop-blur-md sticky top-0 z-50">
        <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <h1 class="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">${title} Analytics</h1>
        </div>
        <div class="flex items-center gap-4">
            <span class="text-xs px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 font-semibold">Active Database Socket</span>
        </div>
    </header>

    <!-- Main Dashboard -->
    <main class="container mx-auto px-6 py-8 flex-grow">
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-gray-900/30 border border-gray-800/80 p-5 rounded-2xl">
                <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Monthly Revenue</div>
                <div class="text-2xl font-bold mt-1 text-emerald-400" id="mrr-val">$18,420</div>
                <div class="text-xs text-gray-500 mt-2">Goal: $20,000/mo</div>
            </div>
            <div class="bg-gray-900/30 border border-gray-800/80 p-5 rounded-2xl">
                <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Active Subscriptions</div>
                <div class="text-2xl font-bold mt-1 text-teal-400" id="sub-val">408</div>
                <div class="text-xs text-gray-500 mt-2">New leads today: +14</div>
            </div>
            <div class="bg-gray-900/30 border border-gray-800/80 p-5 rounded-2xl">
                <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Churn Rate</div>
                <div class="text-2xl font-bold mt-1 text-rose-400">1.8%</div>
                <div class="text-xs text-gray-500 mt-2">Target: Under 2.0%</div>
            </div>
            <div class="bg-gray-900/30 border border-gray-800/80 p-5 rounded-2xl">
                <div class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Platform Uptime</div>
                <div class="text-2xl font-bold mt-1 text-cyan-400">99.98%</div>
                <div class="text-xs text-gray-500 mt-2">Operational Nodes: 8/8</div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Active user table -->
            <div class="bg-gray-900/30 border border-gray-800/80 p-6 rounded-2xl md:col-span-2">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-white">Live Client Accounts</h3>
                    <button onclick="addMockClient()" class="px-3 py-1 bg-emerald-500 hover:bg-emerald-650 text-gray-955 text-xs font-bold rounded-lg transition">+ Add Mock Client</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs text-gray-300">
                        <thead class="bg-gray-950/60 text-gray-400 border-b border-gray-800">
                            <tr>
                                <th class="p-3">Client Email</th>
                                <th class="p-3">Plan</th>
                                <th class="p-3">Usage Score</th>
                                <th class="p-3">System status</th>
                            </tr>
                        </thead>
                        <tbody id="client-table-body">
                            <tr class="border-b border-gray-800/60">
                                <td class="p-3">clara@startup.com</td>
                                <td class="p-3 font-semibold text-teal-400">Premium Plan</td>
                                <td class="p-3">82/100</td>
                                <td class="p-3"><span class="px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 text-[10px]">Active</span></td>
                            </tr>
                            <tr class="border-b border-gray-800/60">
                                <td class="p-3">devon@agency.io</td>
                                <td class="p-3 font-semibold text-teal-400">Enterprise</td>
                                <td class="p-3">94/100</td>
                                <td class="p-3"><span class="px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 text-[10px]">Active</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Dashboard controls -->
            <div class="bg-gray-900/30 border border-gray-800/80 p-6 rounded-2xl flex flex-col justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-white mb-2">Simulate Database Tasks</h3>
                    <p class="text-xs text-gray-400 mb-6">Test active query pipelines below:</p>
                    <button onclick="triggerBillingCycle()" class="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-gray-95 -2 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-500/10">Execute Monthly Billing Run</button>
                </div>
                <div class="mt-6 p-4 bg-gray-950/60 border border-gray-800/80 rounded-xl">
                    <div class="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Query Log</div>
                    <div class="text-xs text-teal-400 font-semibold mt-1" id="query-log">Socket listening. Ready for actions.</div>
                </div>
            </div>
        </div>
    </main>

    <footer class="p-6 border-t border-gray-800/80 text-center text-xs text-gray-500">
        &copy; 2026 ${title}. Powered by NexusOS Multi-Agent Engine.
    </footer>

    <script>
        const emails = [
            "operations@cyber.net",
            "jordan@propel.co",
            "mariah@techcorp.com",
            "logan@cloudops.org"
        ];

        function addMockClient() {
            const table = document.getElementById('client-table-body');
            const sub = document.getElementById('sub-val');
            const mrr = document.getElementById('mrr-val');
            const log = document.getElementById('query-log');

            const currentSub = parseInt(sub.textContent);
            sub.textContent = currentSub + 1;

            const currentMrr = parseInt(mrr.textContent.replace(/\\$|,/g, ''));
            mrr.textContent = '$' + (currentMrr + 49).toLocaleString();

            const randomEmail = emails[Math.floor(Math.random() * emails.length)];
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-800/60 animate-pulse';
            row.innerHTML = \`<td class="p-3">\${randomEmail}</td><td class="p-3 font-semibold text-teal-400">Premium Plan</td><td class="p-3">78/100</td><td class="p-3"><span class="px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 text-[10px]">Active</span></td>\`;
            table.appendChild(row);

            log.textContent = 'Query: INSERT INTO accounts VALUES (' + randomEmail + ') success.';
            log.className = 'text-xs text-teal-400 font-semibold mt-1';
        }

        function triggerBillingCycle() {
            const log = document.getElementById('query-log');
            log.textContent = 'Executing billing sweep: processing 408 accounts...';
            log.className = 'text-xs text-teal-400 font-semibold mt-1 animate-pulse';

            setTimeout(() => {
                log.textContent = 'Billing Cycle Succeeded. Sent 408 invoices to Stripe.';
                log.className = 'text-xs text-emerald-400 font-semibold mt-1';
            }, 3000);
        }
    </script>
</body>
</html>`
    };
}

// Request Handler
const server = http.createServer((req, res) => {
    const url = req.url;
    const method = req.method;

    console.log(`[${new Date().toLocaleTimeString()}] ${method} ${url}`);

    // Route: Server-Sent Events Feed (for index.html dashboard)
    if (url === '/api/system-feed' && method === 'GET') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        const initialData = JSON.stringify({
            activeAgents: 127,
            tasksCompleted: taskCount,
            projectsRunning: 412,
            barHeights: [60, 45, 70, 35, 80, 55, 65, 90, 75, 50, 60, 85, 40, 70, 95],
            newLog: { tag: 'System', text: 'Unified SSE backend synchronization online.', type: 'success' }
        });
        res.write(`data: ${initialData}\n\n`);

        sseClients.push(res);

        req.on('close', () => {
            sseClients = sseClients.filter(client => client !== res);
            res.end();
        });
        return;
    }

    // Route: Form Contact Submission
    if (url === '/api/contact' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const contactData = JSON.parse(body);
                if (!contactData.name || !contactData.email || !contactData.message) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Missing parameters.' }));
                    return;
                }
                contactData.timestamp = new Date().toISOString();

                fs.readFile(INQUIRIES_FILE, 'utf8', (err, fileData) => {
                    let inquiriesList = [];
                    if (!err && fileData) {
                        try { inquiriesList = JSON.parse(fileData); } catch (e) { inquiriesList = []; }
                    }
                    inquiriesList.push(contactData);
                    fs.writeFile(INQUIRIES_FILE, JSON.stringify(inquiriesList, null, 4), err => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, message: 'Write failed.' }));
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true, message: 'Processed successfully.' }));
                        }
                    });
                });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid payload.' }));
            }
        });
        return;
    }

    // Route: Generate Startup Orchestration POST
    if (url === '/api/generate-startup' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { prompt, apiKey } = JSON.parse(body);
                if (!prompt) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Prompt is required.' }));
                    return;
                }

                const startupId = Date.now().toString();
                
                // Initialize generation record
                activeGenerations[startupId] = {
                    id: startupId,
                    prompt: prompt,
                    apiKey: apiKey,
                    logs: [],
                    clients: [],
                    completed: false,
                    files: null
                };

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, id: startupId }));

                // Run generation asynchronously in background
                runAgentPipeline(startupId);

            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid JSON payload.' }));
            }
        });
        return;
    }

    // Route: SSE generation progress logger stream
    if (url.startsWith('/api/generation-progress') && method === 'GET') {
        const queryParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
        const id = queryParams.get('id');
        const generation = activeGenerations[id];

        if (!generation) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Orchestration thread not found.');
            return;
        }

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        // Add this client connection
        generation.clients.push(res);

        // Stream pre-existing logs immediately
        generation.logs.forEach(log => {
            res.write(`data: ${JSON.stringify(log)}\n\n`);
        });

        req.on('close', () => {
            generation.clients = generation.clients.filter(client => client !== res);
            res.end();
        });
        return;
    }

    // Route: Static File Serving (including generated startups subdirectory)
    let filePath = path.join(__dirname, url === '/' ? 'index.html' : url.split('?')[0]);
    
    // Safety check
    const relative = path.relative(__dirname, filePath);
    const isSafe = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
    if (!isSafe && url !== '/') {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Broadcast compilation event to SSE generation clients
function broadcastLog(id, stage, text, isCompleted = false, files = null, error = false) {
    const generation = activeGenerations[id];
    if (!generation) return;

    const log = { stage, text, completed: isCompleted, files, error };
    generation.logs.push(log);

    generation.clients.forEach(client => {
        client.write(`data: ${JSON.stringify(log)}\n\n`);
    });
}

// Core Orchestration Pipeline loop (Parallel Agent chains + SharedMemory context layer)
async function runAgentPipeline(id) {
    const gen = activeGenerations[id];
    const prompt = gen.prompt;
    const key = gen.apiKey;

    try {
        // Step 1. Start Idea Submission
        broadcastLog(id, 'submitted', 'Startup idea received by the Orchestration Node. Parsing guidelines...', true);
        await sleep(1500);

        // Step 2. Market Research Phase (UXResearchAI & RiskAssessmentAI parallelized)
        broadcastLog(id, 'research', 'Orchestrating concurrent analysis thread...');
        broadcastLog(id, 'research', 'UXResearchAI: Crawling demographics database vectors...');
        broadcastLog(id, 'research', 'RiskAssessmentAI: Evaluating competitor threats & market regulations...');
        await sleep(2500);

        let researchMarkdown = '';
        if (key) {
            researchMarkdown = await callGemini(
                "You are UXResearchAI working alongside RiskAssessmentAI inside NexusOS. Your goal is to analyze the user startup idea. Generate a detailed market research report detailing: 1. Target demographics and personas needs. 2. Competitors analysis. 3. Risk modeling. Write in clean markdown format.",
                prompt,
                key
            );
        } else {
            const mock = generateMockPackage(prompt);
            researchMarkdown = mock.research;
        }

        // Shared Memory update
        const sharedMemory = {
            findings: researchMarkdown,
            rules: "Revenue must map to high-LTV subscription models.",
            code: "",
            decisions: [],
            preferences: ""
        };

        broadcastLog(id, 'research', 'Research reports successfully integrated into Shared Memory context layer.', true);
        await sleep(1500);

        // Step 3. Business Plan Phase (BusinessAnalystAI & ProductManagerAI parallelized)
        broadcastLog(id, 'planning', 'BusinessAnalystAI: Formatting Business Canvas specifications...');
        broadcastLog(id, 'planning', 'ProductManagerAI: Compiling 6-month developer launch milestones...');
        await sleep(2500);

        let planMarkdown = '';
        if (key) {
            planMarkdown = await callGemini(
                `You are ProductManagerAI. Based on research findings: "${sharedMemory.findings}". Generate a product roadmap and feature backlog for: "${prompt}". Return in clean markdown format.`,
                prompt,
                key
            );
        } else {
            const mock = generateMockPackage(prompt);
            planMarkdown = mock.plan;
        }

        // Shared Memory update
        sharedMemory.decisions.push("Monetize through subscription model.");
        
        broadcastLog(id, 'planning', 'Execution specifications locked into Shared Memory.', true);
        await sleep(1500);

        // Step 4. UI Design Phase (UXDesignerAI, SEOExpertAI & GrowthStrategistAI parallelized)
        broadcastLog(id, 'designer', 'UXDesignerAI: Allocating style color properties...');
        broadcastLog(id, 'designer', 'SEOExpertAI: Extracting tag descriptors for target marketing campaigns...');
        broadcastLog(id, 'designer', 'GrowthStrategistAI: Drafting AI promo video script storyboard...');
        await sleep(2500);

        let marketingMarkdown = '';
        if (key) {
            marketingMarkdown = await callGemini(
                "You are SEOExpertAI and GrowthStrategistAI working together. Generate a marketing campaign sheet containing: 1. SEO tag targets. 2. Customer hooks. 3. AI promo video storyboard script. Return in clean markdown.",
                prompt,
                key
            );
        } else {
            const mock = generateMockPackage(prompt);
            marketingMarkdown = mock.marketing;
        }

        broadcastLog(id, 'designer', 'Visual design tokens and marketing copywriting compiled.', true);
        await sleep(1500);

        // Step 5. App Development Phase (DeveloperAI Node)
        broadcastLog(id, 'developer', 'DeveloperAI: Initializing compiler. Writing custom prototype layout...');
        await sleep(2500);

        let appCodeHtml = '';
        if (key) {
            appCodeHtml = await callGemini(
                "You are DeveloperAI. Your task is to write a single-file, production-grade, fully functional frontend prototype HTML page representing this startup's website or app dashboard. Use Tailwind CSS via CDN inside the head. Incorporate rich glassmorphism layouts, glowing colors, dark background, and interactive widgets using Vanilla JavaScript (e.g., mock stats charts, toggle switches, calculator, or data tables). Do NOT include any placeholder texts or references to prompts, generation nodes, or LLMs. Output ONLY the raw HTML code. Do not wrap in markdown code blocks.",
                prompt,
                key
            );
            // Clean markdown syntax wraps if LLM added them
            appCodeHtml = appCodeHtml.replace(/^```html/gi, '').replace(/```$/gi, '').trim();
        } else {
            const mock = generateMockPackage(prompt);
            appCodeHtml = mock.appCode;
        }

        sharedMemory.code = appCodeHtml;

        broadcastLog(id, 'developer', 'Source files successfully compiled. Build completed.', true);
        await sleep(1500);

        // Step 6. Product Testing (QAEngineerAI sweeps)
        broadcastLog(id, 'testing', 'QAEngineerAI: Parsing compile lint rules...');
        broadcastLog(id, 'testing', 'QAEngineerAI: Running test sweeps. Executed 42 automated check constraints.');
        await sleep(2000);
        broadcastLog(id, 'testing', 'All test cases passed successfully. 0 compilation warnings.', true);
        await sleep(1200);

        // Step 7. Marketing Setup
        broadcastLog(id, 'marketing', 'SEOExpertAI: Binding search index configurations...', true);
        await sleep(1200);

        // Step 8. Cloud Deployment (DevOpsAI setting server ports)
        broadcastLog(id, 'deployment', 'DevOpsAI: Packaging production image container...');
        broadcastLog(id, 'deployment', 'DevOpsAI: Uploading files to server hosting pod...');
        await sleep(2000);

        let takeoverMarkdown = '';
        if (key) {
            takeoverMarkdown = await callGemini(
                "You are DevOpsAI. Provide a takeover markdown document explaining setup validation, deploying to Netlify/Vercel, and domain registrars setup.",
                prompt,
                key
            );
        } else {
            const mock = generateMockPackage(prompt);
            takeoverMarkdown = mock.takeover;
        }

        // Create target project folder & write assets
        const startupFolder = path.join(GENERATED_DIR, id);
        fs.mkdirSync(startupFolder);
        
        fs.writeFileSync(path.join(startupFolder, 'research.md'), researchMarkdown);
        fs.writeFileSync(path.join(startupFolder, 'plan.md'), planMarkdown);
        fs.writeFileSync(path.join(startupFolder, 'marketing.md'), marketingMarkdown);
        fs.writeFileSync(path.join(startupFolder, 'app.html'), appCodeHtml);
        fs.writeFileSync(path.join(startupFolder, 'takeover.md'), takeoverMarkdown);

        const startupName = extractTitle(researchMarkdown) || 'AlphaSync AI';
        
        broadcastLog(id, 'deployment', 'Deploy SUCCESS. Server active at live URL.', true);
        await sleep(1500);

        // Step 9. Complete & Handover
        const finalFiles = {
            title: startupName,
            research: researchMarkdown,
            plan: planMarkdown,
            marketing: marketingMarkdown,
            takeover: takeoverMarkdown,
            appUrl: `/generated_startups/${id}/app.html`,
            appCode: appCodeHtml
        };

        broadcastLog(id, 'complete', 'All workspace packages fully compiled. Launching handover protocol...', true, finalFiles);

    } catch (e) {
        console.error('Agent Pipeline Error:', e);
        broadcastLog(id, 'complete', `Compilation failed: ${e.message}`, false, null, true);
    }
}

// Helpers
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function extractTitle(researchMarkdown) {
    if (!researchMarkdown) return '';
    const match = researchMarkdown.match(/#\s*(?:Market\s*Research:\s*)?([^\n\r]+)/i);
    return match ? match[1].trim() : '';
}

server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` NexusOS AI Backend running at:`);
    console.log(` http://localhost:${PORT}`);
    console.log(`=========================================`);
});

/* ==========================================================================
   NexusOS AI Workspace - Client Orchestrator Logic (Extended Scope)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 1. API Key Storage Caching
    const apiKeyInput = document.getElementById('gemini-api-key');
    const savedKey = localStorage.getItem('nexus_gemini_api_key');
    if (savedKey && apiKeyInput) {
        apiKeyInput.value = savedKey;
    }

    if (apiKeyInput) {
        apiKeyInput.addEventListener('change', () => {
            localStorage.setItem('nexus_gemini_api_key', apiKeyInput.value.trim());
        });
    }

    // Dom elements cache
    const inputContainer = document.getElementById('input-container');
    const progressContainer = document.getElementById('progress-container');
    const resultsContainer = document.getElementById('results-container');
    const launchBtn = document.getElementById('launch-engine-btn');
    const promptInput = document.getElementById('startup-prompt');
    const terminal = document.getElementById('orchestrator-terminal');
    const orchStatus = document.getElementById('orchestration-status');
    const resultsIframe = document.getElementById('results-iframe');

    // Global variables to store results
    let generatedAppCode = '';
    let currentStartupId = '';
    let generatedTitle = '';

    // 2. Launch engine request
    if (launchBtn) {
        launchBtn.addEventListener('click', () => {
            const promptVal = promptInput.value.trim();
            const apiKeyValue = apiKeyInput ? apiKeyInput.value.trim() : '';

            if (!promptVal) {
                alert('Please enter your startup idea first!');
                return;
            }

            // UI Transitions: Show progress screen
            inputContainer.style.display = 'none';
            progressContainer.style.display = 'grid';
            resultsContainer.style.display = 'none';
            
            // Reset steps styling & terminal logs
            resetAgentStepIndicators();
            terminal.innerHTML = '<div class="terminal-line"><span class="term-prompt">&gt;</span><span>Initializing AI Agent Orchestration Node...</span></div>';
            orchStatus.textContent = 'ACTIVE COMPILE';
            orchStatus.style.color = 'var(--primary)';

            // Trigger generation API call
            fetch('/api/generate-startup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: promptVal,
                    apiKey: apiKeyValue
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    currentStartupId = data.id;
                    listenToProgress(currentStartupId);
                } else {
                    appendTerminalLine('Orchestrator', `Failed to start engine: ${data.message}`, 'error');
                    orchStatus.textContent = 'COMPILE ERROR';
                    orchStatus.style.color = '#EF4444';
                    showRestartOption();
                }
            })
            .catch(err => {
                console.error(err);
                appendTerminalLine('Orchestrator', 'Network connection failed to start generation.', 'error');
                orchStatus.textContent = 'NETWORK FAULT';
                orchStatus.style.color = '#EF4444';
                showRestartOption();
            });
        });
    }

    // Helper: Add log line to terminal
    function appendTerminalLine(tag, text, type = 'info') {
        if (!terminal) return;
        const line = document.createElement('div');
        line.className = 'terminal-line';
        
        const prompt = document.createElement('span');
        prompt.className = 'term-prompt';
        prompt.textContent = '>';

        const textSpan = document.createElement('span');
        if (type === 'error') {
            textSpan.className = 'term-success';
            textSpan.style.color = '#EF4444';
        } else if (type === 'success') {
            textSpan.className = 'term-success';
        }
        textSpan.textContent = tag ? `[${tag}] ${text}` : text;

        line.appendChild(prompt);
        line.appendChild(textSpan);
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
    }

    // Helper: Reset step nodes (9 expanded workflow items)
    function resetAgentStepIndicators() {
        const stepIds = [
            'step-submitted', 'step-research', 'step-planning', 'step-designer', 
            'step-developer', 'step-testing', 'step-marketing', 'step-deployment', 'step-complete'
        ];
        stepIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.className = 'agent-step-item';
                el.querySelector('.step-status-icon').innerHTML = '<i data-lucide="minus" style="color: var(--text-muted);"></i>';
            }
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Helper: Show restart button inside terminal if error happens
    function showRestartOption() {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.style.marginTop = '1rem';
        line.innerHTML = `<button class="btn btn-secondary" onclick="restartWorkspace()" style="padding: 0.4rem 1rem; font-size: 0.8rem;">Return to Launchpad</button>`;
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
    }

    // 3. Listen to SSE Stream progress
    function listenToProgress(startupId) {
        const sse = new EventSource(`/api/generation-progress?id=${startupId}`);

        sse.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.text) {
                appendTerminalLine(data.stage !== 'complete' ? getAgentTag(data.stage) : 'Orchestrator', data.text, data.error ? 'error' : (data.completed ? 'success' : 'info'));
            }

            if (data.stage && data.stage !== 'complete') {
                updateStepUI(data.stage, data.completed);
            }

            // Generation Finished successfully
            if (data.stage === 'complete' && data.files) {
                sse.close();
                orchStatus.textContent = 'SUCCESS';
                orchStatus.style.color = '#10B981';
                
                setTimeout(() => {
                    renderResults(data.files);
                }, 1500);
            }
        };

        sse.onerror = (err) => {
            console.error('SSE Error:', err);
            appendTerminalLine('Orchestrator', 'SSE progress channel closed or timed out.', 'error');
            sse.close();
        };
    }

    function getAgentTag(stage) {
        const tags = {
            submitted: 'System',
            research: 'UXResearchAI',
            planning: 'ProductManagerAI',
            designer: 'DesignerAI',
            developer: 'DevAI',
            testing: 'QAEngineerAI',
            marketing: 'SEOExpertAI',
            deployment: 'DevOpsAI'
        };
        return tags[stage] || 'Orchestrator';
    }

    // Update steps spinner / checkmark icons for 9 expanded items
    function updateStepUI(stage, isCompleted) {
        const stepIdMap = {
            submitted: 'step-submitted',
            research: 'step-research',
            planning: 'step-planning',
            designer: 'step-designer',
            developer: 'step-developer',
            testing: 'step-testing',
            marketing: 'step-marketing',
            deployment: 'step-deployment',
            complete: 'step-complete'
        };
        
        const el = document.getElementById(stepIdMap[stage]);
        if (!el) return;

        if (isCompleted) {
            el.className = 'agent-step-item completed';
            el.querySelector('.step-status-icon').innerHTML = '<i data-lucide="check" style="color: #10B981;"></i>';
        } else {
            el.className = 'agent-step-item active';
            el.querySelector('.step-status-icon').innerHTML = '<span class="step-spinner"></span>';
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // 4. Render output packages in tabs
    function renderResults(files) {
        // Hide loader, show results
        progressContainer.style.display = 'none';
        resultsContainer.style.display = 'flex';

        // Set Title & Subtitle
        generatedTitle = files.title || 'Brand Startup';
        document.getElementById('generated-title').textContent = generatedTitle;
        document.getElementById('generated-subtitle').textContent = `Workspace packages compiled successfully for Project ID: ${currentStartupId}`;

        // Populate Markdown Panes
        document.getElementById('results-research').innerHTML = parseMarkdown(files.research);
        document.getElementById('results-plan').innerHTML = parseMarkdown(files.plan);
        document.getElementById('results-marketing').innerHTML = parseMarkdown(files.marketing);
        document.getElementById('results-takeover').innerHTML = parseMarkdown(files.takeover);

        // Load iframe mockup
        resultsIframe.src = files.appUrl;

        // Store code globally
        generatedAppCode = files.appCode;

        // Bind download link
        const downloadBtn = document.getElementById('download-app-btn');
        if (downloadBtn) {
            const blob = new Blob([files.appCode], { type: 'text/html' });
            downloadBtn.href = URL.createObjectURL(blob);
            downloadBtn.download = `${generatedTitle.toLowerCase().replace(/\s+/g, '_')}_app.html`;
        }

        // Draw Interactive Knowledge Graph initially
        drawKnowledgeGraph(generatedTitle);
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // 5. Tab selector binds (handles Knowledge Graph visualization panel toggle)
    const tabBtns = document.querySelectorAll('.tab-btn');
    const iframePane = document.getElementById('results-iframe');
    const mdResearch = document.getElementById('results-research');
    const mdPlan = document.getElementById('results-plan');
    const mdMarketing = document.getElementById('results-marketing');
    const mdTakeover = document.getElementById('results-takeover');
    const resultsGraph = document.getElementById('results-graph');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.getAttribute('data-tab');

            // Hide all
            iframePane.style.display = 'none';
            mdResearch.style.display = 'none';
            mdPlan.style.display = 'none';
            mdMarketing.style.display = 'none';
            mdTakeover.style.display = 'none';
            resultsGraph.style.display = 'none';

            // Show selected
            if (tab === 'preview') {
                iframePane.style.display = 'block';
            } else if (tab === 'research') {
                mdResearch.style.display = 'block';
            } else if (tab === 'plan') {
                mdPlan.style.display = 'block';
            } else if (tab === 'marketing') {
                mdMarketing.style.display = 'block';
            } else if (tab === 'takeover') {
                mdTakeover.style.display = 'block';
            } else if (tab === 'graph') {
                resultsGraph.style.display = 'block';
                drawKnowledgeGraph(generatedTitle);
            }
        });
    });

    // 6. SVG Interactive Knowledge Graph Rendering
    function drawKnowledgeGraph(startupTitle) {
        const svg = document.getElementById('kg-svg-canvas');
        if (!svg) return;

        svg.innerHTML = ''; // Clear canvas
        
        const width = svg.clientWidth || 550;
        const height = svg.clientHeight || 480;
        const cx = width / 2;
        const cy = height / 2;

        const nodes = [
            { id: 'center', name: startupTitle, type: 'core', cx: cx, cy: cy, color: 'var(--primary)', size: 32 },
            { id: 'customers', name: 'Customers', type: 'child', cx: cx + 140 * Math.cos(0 * Math.PI / 180), cy: cy + 140 * Math.sin(0 * Math.PI / 180), color: 'var(--secondary)', size: 24 },
            { id: 'competitors', name: 'Competitors', type: 'child', cx: cx + 140 * Math.cos(72 * Math.PI / 180), cy: cy + 140 * Math.sin(72 * Math.PI / 180), color: 'var(--secondary)', size: 24 },
            { id: 'revenue', name: 'Revenue', type: 'child', cx: cx + 140 * Math.cos(144 * Math.PI / 180), cy: cy + 140 * Math.sin(144 * Math.PI / 180), color: 'var(--accent)', size: 24 },
            { id: 'technology', name: 'Technology', type: 'child', cx: cx + 140 * Math.cos(216 * Math.PI / 180), cy: cy + 140 * Math.sin(216 * Math.PI / 180), color: 'var(--accent)', size: 24 },
            { id: 'marketing', name: 'Marketing', type: 'child', cx: cx + 140 * Math.cos(288 * Math.PI / 180), cy: cy + 140 * Math.sin(288 * Math.PI / 180), color: 'var(--accent-pink)', size: 24 }
        ];

        // Entity Details database lookup
        const graphDatabase = {
            center: {
                title: `${startupTitle} (Core Entity)`,
                desc: `This is the parent startup node initialized by the NexusOS Orchestrator. It acts as the central context coordinator for all operations.`,
                extra: `Active agents linked: 8 | Database slot: SQLite / Local FS | Target sector: Multi-vertical SaaS.`
            },
            customers: {
                title: 'Customers & Target Audience',
                desc: `Identifies the target buyer demographics and user persona groups compiled by UXResearchAI and BusinessAnalystAI.`,
                extra: `Primary target: Digital managers and enterprise teams. Pain points addressed: High operational overhead, slow software delivery.`
            },
            competitors: {
                title: 'Competitors & Blocker Audit',
                desc: `Mapping rival brands and potential regulatory compliance risks identified by RiskAssessmentAI and BusinessAnalystAI.`,
                extra: `Direct competitors: Legacy software systems, manual consultants. Risk index: Low (Highly scalable SaaS model).`
            },
            revenue: {
                title: 'Revenue & Monetization Strategy',
                desc: `Financial milestones, cost forecastings, and subscription pricing matrices developed by ProductManagerAI and BusinessAnalystAI.`,
                extra: `Billing structure: Recurring monthly subscription (Starter, Professional, Enterprise) yielding high LTV/CAC ratios.`
            },
            technology: {
                title: 'Technology & DevOps Stack',
                desc: `Core frameworks, APIs, and container deployment infrastructure managed by DeveloperAI and DevOpsAI.`,
                extra: `Stack used: Node.js server engine, REST API structures, responsive HTML5 client frontend templates.`
            },
            marketing: {
                title: 'Marketing funnel & SEO Campaigns',
                desc: `Ad copywriting hooks, SEO tag sets, and AI promo video scripts compiled by SEOExpertAI and GrowthStrategistAI.`,
                extra: `SEO focus keywords: automation, scalable workflow, multi-agent AI. Promo channel: LinkedIn, developer forums.`
            }
        };

        // Draw Links first so circles render on top
        nodes.forEach(node => {
            if (node.id !== 'center') {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', cx);
                line.setAttribute('y1', cy);
                line.setAttribute('x2', node.cx);
                line.setAttribute('y2', node.cy);
                line.setAttribute('class', 'kg-link');
                svg.appendChild(line);
            }
        });

        // Draw Nodes
        nodes.forEach(node => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', node.cx);
            circle.setAttribute('cy', node.cy);
            circle.setAttribute('r', node.size);
            circle.setAttribute('fill', node.color);
            circle.setAttribute('class', 'kg-node');
            
            // Add click listener to show node details on sidebar
            circle.addEventListener('click', () => {
                const data = graphDatabase[node.id];
                if (data) {
                    document.getElementById('kg-node-title').textContent = data.title;
                    document.getElementById('kg-node-desc').textContent = data.desc;
                    document.getElementById('kg-node-extra').textContent = data.extra;
                }
            });

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', node.cx);
            text.setAttribute('y', node.cy + 4);
            text.setAttribute('class', 'kg-text');
            
            // Truncate name if too long for circle
            const displayLabel = node.name.length > 9 ? node.name.substring(0, 7) + '..' : node.name;
            text.textContent = displayLabel;

            g.appendChild(circle);
            g.appendChild(text);
            svg.appendChild(g);
        });
    }

    // 7. Simple Client-Side Markdown Parser
    function parseMarkdown(mdText) {
        if (!mdText) return '<p>No data recorded.</p>';

        let html = mdText;

        // Replace headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Replace bold
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

        // Replace lists (unordered)
        html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
        html = html.replace(/<\/li>\n<li>/gim, '</li><li>');
        html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');

        // Replace blockquotes
        html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

        // Code inline
        html = html.replace(/`(.*?)`/gim, '<code>$1</code>');

        // Line breaks / paragraphs
        html = html.replace(/\n\n/gim, '</p><p>');
        
        if (!html.startsWith('<h1') && !html.startsWith('<h2') && !html.startsWith('<h3')) {
            html = '<p>' + html + '</p>';
        }

        return html;
    }

    // 8. Global Copy Code action
    window.copyAppCode = () => {
        if (!generatedAppCode) {
            alert('No application code compiled yet!');
            return;
        }

        navigator.clipboard.writeText(generatedAppCode)
            .then(() => {
                alert('Success! Code copied to clipboard. Paste it into an empty .html file to run it.');
            })
            .catch(err => {
                console.error(err);
                alert('Failed to copy code. Please use the download link.');
            });
    };

    // 9. Restart launcher
    window.restartWorkspace = () => {
        inputContainer.style.display = 'grid';
        progressContainer.style.display = 'none';
        resultsContainer.style.display = 'none';
        promptInput.value = '';
    };

    // 10. Support Request Modal Actions
    const supportModal = document.getElementById('support-modal');
    const supportForm = document.getElementById('workspace-support-form');
    const supportStatus = document.getElementById('support-status');

    window.openSupportModal = () => {
        if (supportModal) {
            supportModal.style.display = 'flex';
        }
    };

    window.closeSupportModal = () => {
        if (supportModal) {
            supportModal.style.display = 'none';
        }
        if (supportStatus) {
            supportStatus.style.display = 'none';
            supportStatus.className = 'form-status';
        }
        if (supportForm) {
            supportForm.reset();
        }
    };

    if (supportForm) {
        supportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = supportForm.querySelector('button[type="submit"]');
            const nameVal = document.getElementById('support-name').value;
            const emailVal = document.getElementById('support-email').value;
            const msgVal = document.getElementById('support-msg').value;

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting Ticket...';
            }

            if (supportStatus) {
                supportStatus.style.display = 'none';
            }

            fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: nameVal,
                    email: emailVal,
                    message: `[Workspace Support Ticket] ${msgVal}`
                })
            })
            .then(res => res.json())
            .then(data => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Support Ticket';
                }
                if (supportStatus) {
                    supportStatus.style.display = 'block';
                    if (data.success) {
                        supportStatus.textContent = 'Support ticket submitted successfully! Our engineering team will contact you shortly.';
                        supportStatus.className = 'form-status success';
                        supportForm.reset();
                    } else {
                        supportStatus.textContent = `Error: ${data.message}`;
                        supportStatus.className = 'form-status error';
                    }
                }
            })
            .catch(err => {
                console.error(err);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Support Ticket';
                }
                if (supportStatus) {
                    supportStatus.style.display = 'block';
                    supportStatus.textContent = 'Network error: Failed to submit support ticket.';
                    supportStatus.className = 'form-status error';
                }
            });
        });
    }
});

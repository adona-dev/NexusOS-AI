/* ==========================================================================
   NexusOS AI - Interactive Application Logic (SSE & Modal Integration)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. Sticky Header and Nav Scroll Active indicator
    const header = document.getElementById('header');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    // Helper: Scroll to contact section
    window.scrollToContact = () => {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // 3. Mobile Responsive Navigation Drawer Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            header.classList.toggle('nav-open');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            header.classList.remove('nav-open');
        });
    });

    // 4. Live Dashboard Integration via Server-Sent Events (SSE)
    const statAgents = document.getElementById('stat-agents');
    const statTasks = document.getElementById('stat-tasks');
    const statProjects = document.getElementById('stat-projects');
    const terminalPanel = document.getElementById('terminal-panel');
    const termTimestamp = document.getElementById('terminal-timestamp');
    const chartBars = document.querySelectorAll('.chart-bar');
    const agentItems = document.querySelectorAll('.agent-list-item');

    let activeAgentId = 'developer';

    // Mock logs for client-side selection
    const logsDatabase = {
        developer: [
            { tag: 'DevAI', text: 'Analyzing repository pull requests...', type: 'info' },
            { tag: 'DevAI', text: 'Refactoring API rate limiter in middleware...', type: 'info' },
            { tag: 'DevAI', text: 'Running test pipeline: 1,482 test cases executed.', type: 'info' },
            { tag: 'DevAI', text: 'Auth suite compiled. 0 errors, coverage 99.8%.', type: 'success' },
            { tag: 'DevAI', text: 'Deployment successful to production build-843.', type: 'success' }
        ],
        researcher: [
            { tag: 'ResearchAI', text: 'Indexing external journals and whitepapers...', type: 'info' },
            { tag: 'ResearchAI', text: 'Downloading corporate SEC finance filings...', type: 'info' },
            { tag: 'ResearchAI', text: 'Synthesizing market trend vectors (2,400 points)...', type: 'info' },
            { tag: 'ResearchAI', text: 'Correlating historical graphs with current data.', type: 'info' },
            { tag: 'ResearchAI', text: 'Indexing complete. PDF briefing paper exported.', type: 'success' }
        ],
        analyst: [
            { tag: 'AnalystAI', text: 'Establishing secure query tunnel to databases...', type: 'info' },
            { tag: 'AnalystAI', text: 'Cleaning 15,000 messy customer record rows...', type: 'info' },
            { tag: 'AnalystAI', text: 'Executing predictive cash flow regressions...', type: 'info' },
            { tag: 'AnalystAI', text: 'Generating daily resource allocation chart.', type: 'success' },
            { tag: 'AnalystAI', text: 'Data anomaly scanning complete: 0 warnings.', type: 'success' }
        ],
        security: [
            { tag: 'SecurityAI', text: 'Scanning external ports for injection vulnerabilities...', type: 'info' },
            { tag: 'SecurityAI', text: 'Auditing IAM permission arrays for 412 active users...', type: 'info' },
            { tag: 'SecurityAI', text: 'Applying software dependency security patches...', type: 'info' },
            { tag: 'SecurityAI', text: 'Threat signature checks: Clean system posture.', type: 'success' },
            { tag: 'SecurityAI', text: 'Firewall rules successfully hardened.', type: 'success' }
        ]
    };

    function appendLocalLogs(agentKey) {
        if (!terminalPanel) return;
        const logs = logsDatabase[agentKey];
        terminalPanel.innerHTML = '';
        logs.forEach(log => {
            const line = document.createElement('div');
            line.className = 'terminal-line';
            
            const prompt = document.createElement('span');
            prompt.className = 'term-prompt';
            prompt.textContent = '>';
            
            const tagSpan = document.createElement('span');
            tagSpan.className = 'term-tag';
            tagSpan.textContent = `[${log.tag}] `;
            
            const textSpan = document.createElement('span');
            if (log.type === 'success') {
                textSpan.className = 'term-success';
            }
            textSpan.textContent = log.text;

            line.appendChild(prompt);
            line.appendChild(tagSpan);
            line.appendChild(textSpan);
            terminalPanel.appendChild(line);
        });
        terminalPanel.scrollTop = terminalPanel.scrollHeight;
    }

    agentItems.forEach(item => {
        item.addEventListener('click', () => {
            agentItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            activeAgentId = item.getAttribute('data-agent');
            appendLocalLogs(activeAgentId);
        });
    });

    // Establish SSE stream
    function connectSSE() {
        const sse = new EventSource('/api/system-feed');
        
        sse.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // 1. Update stats ribbons
            if (statAgents) statAgents.textContent = data.activeAgents;
            if (statTasks) statTasks.textContent = data.tasksCompleted.toLocaleString();
            if (statProjects) statProjects.textContent = data.projectsRunning;

            // 2. Update resource chart
            if (data.barHeights) {
                chartBars.forEach((bar, idx) => {
                    if (data.barHeights[idx] !== undefined) {
                        bar.style.height = `${data.barHeights[idx]}%`;
                    }
                });
            }

            // 3. Append to system feed (on right)
            const feedContainer = document.getElementById('db-feed');
            if (feedContainer && data.newLog) {
                const existingFeeds = feedContainer.querySelectorAll('.feed-item');
                if (existingFeeds.length >= 4) {
                    existingFeeds[existingFeeds.length - 1].remove();
                }

                const feedItem = document.createElement('div');
                feedItem.className = 'feed-item';
                
                const feedTime = document.createElement('div');
                feedTime.className = 'feed-time';
                feedTime.textContent = 'Just Now';
                
                const feedTitle = document.createElement('div');
                feedTitle.className = 'feed-title';
                feedTitle.textContent = `[${data.newLog.tag}] Real-time Event`;
                
                const feedDesc = document.createElement('div');
                if (data.newLog.type === 'success') {
                    feedDesc.className = 'feed-desc term-success';
                } else {
                    feedDesc.className = 'feed-desc';
                }
                feedDesc.textContent = data.newLog.text;

                feedItem.appendChild(feedTime);
                feedItem.appendChild(feedTitle);
                feedItem.appendChild(feedDesc);

                const titleEl = feedContainer.querySelector('.sidebar-title');
                if (titleEl && titleEl.nextSibling) {
                    feedContainer.insertBefore(feedItem, titleEl.nextSibling);
                } else {
                    feedContainer.appendChild(feedItem);
                }
            }

            // 4. Also stream directly to terminal console if matches active tab context
            if (data.newLog && terminalPanel) {
                const isMatchingContext = 
                    (activeAgentId === 'developer' && data.newLog.tag === 'DevAI') ||
                    (activeAgentId === 'researcher' && data.newLog.tag === 'ResearchAI') ||
                    (activeAgentId === 'analyst' && data.newLog.tag === 'AnalystAI') ||
                    (activeAgentId === 'security' && data.newLog.tag === 'SecurityAI');
                
                if (isMatchingContext) {
                    // limit lines to 6 to prevent overflow
                    const lines = terminalPanel.querySelectorAll('.terminal-line');
                    if (lines.length >= 6) {
                        lines[0].remove();
                    }
                    
                    const line = document.createElement('div');
                    line.className = 'terminal-line';
                    
                    const prompt = document.createElement('span');
                    prompt.className = 'term-prompt';
                    prompt.textContent = '>';
                    
                    const tagSpan = document.createElement('span');
                    tagSpan.className = 'term-tag';
                    tagSpan.textContent = `[${data.newLog.tag}] `;
                    
                    const textSpan = document.createElement('span');
                    if (data.newLog.type === 'success') {
                        textSpan.className = 'term-success';
                    }
                    textSpan.textContent = data.newLog.text;

                    line.appendChild(prompt);
                    line.appendChild(tagSpan);
                    line.appendChild(textSpan);
                    terminalPanel.appendChild(line);
                    terminalPanel.scrollTop = terminalPanel.scrollHeight;
                }
            }
        };

        sse.onerror = () => {
            console.warn('SSE connection disrupted, attempting reconnect in 5s...');
            sse.close();
            setTimeout(connectSSE, 5000);
        };
    }
    
    // Connect to Node.js server EventSource
    connectSSE();
    appendLocalLogs('developer');

    // Update terminal timestamp display
    function updateTerminalTimestamp() {
        const now = new Date();
        if (termTimestamp) {
            termTimestamp.textContent = `TIMESTAMP: ${now.toLocaleTimeString()}`;
        }
    }
    updateTerminalTimestamp();
    setInterval(updateTerminalTimestamp, 1000);

    // 5. Product Workflow Active Cycle
    const workflowSteps = document.querySelectorAll('.workflow-step');
    let activeStepIdx = 0;

    setInterval(() => {
        workflowSteps.forEach(step => step.classList.remove('active'));
        activeStepIdx = (activeStepIdx + 1) % workflowSteps.length;
        workflowSteps[activeStepIdx].classList.add('active');
        
        const container = document.querySelector('.workflow-container');
        if (container && window.innerWidth < 1024) {
            const stepEl = workflowSteps[activeStepIdx];
            container.scrollLeft = stepEl.offsetLeft - (container.offsetWidth / 2) + (stepEl.offsetWidth / 2);
        }
    }, 3500);

    // 6. Interactive Pricing Toggle Switch
    const pricingSwitch = document.getElementById('pricing-switch');
    const billingMonthly = document.getElementById('billing-monthly');
    const billingAnnual = document.getElementById('billing-annual');
    const priceStarter = document.getElementById('price-starter');
    const pricePro = document.getElementById('price-pro');
    const priceEnterprise = document.getElementById('price-enterprise');

    if (pricingSwitch) {
        pricingSwitch.addEventListener('click', () => {
            pricingSwitch.classList.toggle('annual');
            const isAnnual = pricingSwitch.classList.contains('annual');

            if (isAnnual) {
                billingAnnual.classList.add('active');
                billingMonthly.classList.remove('active');
                if (priceStarter) priceStarter.textContent = '23';
                if (pricePro) pricePro.textContent = '79';
                if (priceEnterprise) priceEnterprise.textContent = '399';
            } else {
                billingMonthly.classList.add('active');
                billingAnnual.classList.remove('active');
                if (priceStarter) priceStarter.textContent = '29';
                if (pricePro) pricePro.textContent = '99';
                if (priceEnterprise) priceEnterprise.textContent = '499';
            }
        });
    }

    // 7. FAQ Accordion Toggle
    const faqTriggers = document.querySelectorAll('.faq-trigger');
    faqTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const item = trigger.parentNode;
            const content = item.querySelector('.faq-content');
            const isActive = item.classList.contains('active');

            document.querySelectorAll('.faq-item').forEach(i => {
                i.classList.remove('active');
                const c = i.querySelector('.faq-content');
                if (c) c.style.maxHeight = '0px';
                const button = i.querySelector('.faq-trigger');
                if (button) button.setAttribute('aria-expanded', 'false');
            });

            if (!isActive) {
                item.classList.add('active');
                trigger.setAttribute('aria-expanded', 'true');
                content.style.maxHeight = `${content.scrollHeight}px`;
            }
        });
    });

    // 8. Contact Form Submit Integration with Backend API POST
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const nameVal = document.getElementById('contact-name').value;
            const emailVal = document.getElementById('contact-email').value;
            const companyVal = document.getElementById('contact-company').value;
            const msgVal = document.getElementById('contact-msg').value;
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Transmitting Data...';
            }

            if (formStatus) {
                formStatus.className = 'form-status';
                formStatus.style.display = 'none';
            }

            // POST to Node server CRM endpoint
            fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: nameVal,
                    email: emailVal,
                    company: companyVal,
                    message: msgVal
                })
            })
            .then(res => res.json())
            .then(data => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Request';
                }
                if (formStatus) {
                    formStatus.style.display = 'block';
                    if (data.success) {
                        formStatus.textContent = `Thank you, ${nameVal}! Your request has been successfully recorded in the backend. An operations engineer will contact you shortly.`;
                        formStatus.className = 'form-status success';
                        contactForm.reset();
                    } else {
                        formStatus.textContent = `Error: ${data.message}`;
                        formStatus.className = 'form-status error';
                    }
                    formStatus.style.marginTop = '1rem';
                }
            })
            .catch(err => {
                console.error('Contact submit error:', err);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Request';
                }
                if (formStatus) {
                    formStatus.style.display = 'block';
                    formStatus.textContent = 'Network error: Failed to connect to server backend.';
                    formStatus.className = 'form-status error';
                    formStatus.style.marginTop = '1rem';
                }
            });
        });
    }

    // 9. Success Metrics Reveal animations
    const metricsObs = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const targetVal = parseInt(element.getAttribute('data-val'));
                let currentVal = 0;
                const increment = Math.ceil(targetVal / 50);
                const duration = 1500;
                const stepTime = Math.abs(Math.floor(duration / (targetVal / increment)));
                
                const timer = setInterval(() => {
                    currentVal += increment;
                    if (currentVal >= targetVal) {
                        currentVal = targetVal;
                        clearInterval(timer);
                    }
                    
                    if (targetVal === 500) {
                        element.textContent = `${currentVal}+`;
                    } else if (targetVal === 15) {
                        element.textContent = `${currentVal}M`;
                    } else if (targetVal === 99) {
                        element.textContent = `${currentVal}.2%`;
                    } else {
                        element.textContent = `${currentVal}+`;
                    }
                }, stepTime);

                observer.unobserve(element);
            }
        });
    }, { threshold: 0.5 });

    const metricNumbers = document.querySelectorAll('.metric-num');
    metricNumbers.forEach(num => metricsObs.observe(num));

    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.1 });

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => revealObs.observe(el));

    // ==========================================================================
    // 10. Watch Demo Video Modal Simulation player
    // ==========================================================================
    const demoModal = document.getElementById('demo-modal');
    const playerScreen = document.getElementById('modal-player-screen');
    const playBtn = document.getElementById('modal-play-btn');
    const progressBar = document.getElementById('modal-progress-bar');
    const timeDisplay = document.getElementById('modal-time-display');

    let playbackInterval = null;
    let isPlaying = false;
    let secondsElapsed = 0;
    const totalDuration = 30; // 30 seconds demo

    // Simulated terminal playback sequence log queue
    const demoSequence = [
        { time: 0, text: '[System] Initiated collaborative deploy pipeline: "Microservices Credit Card Payments"', type: 'info' },
        { time: 2, text: '[ResearchAI] Indexing: target specifications, Stripe API v3, compliance regulations.', type: 'info' },
        { time: 5, text: '[ResearchAI] Analysis finished: compiled JSON briefing sheets. Forwarding payload to PlanningAI.', type: 'success' },
        { time: 8, text: '[PlanningAI] Structural breakdown: created 3 module maps (Router, DB layer, webhook handler).', type: 'info' },
        { time: 11, text: '[PlanningAI] Architecture specifications locked. Directing Software Developer AI to write files.', type: 'info' },
        { time: 14, text: '[DevAI] Creating repository folder tree... compiling controllers/payment.go and router.go', type: 'info' },
        { time: 17, text: '[DevAI] Code base compiling. Pushed commit build-1092. Initiated Pull Request #450.', type: 'success' },
        { time: 20, text: '[TestingAI] Triggered test hooks. Executing unit test suite (42 assertions).', type: 'info' },
        { time: 22, text: '[TestingAI] Test coverage 100% passed. Executing dependency vulnerability review.', type: 'success' },
        { time: 24, text: '[SecurityAI] Static application security testing (SAST) complete. 0 alerts. SQL protection verified.', type: 'success' },
        { time: 26, text: '[DeploymentAI] Bundling container image. Deployed instance to AWS elastic cluster pod-4.', type: 'info' },
        { time: 28, text: '[System] Pipeline status: SUCCESS. App live at https://checkout.nexusos.ai. Network latency: 9ms.', type: 'success' },
        { time: 30, text: '[Workflow] Sequence complete. One idea fully researched, coded, audited, and scaled.', type: 'success' }
    ];

    window.openDemoModal = () => {
        if (demoModal) {
            demoModal.classList.add('active');
            resetPlayback();
        }
    };

    window.closeDemoModal = () => {
        if (demoModal) {
            demoModal.classList.remove('active');
            pausePlayback();
        }
    };

    function resetPlayback() {
        secondsElapsed = 0;
        isPlaying = false;
        if (progressBar) progressBar.style.width = '0%';
        if (timeDisplay) timeDisplay.textContent = '00:00 / 00:30';
        if (playerScreen) {
            playerScreen.innerHTML = '<div class="terminal-line" style="color:var(--text-muted)">Press PLAY to stream system deployment workflow simulation...</div>';
        }
        if (playBtn) {
            playBtn.querySelector('span').textContent = 'PLAY';
            const playIcon = playBtn.querySelector('.icon-play');
            const pauseIcon = playBtn.querySelector('.icon-pause');
            const replayIcon = playBtn.querySelector('.icon-replay');
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            if (replayIcon) replayIcon.style.display = 'none';
        }
        clearInterval(playbackInterval);
    }

    function pausePlayback() {
        isPlaying = false;
        clearInterval(playbackInterval);
        if (playBtn) {
            playBtn.querySelector('span').textContent = 'PLAY';
            const playIcon = playBtn.querySelector('.icon-play');
            const pauseIcon = playBtn.querySelector('.icon-pause');
            const replayIcon = playBtn.querySelector('.icon-replay');
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            if (replayIcon) replayIcon.style.display = 'none';
        }
    }

    window.toggleModalPlayback = () => {
        if (isPlaying) {
            pausePlayback();
        } else {
            isPlaying = true;
            if (playBtn) {
                playBtn.querySelector('span').textContent = 'PAUSE';
                const playIcon = playBtn.querySelector('.icon-play');
                const pauseIcon = playBtn.querySelector('.icon-pause');
                const replayIcon = playBtn.querySelector('.icon-replay');
                if (playIcon) playIcon.style.display = 'none';
                if (pauseIcon) pauseIcon.style.display = 'block';
                if (replayIcon) replayIcon.style.display = 'none';
            }

            // Clear first message if starting from zero
            if (secondsElapsed === 0 && playerScreen) {
                playerScreen.innerHTML = '';
            }

            playbackInterval = setInterval(() => {
                secondsElapsed++;
                
                // Update progress bar & time
                const percent = (secondsElapsed / totalDuration) * 100;
                if (progressBar) progressBar.style.width = `${percent}%`;
                
                const timeStr = `00:${secondsElapsed.toString().padStart(2, '0')}`;
                if (timeDisplay) timeDisplay.textContent = `${timeStr} / 00:30`;

                // Check logs array for entries matching current timestamp
                const logEntry = demoSequence.find(e => e.time === secondsElapsed);
                if (logEntry && playerScreen) {
                    const line = document.createElement('div');
                    line.className = 'terminal-line';
                    
                    const prompt = document.createElement('span');
                    prompt.className = 'term-prompt';
                    prompt.textContent = '>';
                    
                    const textSpan = document.createElement('span');
                    if (logEntry.type === 'success') {
                        textSpan.className = 'term-success';
                    }
                    textSpan.textContent = logEntry.text;

                    line.appendChild(prompt);
                    line.appendChild(textSpan);
                    playerScreen.appendChild(line);
                    playerScreen.scrollTop = playerScreen.scrollHeight;
                }

                // Check end condition
                if (secondsElapsed >= totalDuration) {
                    pausePlayback();
                    if (playBtn) {
                        playBtn.querySelector('span').textContent = 'REPLAY';
                        const playIcon = playBtn.querySelector('.icon-play');
                        const pauseIcon = playBtn.querySelector('.icon-pause');
                        const replayIcon = playBtn.querySelector('.icon-replay');
                        if (playIcon) playIcon.style.display = 'none';
                        if (pauseIcon) pauseIcon.style.display = 'none';
                        if (replayIcon) replayIcon.style.display = 'block';
                    }
                    // Reset seconds so play starts fresh next time
                    secondsElapsed = 0;
                }
            }, 1000);
        }
    };
});

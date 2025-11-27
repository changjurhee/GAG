/**
 * Physics simulation for the Lottery Generator
 */

// Simulation state
let simCanvas = null;
let simCtx = null;
let simRunning = false;
let simBalls = [];
let simSelected = [];
let animationId = null;
let lastExtractionTime = 0;

// Machine properties
let drumCenter = { x: 300, y: 200 };
let drumRadius = CONFIG.SIM_DRUM_RADIUS;
let suctionRadius = CONFIG.SIM_SUCTION_RADIUS;

/**
 * SimBall class representing a physics ball in the simulation
 */
class SimBall {
    constructor(id) {
        this.id = id;
        this.radius = 10;
        // Initial position: Random inside circle
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * (drumRadius - 20);
        this.x = drumCenter.x + Math.cos(angle) * r;
        this.y = drumCenter.y + Math.sin(angle) * r;

        this.vx = (Math.random() - 0.5) * 15;
        this.vy = (Math.random() - 0.5) * 15;

        this.mass = 1 + (Math.random() - 0.5) * 0.05;
        this.elasticity = 0.85;
        this.friction = 0.99;

        // Color based on range
        this.color = getBallColor(id);
    }

    draw() {
        if (!simCtx) return;
        
        simCtx.beginPath();
        simCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        // 3D Gradient
        const gradient = simCtx.createRadialGradient(
            this.x - this.radius / 3, this.y - this.radius / 3, this.radius / 10,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.3, this.color);
        gradient.addColorStop(1, '#000'); // Shadow

        simCtx.fillStyle = gradient;
        simCtx.fill();

        // Number
        simCtx.fillStyle = 'white';
        simCtx.font = 'bold 10px Arial';
        simCtx.textAlign = 'center';
        simCtx.textBaseline = 'middle';
        simCtx.fillText(this.id, this.x, this.y);
        simCtx.closePath();
    }

    update(turbulenceVal, gravityVal) {
        // Gravity (Always active)
        const g = gravityVal !== undefined ? gravityVal : 0.3;
        this.vy += g;

        // Air Jet Logic (Localized at Bottom Center)
        if (turbulenceVal > 0) {
            // Jet Zone: Narrow column at the bottom
            const jetWidth = 60; // Width of the air stream
            const jetHeight = 100; // Height of the strong blast from bottom

            // Check if ball is in the horizontal range of the jet
            if (Math.abs(this.x - drumCenter.x) < jetWidth / 2) {
                // Check if ball is near the bottom (in the blast zone)
                if (this.y > drumCenter.y + drumRadius - jetHeight) {
                    // Apply strong upward force (Jet Blast)
                    const lift = turbulenceVal * 0.8; // Stronger lift
                    this.vy -= lift + Math.random() * 2; // Blast + chaos

                    // Slight horizontal jitter to prevent stacking
                    this.vx += (Math.random() - 0.5) * 2;
                }
                // If ball is higher up in the center, apply weaker residual lift + dispersion
                else if (this.y > drumCenter.y) {
                    this.vy -= turbulenceVal * 0.1; // Weak lift
                    // Push away from center to cycle back down
                    this.vx += (Math.random() - 0.5) * 5;
                }
            }
        }

        // Friction
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Position update
        this.x += this.vx;
        this.y += this.vy;

        // Circular Wall Collision
        const dx = this.x - drumCenter.x;
        const dy = this.y - drumCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist + this.radius > drumRadius) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = dist + this.radius - drumRadius;
            this.x -= nx * overlap;
            this.y -= ny * overlap;

            const dot = this.vx * nx + this.vy * ny;
            this.vx = (this.vx - 2 * dot * nx) * this.elasticity;
            this.vy = (this.vy - 2 * dot * ny) * this.elasticity;

            const tx = -ny;
            const ty = nx;
            const tDot = this.vx * tx + this.vy * ty;
            this.vx -= tx * tDot * 0.05;
            this.vy -= ty * tDot * 0.05;
        }
    }
}

/**
 * Initialize the simulation with 45 balls
 */
function initSimulation() {
    simBalls = [];
    simSelected = [];
    lastExtractionTime = 0;
    
    const simResults = document.getElementById('sim-results');
    if (simResults) simResults.innerHTML = '';

    for (let i = 1; i <= CONFIG.TOTAL_NUMBERS; i++) {
        simBalls.push(new SimBall(i));
    }
}

/**
 * Resolve collisions between balls
 */
function resolveCollisions() {
    for (let i = 0; i < simBalls.length; i++) {
        for (let j = i + 1; j < simBalls.length; j++) {
            const b1 = simBalls[i];
            const b2 = simBalls[j];

            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < b1.radius + b2.radius) {
                const angle = Math.atan2(dy, dx);
                const sin = Math.sin(angle);
                const cos = Math.cos(angle);

                const vx1 = b1.vx * cos + b1.vy * sin;
                const vy1 = b1.vy * cos - b1.vx * sin;
                const vx2 = b2.vx * cos + b2.vy * sin;
                const vy2 = b2.vy * cos - b2.vx * sin;

                const vx1Final = ((b1.mass - b2.mass) * vx1 + 2 * b2.mass * vx2) / (b1.mass + b2.mass);
                const vx2Final = ((b2.mass - b1.mass) * vx2 + 2 * b1.mass * vx1) / (b1.mass + b2.mass);

                b1.vx = vx1Final * cos - vy1 * sin;
                b1.vy = vy1 * cos + vx1Final * sin;
                b2.vx = vx2Final * cos - vy2 * sin;
                b2.vy = vy2 * cos + vx2Final * sin;

                const overlap = (b1.radius + b2.radius - distance) / 2;
                b1.x -= overlap * cos;
                b1.y -= overlap * sin;
                b2.x += overlap * cos;
                b2.y += overlap * sin;
            }
        }
    }
}

/**
 * Draw the lottery machine
 */
function drawMachine() {
    if (!simCtx) return;

    // Support Stand (Legs)
    simCtx.fillStyle = '#dfe6e9';
    simCtx.fillRect(drumCenter.x - 100, drumCenter.y + drumRadius, 20, 150);
    simCtx.fillRect(drumCenter.x + 80, drumCenter.y + drumRadius, 20, 150);
    simCtx.fillStyle = '#b2bec3';
    simCtx.fillRect(drumCenter.x - 90, drumCenter.y + drumRadius, 5, 150); // Shading
    simCtx.fillRect(drumCenter.x + 90, drumCenter.y + drumRadius, 5, 150); // Shading

    // Top Funnel (White Structure)
    simCtx.beginPath();
    simCtx.moveTo(drumCenter.x - 40, drumCenter.y - drumRadius - 60);
    simCtx.lineTo(drumCenter.x + 40, drumCenter.y - drumRadius - 60);
    simCtx.lineTo(drumCenter.x + 20, drumCenter.y - drumRadius + 10);
    simCtx.lineTo(drumCenter.x - 20, drumCenter.y - drumRadius + 10);
    simCtx.fillStyle = '#f1f2f6';
    simCtx.fill();
    simCtx.strokeStyle = '#b2bec3';
    simCtx.lineWidth = 2;
    simCtx.stroke();

    // Wide Outer Ring (Clear Disk)
    simCtx.beginPath();
    simCtx.arc(drumCenter.x, drumCenter.y, drumRadius + 40, 0, Math.PI * 2);
    simCtx.arc(drumCenter.x, drumCenter.y, drumRadius, 0, Math.PI * 2, true);
    simCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    simCtx.fill();
    simCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    simCtx.lineWidth = 1;
    simCtx.stroke();

    // Bolts on Wide Ring
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i;
        const bx = drumCenter.x + Math.cos(angle) * (drumRadius + 35);
        const by = drumCenter.y + Math.sin(angle) * (drumRadius + 35);
        simCtx.beginPath();
        simCtx.arc(bx, by, 4, 0, Math.PI * 2);
        simCtx.fillStyle = '#b2bec3';
        simCtx.fill();
        simCtx.strokeStyle = '#636e72';
        simCtx.lineWidth = 1;
        simCtx.stroke();
    }

    // Draw Drum Glass Background
    simCtx.beginPath();
    simCtx.arc(drumCenter.x, drumCenter.y, drumRadius, 0, Math.PI * 2);
    simCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    simCtx.fill();

    // Shine/Reflection (Enhanced)
    simCtx.beginPath();
    simCtx.arc(drumCenter.x - 50, drumCenter.y - 50, drumRadius * 0.8, Math.PI, 1.5 * Math.PI);
    simCtx.lineWidth = 8;
    simCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    simCtx.stroke();

    simCtx.beginPath();
    simCtx.arc(drumCenter.x + 60, drumCenter.y + 60, drumRadius * 0.7, 0, 0.5 * Math.PI);
    simCtx.lineWidth = 5;
    simCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    simCtx.stroke();

    // Central Column (Hub)
    simCtx.beginPath();
    simCtx.arc(drumCenter.x, drumCenter.y, 30, 0, Math.PI * 2);
    const hubGrad = simCtx.createRadialGradient(drumCenter.x, drumCenter.y, 5, drumCenter.x, drumCenter.y, 30);
    hubGrad.addColorStop(0, '#b2bec3');
    hubGrad.addColorStop(1, '#636e72');
    simCtx.fillStyle = hubGrad;
    simCtx.fill();
    simCtx.strokeStyle = '#2d3436';
    simCtx.lineWidth = 2;
    simCtx.stroke();

    // Suction Zone (Top Center)
    simCtx.beginPath();
    simCtx.arc(drumCenter.x, drumCenter.y - drumRadius + 20, suctionRadius, 0, Math.PI * 2);
    simCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    simCtx.fill();
    simCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    simCtx.lineWidth = 2;
    simCtx.stroke();

    // Output Tray (Zigzag)
    simCtx.beginPath();
    simCtx.moveTo(drumCenter.x, drumCenter.y + drumRadius + 20);
    simCtx.lineTo(drumCenter.x + 150, drumCenter.y + drumRadius + 40);
    simCtx.lineTo(drumCenter.x + 20, drumCenter.y + drumRadius + 80);
    simCtx.lineWidth = 15;
    simCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    simCtx.lineCap = 'round';
    simCtx.lineJoin = 'round';
    simCtx.stroke();
}

/**
 * Draw the air pressure gauge
 * @param {number} value - Current turbulence value
 */
function drawGauge(value) {
    if (!simCtx) return;

    const x = 60;
    const y = 340;
    const r = 40;

    // Gauge Background
    simCtx.beginPath();
    simCtx.arc(x, y, r, 0.8 * Math.PI, 2.2 * Math.PI);
    simCtx.lineWidth = 5;
    simCtx.strokeStyle = '#b2bec3';
    simCtx.stroke();

    // Gauge Arc (Active)
    const maxVal = 20;
    const percent = value / maxVal;
    const startAngle = 0.8 * Math.PI;
    const endAngle = 2.2 * Math.PI;
    const currentAngle = startAngle + (endAngle - startAngle) * percent;

    simCtx.beginPath();
    simCtx.arc(x, y, r, startAngle, currentAngle);
    simCtx.lineWidth = 5;
    simCtx.strokeStyle = percent > 0.7 ? '#e17055' : '#0984e3'; // Red if high
    simCtx.stroke();

    // Needle
    simCtx.beginPath();
    simCtx.moveTo(x, y);
    simCtx.lineTo(x + Math.cos(currentAngle) * (r - 5), y + Math.sin(currentAngle) * (r - 5));
    simCtx.lineWidth = 2;
    simCtx.strokeStyle = '#d63031';
    simCtx.stroke();

    // Center Dot
    simCtx.beginPath();
    simCtx.arc(x, y, 3, 0, Math.PI * 2);
    simCtx.fillStyle = '#2d3436';
    simCtx.fill();

    // Label
    simCtx.fillStyle = '#dfe6e9';
    simCtx.font = '10px Arial';
    simCtx.textAlign = 'center';
    simCtx.fillText("AIR PRESSURE", x, y + 20);
}

/**
 * Main animation loop for the simulation
 * @param {number} timestamp - Current animation timestamp
 */
function animateSimulation(timestamp) {
    if (!simRunning) return;

    const simResults = document.getElementById('sim-results');
    const turbulenceSlider = document.getElementById('turbulence-slider');
    const gravitySlider = document.getElementById('gravity-slider');
    const sizeSlider = document.getElementById('size-slider');
    const intervalInput = document.getElementById('interval-input');
    const simStartBtn = document.getElementById('sim-start-btn');

    simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);

    drawMachine();

    // Get Turbulence Value
    let turbulence = 5;
    if (turbulenceSlider) {
        turbulence = parseInt(turbulenceSlider.value);
    }

    // Get Gravity Value
    let gravity = 0.3;
    if (gravitySlider) {
        gravity = parseInt(gravitySlider.value) * 0.1;
    }

    // Get Ball Size
    let ballSize = 10;
    if (sizeSlider) {
        ballSize = parseInt(sizeSlider.value);
    }

    drawGauge(turbulence);

    // Update and Draw Physics Balls
    simBalls.forEach(ball => {
        ball.radius = ballSize;
        ball.update(turbulence, gravity);
        ball.draw();
    });

    resolveCollisions();

    // Extraction Logic (Air Suction with Interval)
    if (simSelected.length < CONFIG.TOTAL_DRAW_COUNT) {
        // Check Interval
        let interval = CONFIG.SIM_EXTRACTION_INTERVAL;
        if (intervalInput) {
            interval = parseFloat(intervalInput.value) * 1000;
        }

        if (!lastExtractionTime || timestamp - lastExtractionTime >= interval) {
            // Check if any ball is near the top center suction zone
            for (let i = 0; i < simBalls.length; i++) {
                const b = simBalls[i];
                // Suction Zone: Top center, within radius
                const dx = b.x - drumCenter.x;
                const dy = b.y - (drumCenter.y - drumRadius + 20);
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < suctionRadius) {
                    // Sucked up!
                    simSelected.push(b.id);
                    simBalls.splice(i, 1);
                    lastExtractionTime = timestamp; // Update timer

                    // Display selected ball
                    if (simSelected.length === CONFIG.TOTAL_DRAW_COUNT) {
                        // Bonus Ball Display
                        simResults.appendChild(createPlusSign());
                    }

                    const ballDiv = createBallElement(b.id, simSelected.length === CONFIG.TOTAL_DRAW_COUNT);
                    simResults.appendChild(ballDiv);
                    
                    if (typeof playPopSound === 'function') {
                        playPopSound();
                    }

                    if (simSelected.length === CONFIG.TOTAL_DRAW_COUNT) {
                        // Sort first 6, keep 7th as bonus
                        const main = simSelected.slice(0, CONFIG.MAIN_NUMBERS_COUNT).sort((a, b) => a - b);
                        const bonus = simSelected[CONFIG.MAIN_NUMBERS_COUNT];
                        const finalResult = [...main, bonus];

                        if (typeof addToHistory === 'function') {
                            addToHistory(finalResult, 'Mechanical Sim', 'Physics');
                        }
                        if (simStartBtn) simStartBtn.disabled = false;
                        simRunning = false;
                    }
                    break; // One ball at a time
                }
            }
        }
    }

    animationId = requestAnimationFrame(animateSimulation);
}

/**
 * Initialize simulation canvas and controls
 */
function initSimulationCanvas() {
    simCanvas = document.getElementById('simCanvas');
    const simStartBtn = document.getElementById('sim-start-btn');

    if (simCanvas) {
        simCtx = simCanvas.getContext('2d');
        simCanvas.width = CONFIG.SIM_CANVAS_WIDTH;
        simCanvas.height = CONFIG.SIM_CANVAS_HEIGHT;
        drumCenter = { x: simCanvas.width / 2, y: simCanvas.height / 2 };
    }

    if (simStartBtn) {
        simStartBtn.addEventListener('click', () => {
            if (simRunning) return;
            simRunning = true;
            simStartBtn.disabled = true;
            initSimulation();
            requestAnimationFrame(animateSimulation);
        });
    }
}

// Make simulation functions available globally
window.SimBall = SimBall;
window.initSimulation = initSimulation;
window.resolveCollisions = resolveCollisions;
window.drawMachine = drawMachine;
window.drawGauge = drawGauge;
window.animateSimulation = animateSimulation;
window.initSimulationCanvas = initSimulationCanvas;

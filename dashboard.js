/* Stackly - Core Application Interactivity & Data Rendering Script */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Sidebar Toggle Drawer
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  
  if (sidebar && sidebarToggle) {
    sidebarToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('mobile-open');
    });

    // Close sidebar if clicking outside
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('mobile-open') && !sidebar.contains(e.target) && e.target !== sidebarToggle) {
        sidebar.classList.remove('mobile-open');
      }
    });
  }

  // 2. Light/Dark Theme Controller
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    // Check local storage for initial theme
    const savedTheme = localStorage.getItem('stackly-theme') || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    }

    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
      localStorage.setItem('stackly-theme', currentTheme);
      
      // Re-trigger chart rendering to adjust fill opacity or grid lines if needed
      initCharts();
    });
  }

  // 3. Energy Canvas Fallback Animation (For Login/SignUp video overlay/fallback)
  initEnergyCanvas();

  // 4. Initialize Interactive Charts
  initCharts();

  // 5. Initialize Page-Specific Simulators
  initSimulators();

  // 6. Live Value Pulser (Simulating continuous energy generation changes)
  initLiveTelemetry();

  // 7. Handle Logout / Disconnect Node
  const logoutBtns = document.querySelectorAll('.logout-btn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('stackly-email');
      localStorage.removeItem('stackly-role');
      localStorage.removeItem('stackly-name');
      window.location.href = 'index.html';
    });
  });
});

/* Telemetry Generator for dynamic visual feel */
function initLiveTelemetry() {
  const telemetryElements = document.querySelectorAll('[data-live-telemetry]');
  if (telemetryElements.length === 0) return;

  setInterval(() => {
    telemetryElements.forEach(el => {
      const type = el.getAttribute('data-live-telemetry');
      let currentVal = parseFloat(el.textContent);
      
      if (isNaN(currentVal)) return;

      let variance = 0;
      let suffix = '';

      if (type === 'solar') {
        variance = (Math.random() - 0.48) * 0.15; // slight upward bias
        currentVal = Math.max(0, currentVal + variance);
        suffix = ' kW';
        el.textContent = currentVal.toFixed(2) + suffix;
      } else if (type === 'wind') {
        variance = (Math.random() - 0.5) * 0.25;
        currentVal = Math.max(1.2, currentVal + variance);
        suffix = ' kW';
        el.textContent = currentVal.toFixed(2) + suffix;
      } else if (type === 'efficiency') {
        variance = (Math.random() - 0.5) * 0.05;
        currentVal = Math.max(85, Math.min(99.9, currentVal + variance));
        suffix = '%';
        el.textContent = currentVal.toFixed(1) + suffix;
      } else if (type === 'total') {
        variance = (Math.random() - 0.45) * 0.3; // upward shift
        currentVal = Math.max(10, currentVal + variance);
        suffix = ' kW';
        el.textContent = currentVal.toFixed(2) + suffix;
        
        // Also update generation indicator in header topnav if it exists
        const indicator = document.getElementById('live-grid-generation');
        if (indicator) {
          indicator.textContent = currentVal.toFixed(2) + ' kW';
        }
      }
    });
  }, 3000);
}

/* Canvas particle energy flow */
function initEnergyCanvas() {
  const canvas = document.getElementById('energy-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationId;
  let width = (canvas.width = canvas.offsetWidth);
  let height = (canvas.height = canvas.offsetHeight);

  window.addEventListener('resize', () => {
    if (canvas) {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }
  });

  const particles = [];
  const particleCount = Math.min(60, Math.floor(width / 20));

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() * 0.8 + 0.2) * 1.5; // flow rightward
      this.vy = (Math.random() * 0.4 - 0.2) * 1.5;
      this.radius = Math.random() * 2.5 + 0.5;
      this.color = Math.random() > 0.4 ? '#00ff88' : '#00e1ff';
      this.alpha = Math.random() * 0.5 + 0.1;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      
      // Fade out near edges
      if (this.x > width || this.y < 0 || this.y > height) {
        this.reset();
        this.x = 0; // wrap to left
      }
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Draw connections briefly
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.03)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    animationId = requestAnimationFrame(animate);
  }

  animate();
}

/* Charts Generator */
function initCharts() {
  // Renders both line chart and battery rings if present on the page
  const lineChart = document.getElementById('svg-generation-line-chart');
  if (lineChart) {
    renderGenerationLineChart(lineChart);
  }

  const batteryRing = document.getElementById('solar-battery-ring');
  if (batteryRing) {
    renderRadialStorageRing(batteryRing, 84); // 84% mock storage
  }

  const savingsChart = document.getElementById('svg-savings-bar-chart');
  if (savingsChart) {
    renderSavingsBarChart(savingsChart);
  }
}

/* Render Custom Generation Line Chart */
function renderGenerationLineChart(svg) {
  // Let's create beautiful animated path points
  const points = [
    { x: 50, y: 170, label: '08:00', solar: 1.2, wind: 3.5 },
    { x: 120, y: 130, label: '10:00', solar: 3.8, wind: 2.9 },
    { x: 190, y: 70, label: '12:00', solar: 6.5, wind: 2.1 },
    { x: 260, y: 90, label: '14:00', solar: 5.9, wind: 2.8 },
    { x: 330, y: 120, label: '16:00', solar: 4.2, wind: 4.2 },
    { x: 400, y: 150, label: '18:00', solar: 1.8, wind: 5.1 },
    { x: 470, y: 180, label: '20:00', solar: 0.2, wind: 6.2 }
  ];

  let pathPrimary = '';
  let pathSecondary = '';
  let areaPrimary = 'M 50 200 ';
  let areaSecondary = 'M 50 200 ';

  points.forEach((p, idx) => {
    // Map solar to primary line (y=200 is 0 kW, y=40 is 8 kW)
    // Formula: yCoord = 200 - (val / 8.0) * 160
    const solarY = 200 - (p.solar / 8.0) * 160;
    const windY = 200 - (p.wind / 8.0) * 160;

    if (idx === 0) {
      pathPrimary += `M ${p.x} ${solarY} `;
      pathSecondary += `M ${p.x} ${windY} `;
    } else {
      // Create smooth curve using Bezier
      const prev = points[idx - 1];
      const prevSolarY = 200 - (prev.solar / 8.0) * 160;
      const prevWindY = 200 - (prev.wind / 8.0) * 160;
      const cpX1 = prev.x + (p.x - prev.x) / 2;
      const cpY1_solar = prevSolarY;
      const cpX2 = prev.x + (p.x - prev.x) / 2;
      const cpY2_solar = solarY;

      pathPrimary += `C ${cpX1} ${cpY1_solar}, ${cpX2} ${cpY2_solar}, ${p.x} ${solarY} `;
      
      const cpY1_wind = prevWindY;
      const cpY2_wind = windY;
      pathSecondary += `C ${cpX1} ${cpY1_wind}, ${cpX2} ${cpY2_wind}, ${p.x} ${windY} `;
    }

    areaPrimary += `L ${p.x} ${solarY} `;
    areaSecondary += `L ${p.x} ${windY} `;
  });

  areaPrimary += `L 470 200 Z`;
  areaSecondary += `L 470 200 Z`;

  // Write elements into SVG
  let svgContent = `
    <defs>
      <linearGradient id="chart-gradient-primary" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="chart-gradient-secondary" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--secondary)" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="var(--secondary)" stop-opacity="0"/>
      </linearGradient>
    </defs>
    
    <!-- Grid lines -->
    <line x1="50" y1="40" x2="480" y2="40" class="svg-grid-line" />
    <line x1="50" y1="80" x2="480" y2="80" class="svg-grid-line" />
    <line x1="50" y1="120" x2="480" y2="120" class="svg-grid-line" />
    <line x1="50" y1="160" x2="480" y2="160" class="svg-grid-line" />
    <line x1="50" y1="200" x2="480" y2="200" class="svg-grid-line" style="stroke: var(--border-color);" />
    
    <!-- Y Axis Text -->
    <text x="25" y="44" class="svg-axis-text">8 kW</text>
    <text x="25" y="84" class="svg-axis-text">6 kW</text>
    <text x="25" y="124" class="svg-axis-text">4 kW</text>
    <text x="25" y="164" class="svg-axis-text">2 kW</text>
    <text x="25" y="204" class="svg-axis-text">0 kW</text>
  `;

  // Draw lines
  svgContent += `
    <path d="${areaPrimary}" class="svg-area-primary" />
    <path d="${pathPrimary}" class="svg-line-primary" />
    
    <path d="${areaSecondary}" class="svg-area-secondary" />
    <path d="${pathSecondary}" class="svg-line-secondary" />
  `;

  // Draw interactive dots and X labels
  points.forEach(p => {
    const solarY = 200 - (p.solar / 8.0) * 160;
    const windY = 200 - (p.wind / 8.0) * 160;

    svgContent += `
      <!-- X Label -->
      <text x="${p.x}" y="220" class="svg-axis-text" text-anchor="middle">${p.label}</text>
      
      <!-- Dots -->
      <circle cx="${p.x}" cy="${solarY}" r="4.5" class="chart-dot primary" data-val="${p.solar} kW Solar" />
      <circle cx="${p.x}" cy="${windY}" r="4.5" class="chart-dot secondary" data-val="${p.wind} kW Wind" />
    `;
  });

  svg.innerHTML = svgContent;

  // Set up dynamic tooltips
  const dots = svg.querySelectorAll('.chart-dot');
  const tooltip = document.createElement('div');
  tooltip.className = 'chart-tooltip';
  svg.parentNode.appendChild(tooltip);

  dots.forEach(dot => {
    dot.addEventListener('mouseenter', (e) => {
      const val = dot.getAttribute('data-val');
      const x = dot.getAttribute('cx');
      const y = dot.getAttribute('cy');
      
      tooltip.textContent = val;
      tooltip.style.left = `${parseFloat(x) - 10}px`;
      tooltip.style.top = `${parseFloat(y) - 35}px`;
      tooltip.style.opacity = '1';
    });
    
    dot.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
  });
}

/* Render Radial Solar Battery Storage Dial */
function renderRadialStorageRing(svg, percentage) {
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  const fillOffset = circ - (percentage / 100) * circ;

  svg.innerHTML = `
    <circle cx="60" cy="60" r="${radius}" class="radial-bg" />
    <circle cx="60" cy="60" r="${radius}" class="radial-fill secondary" 
            stroke-dasharray="${circ}" 
            stroke-dashoffset="${fillOffset}" />
  `;
}

/* Render Savings Bar Chart */
function renderSavingsBarChart(svg) {
  const data = [
    { label: 'Jan', val: 45 },
    { label: 'Feb', val: 62 },
    { label: 'Mar', val: 78 },
    { label: 'Apr', val: 92 },
    { label: 'May', val: 110 },
    { label: 'Jun', val: 135 }
  ];

  // Map to height of 160 (y=40 is 150$, y=200 is 0$)
  // barWidth = 40, spacing = 35
  let svgContent = `
    <!-- Grid lines -->
    <line x1="50" y1="40" x2="480" y2="40" class="svg-grid-line" />
    <line x1="50" y1="80" x2="480" y2="80" class="svg-grid-line" />
    <line x1="50" y1="120" x2="480" y2="120" class="svg-grid-line" />
    <line x1="50" y1="160" x2="480" y2="160" class="svg-grid-line" />
    <line x1="50" y1="200" x2="480" y2="200" class="svg-grid-line" style="stroke: var(--border-color);" />
    
    <!-- Y Axis Labels -->
    <text x="20" y="44" class="svg-axis-text">$150</text>
    <text x="20" y="84" class="svg-axis-text">$120</text>
    <text x="20" y="124" class="svg-axis-text">$90</text>
    <text x="20" y="164" class="svg-axis-text">$60</text>
    <text x="20" y="204" class="svg-axis-text">$0</text>
  `;

  const barWidth = 32;
  const startX = 75;
  const spacing = 65;

  data.forEach((d, idx) => {
    const xCoord = startX + idx * spacing;
    // Map value to coordinate
    const barHeight = (d.val / 150.0) * 160;
    const yCoord = 200 - barHeight;

    svgContent += `
      <!-- Bar -->
      <rect x="${xCoord}" y="${yCoord}" width="${barWidth}" height="${barHeight}" rx="6" 
            fill="url(#bar-gradient-${idx})" style="transition: var(--transition); cursor: pointer;" 
            data-val="$${d.val} Saved" class="chart-bar" />
            
      <!-- Label -->
      <text x="${xCoord + barWidth / 2}" y="220" class="svg-axis-text" text-anchor="middle">${d.label}</text>
      
      <!-- Gradient for Bar -->
      <defs>
        <linearGradient id="bar-gradient-${idx}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--primary)"/>
          <stop offset="100%" stop-color="var(--secondary)" stop-opacity="0.3"/>
        </linearGradient>
      </defs>
    `;
  });

  svg.innerHTML = svgContent;

  // Bar chart tooltip setup
  const bars = svg.querySelectorAll('.chart-bar');
  const tooltip = document.createElement('div');
  tooltip.className = 'chart-tooltip';
  svg.parentNode.appendChild(tooltip);

  bars.forEach(bar => {
    bar.addEventListener('mouseenter', (e) => {
      const val = bar.getAttribute('data-val');
      const x = bar.getAttribute('x');
      const y = bar.getAttribute('y');
      
      tooltip.textContent = val;
      tooltip.style.left = `${parseFloat(x) - 10}px`;
      tooltip.style.top = `${parseFloat(y) - 35}px`;
      tooltip.style.opacity = '1';
      bar.style.filter = 'brightness(1.2) drop-shadow(0 0 6px var(--primary-glow))';
    });
    
    bar.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
      bar.style.filter = 'none';
    });
  });
}

/* Interactive Simulators */
function initSimulators() {
  // Solar Dashboard simulator (Adjust panel tilt angle)
  const angleSlider = document.getElementById('solar-angle-slider');
  const angleValue = document.getElementById('solar-angle-value');
  const yieldValue = document.getElementById('solar-yield-value');
  const solarSunRay = document.getElementById('solar-visual-ray');

  if (angleSlider && angleValue && yieldValue) {
    angleSlider.addEventListener('input', (e) => {
      const angle = parseInt(e.target.value);
      angleValue.textContent = angle + '°';

      // Optimal angle is around 35 degrees for yield calculation
      const difference = Math.abs(angle - 35);
      const baseYield = 6.48; // max yield
      const currentYield = Math.max(0.5, baseYield - (difference * 0.08));

      yieldValue.textContent = currentYield.toFixed(2) + ' kW';
      
      // Update interactive solar yield element if it exists in dashboard
      const dashboardSolarVal = document.getElementById('telemetry-solar-val');
      if (dashboardSolarVal) {
        dashboardSolarVal.textContent = currentYield.toFixed(2) + ' kW';
      }

      // Rotate simulated solar panel graphic in UI
      const panelGraphic = document.getElementById('simulated-panel');
      if (panelGraphic) {
        panelGraphic.style.transform = `rotate(${angle - 30}deg)`;
      }

      // Adjust opacity of solar ray representing intensity
      if (solarSunRay) {
        const opacity = Math.max(0.1, 1 - (difference / 60));
        solarSunRay.style.opacity = opacity;
      }
    });
  }

  // Wind Dashboard simulator (Adjust wind turbine windspeed)
  const windSlider = document.getElementById('wind-speed-slider');
  const windValue = document.getElementById('wind-speed-value');
  const windYieldValue = document.getElementById('wind-yield-value');

  if (windSlider && windValue && windYieldValue) {
    windSlider.addEventListener('input', (e) => {
      const windSpeed = parseFloat(e.target.value);
      windValue.textContent = windSpeed.toFixed(1) + ' m/s';

      // Power curves: below 3 m/s is 0. Cut-out at 25 m/s. Optimal around 12-15 m/s.
      let currentYield = 0;
      let rotorClass = 'spin-slow';

      if (windSpeed >= 3 && windSpeed <= 25) {
        currentYield = Math.pow(windSpeed - 3, 1.4) * 0.25;
        
        // Speed class mapping for CSS animation rotation
        if (windSpeed < 6) {
          rotorClass = 'spin-slow';
        } else if (windSpeed < 12) {
          // Add custom override logic or directly modify animation speed via script
          rotorClass = 'spin-medium';
        } else {
          // Fast spinning
          rotorClass = 'spin-fast';
        }
      }

      windYieldValue.textContent = currentYield.toFixed(2) + ' kW';

      // Update interactive wind yield telemetry if it exists in dashboard
      const dashboardWindVal = document.getElementById('telemetry-wind-val');
      if (dashboardWindVal) {
        dashboardWindVal.textContent = currentYield.toFixed(2) + ' kW';
      }

      // Adjust animation speed on turbine visual
      const turbineBlades = document.querySelectorAll('.turbine-blade-group');
      turbineBlades.forEach(blade => {
        // Clear speed classes first
        blade.classList.remove('spin-slow', 'spin-medium', 'spin-fast');
        
        // Directly inject duration for finer control
        if (currentYield === 0) {
          blade.style.animation = 'none';
        } else {
          const duration = Math.max(0.4, 15 / windSpeed); // faster speed = shorter duration
          blade.style.animation = `spin ${duration}s linear infinite`;
        }
      });
    });
  }
}

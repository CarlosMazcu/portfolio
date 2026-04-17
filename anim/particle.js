(() => {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileQuery = window.matchMedia("(max-width: 768px)");

  const pointerTarget = { x: 0.5, y: 0.5, active: false };
  const pointer = { x: 0.5, y: 0.5 };
  const pointerScreen = { x: 0, y: 0, active: false };

  let rafId = 0;
  let running = false;
  let startTime = 0;
  let webglState = null;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function setPointer(clientX, clientY) {
    const viewW = Math.max(window.innerWidth, 1);
    const viewH = Math.max(window.innerHeight, 1);
    pointerTarget.x = clamp(clientX / viewW, 0, 1);
    pointerTarget.y = clamp(1 - clientY / viewH, 0, 1);
    pointerScreen.x = clientX;
    pointerScreen.y = clientY;
    pointerTarget.active = true;
    pointerScreen.active = true;
  }

  function clearPointer() {
    pointerTarget.active = false;
    pointerScreen.active = false;
  }

  window.addEventListener("mousemove", (event) => {
    setPointer(event.clientX, event.clientY);
  });

  window.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      setPointer(touch.clientX, touch.clientY);
    },
    { passive: true },
  );

  window.addEventListener("touchend", clearPointer, { passive: true });
  window.addEventListener("touchcancel", clearPointer, { passive: true });
  document.addEventListener("mouseleave", clearPointer);

  function resizeCanvas() {
    const isMobile = mobileQuery.matches;
    const dprCap = isMobile ? 1.2 : 1.5;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const renderScale = isMobile ? 0.94 : 1;
    const width = Math.max(320, Math.floor(window.innerWidth * dpr * renderScale));
    const height = Math.max(240, Math.floor(window.innerHeight * dpr * renderScale));

    canvas.style.width = "100%";
    canvas.style.height = "100%";

    if (canvas.width === width && canvas.height === height) return;

    canvas.width = width;
    canvas.height = height;

    if (webglState?.gl) webglState.gl.viewport(0, 0, width, height);
  }

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.warn("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      return null;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
    console.warn("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  function startWebGLShaderAnimation() {
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) return false;

    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;

      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;

      varying vec2 v_uv;

      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_intensity;

      float hash11(float p) {
        return fract(sin(p * 127.1) * 43758.5453123);
      }

      vec2 hash21(float p) {
        return fract(sin(vec2(p * 127.1, p * 311.7)) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);

        float a = hash11(dot(i, vec2(1.0, 57.0)));
        float b = hash11(dot(i + vec2(1.0, 0.0), vec2(1.0, 57.0)));
        float c = hash11(dot(i + vec2(0.0, 1.0), vec2(1.0, 57.0)));
        float d = hash11(dot(i + vec2(1.0, 1.0), vec2(1.0, 57.0)));

        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amp = 0.5;
        mat2 m = mat2(1.7, 1.2, -1.2, 1.7);

        for (int i = 0; i < 4; i++) {
          value += amp * noise(p);
          p = m * p;
          amp *= 0.5;
        }
        return value;
      }

      float gridMask(vec2 p, float scale, float thickness) {
        vec2 gv = abs(fract(p * scale) - 0.5);
        float line = min(gv.x, gv.y);
        return 1.0 - smoothstep(0.0, thickness, line);
      }

      float segmentGlow(vec2 p, vec2 a, vec2 b, float radius) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        float denom = max(dot(ba, ba), 0.0001);
        float h = clamp(dot(pa, ba) / denom, 0.0, 1.0);
        float d = length(pa - ba * h);
        float n = d / max(radius, 0.0001);
        return exp(-pow(n, 1.45) * 4.4);
      }

      void main() {
        vec2 uv = v_uv;
        vec2 p = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
        p.x *= u_resolution.x / u_resolution.y;

        vec2 m = u_mouse * 2.0 - 1.0;
        m.x *= u_resolution.x / u_resolution.y;

        float t = u_time * 0.92;

        vec2 flow = vec2(
          fbm(p * 2.0 + vec2(0.0, t * 0.14)),
          fbm(p * 2.0 + vec2(4.1, -t * 0.11))
        ) - 0.5;

        vec2 q = p + flow * (0.18 * u_intensity);
        q += (m - q) * 0.035 * u_intensity;

        float n = fbm(q * 1.85 + vec2(1.2, t * 0.06));

        vec3 color = mix(vec3(0.035, 0.055, 0.115), vec3(0.075, 0.11, 0.22), uv.y);
        color += vec3(0.02, 0.05, 0.11) * (0.45 + 0.55 * n);

        float minorGrid = gridMask(q + vec2(0.0, t * 0.028), 13.5, 0.035);
        float majorGrid = gridMask(q + vec2(0.0, t * 0.014), 4.0, 0.02);
        color += vec3(0.1, 0.24, 0.48) * minorGrid * 0.16 * u_intensity;
        color += vec3(0.2, 0.42, 0.86) * majorGrid * 0.2 * u_intensity;

        float md = length(q - m * 0.35);
        float ringA = (sin(md * 42.0 - t * 3.2) * 0.5 + 0.5) * exp(-md * 3.7);
        float ringB = (sin(md * 18.0 + t * 1.6) * 0.5 + 0.5) * exp(-md * 1.9);
        color += vec3(0.36, 0.78, 1.0) * ringA * 0.34 * u_intensity;
        color += vec3(0.68, 0.46, 1.0) * ringB * 0.16 * u_intensity;

        vec3 network = vec3(0.0);
        float bloom = 0.0;
        vec2 prevNode = vec2(0.0);
        vec2 firstNode = vec2(0.0);

        for (int i = 0; i < 12; i++) {
          float fi = float(i);
          vec2 rnd = hash21(fi * 17.3 + 1.7);
          float speed = mix(0.22, 0.86, rnd.x);
          float radius = mix(0.28, 1.08, rnd.y);

          vec2 center = vec2(
            sin(t * speed + fi * 1.13 + rnd.y * 6.2831),
            cos(t * (speed * 0.83) + fi * 1.41 + rnd.x * 6.2831)
          ) * (radius * 0.62);

          center += m * 0.15 * u_intensity;

          float nodeGlow = exp(-pow(length(q - center) / 0.055, 1.35) * 4.7);
          vec3 nodeColor = mix(vec3(0.32, 0.95, 1.0), vec3(0.76, 0.45, 1.0), rnd.x);
          network += nodeColor * nodeGlow;
          bloom += nodeGlow;

          if (i == 0) {
            firstNode = center;
          } else {
            float edgeGlow = segmentGlow(q, prevNode, center, 0.024);
            vec3 edgeColor = mix(vec3(0.15, 0.48, 0.95), vec3(0.52, 0.35, 0.98), rnd.y);
            network += edgeColor * edgeGlow * 0.2;
          }

          prevNode = center;
        }

        float closingEdge = segmentGlow(q, prevNode, firstNode, 0.028);
        network += vec3(0.18, 0.44, 0.9) * closingEdge * 0.15;

        for (int i = 0; i < 6; i++) {
          float fi = float(i);
          float y = hash11(fi * 13.7 + 2.5) * 2.0 - 1.0;
          float wave = sin(t * 0.7 + fi) * 0.04;
          float sweep = fract(t * 0.09 + fi * 0.17);

          vec2 a = vec2(-1.5, y + wave);
          vec2 b = vec2(mix(-1.4, 1.4, sweep), y + wave);
          float trace = segmentGlow(q, a, b, 0.012);

          network += vec3(0.25, 0.9, 0.95) * trace * 0.12;
        }

        color += network * (0.52 + 0.34 * u_intensity);

        float focus = exp(-pow(length(q - m), 1.25) * 2.2);
        color += vec3(0.24, 0.46, 0.98) * focus * 0.22 * u_intensity;

        color += bloom * 0.006;

        float vignette = smoothstep(1.8, 0.28, length(p));
        color *= vignette + 0.22;

        float grain = fract(sin(dot(gl_FragCoord.xy + t, vec2(12.9898, 78.233))) * 43758.5453);
        color += (grain - 0.5) * 0.014;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) return false;

    const positionBuffer = gl.createBuffer();
    if (!positionBuffer) {
      gl.deleteProgram(program);
      return false;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const mouseLocation = gl.getUniformLocation(program, "u_mouse");
    const intensityLocation = gl.getUniformLocation(program, "u_intensity");

    if (
      positionLocation < 0 ||
      !resolutionLocation ||
      !timeLocation ||
      !mouseLocation ||
      !intensityLocation
    ) {
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      return false;
    }

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0, 0, 0, 0);

    webglState = {
      gl,
      program,
      uniforms: {
        resolution: resolutionLocation,
        time: timeLocation,
        mouse: mouseLocation,
        intensity: intensityLocation,
      },
    };

    resizeCanvas();
    return true;
  }

  function renderWebGL(now) {
    if (!webglState) return;
    if (!startTime) startTime = now;

    const gl = webglState.gl;
    const elapsed = (now - startTime) * 0.001;
    const targetX = pointerTarget.active ? pointerTarget.x : 0.5;
    const targetY = pointerTarget.active ? pointerTarget.y : 0.5;
    const smooth = pointerTarget.active ? 0.12 : 0.045;

    pointer.x += (targetX - pointer.x) * smooth;
    pointer.y += (targetY - pointer.y) * smooth;

    const baseIntensity = mobileQuery.matches ? 0.85 : 1;
    const intensity = reducedMotion.matches ? 0.38 : baseIntensity;
    const time = reducedMotion.matches ? 0 : elapsed;

    gl.useProgram(webglState.program);
    gl.uniform2f(webglState.uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(webglState.uniforms.time, time);
    gl.uniform2f(webglState.uniforms.mouse, pointer.x, pointer.y);
    gl.uniform1f(webglState.uniforms.intensity, intensity);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function webglFrame(now) {
    renderWebGL(now);
    if (!running) return;
    rafId = window.requestAnimationFrame(webglFrame);
  }

  function startWebGLLoop() {
    if (!webglState || running || reducedMotion.matches || document.hidden) return;
    running = true;
    rafId = window.requestAnimationFrame(webglFrame);
  }

  function stopWebGLLoop() {
    if (!running) return;
    running = false;
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function renderWebGLStatic() {
    renderWebGL(performance.now());
  }

  function startFallbackCanvasAnimation() {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let viewW = 0;
    let viewH = 0;
    let particles = [];
    let fallbackRaf = 0;
    let fallbackRunning = false;

    function resize2D() {
      viewW = Math.max(window.innerWidth, 320);
      viewH = Math.max(window.innerHeight, 240);
      const isMobile = mobileQuery.matches;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.5);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.width = Math.floor(viewW * dpr);
      canvas.height = Math.floor(viewH * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    function getCount() {
      const area = viewW * viewH;
      const baseDiv = reducedMotion.matches ? 17000 : 9800;
      const isMobile = mobileQuery.matches;
      const min = reducedMotion.matches ? 28 : isMobile ? 58 : 110;
      const max = reducedMotion.matches ? 95 : isMobile ? 180 : 320;
      const count = Math.round(area / baseDiv);
      return Math.max(min, Math.min(max, count));
    }

    class Dot {
      constructor() {
        this.reset(true);
      }

      reset(randomPos) {
        const isMobile = mobileQuery.matches;
        this.x = randomPos ? Math.random() * viewW : Math.random() < 0.5 ? 0 : viewW;
        this.y = randomPos ? Math.random() * viewH : Math.random() * viewH;
        this.radius = Math.random() * (isMobile ? 1.35 : 1.8) + 0.95;
        const velocity = isMobile ? 0.45 : 0.68;
        this.speedX = Math.random() * velocity - velocity / 2;
        this.speedY = Math.random() * velocity - velocity / 2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > viewW) this.speedX *= -1;
        if (this.y < 0 || this.y > viewH) this.speedY *= -1;

        if (pointerScreen.active) {
          const dx = pointerScreen.x - this.x;
          const dy = pointerScreen.y - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          const radius = mobileQuery.matches ? 90 : 130;
          if (dist < radius) {
            this.x -= dx / dist;
            this.y -= dy / dist;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.25, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(124, 107, 242, 0.16)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(133, 231, 255, 0.95)";
        ctx.fill();
      }
    }

    function buildParticles() {
      const count = getCount();
      particles = new Array(count);
      for (let i = 0; i < count; i++) particles[i] = new Dot();
    }

    function connect() {
      if (reducedMotion.matches) return;
      const isMobile = mobileQuery.matches;
      const threshold = isMobile ? 72 : 92;
      const maxLines = isMobile ? 340 : 900;
      const maxConnectionsPerDot = isMobile ? 2 : 3;
      let lines = 0;
      ctx.lineWidth = isMobile ? 0.85 : 1;

      for (let a = 0; a < particles.length; a++) {
        let connections = 0;
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distance = Math.hypot(dx, dy);
          if (distance >= threshold) continue;

          const alpha = (1 - distance / threshold) * 0.55;
          ctx.strokeStyle = `rgba(136, 201, 255, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();

          connections++;
          lines++;
          if (connections >= maxConnectionsPerDot || lines >= maxLines) break;
        }
        if (lines >= maxLines) break;
      }
    }

    function draw2D() {
      ctx.clearRect(0, 0, viewW, viewH);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      connect();
    }

    function tick2D() {
      draw2D();
      if (!fallbackRunning) return;
      fallbackRaf = requestAnimationFrame(tick2D);
    }

    function start2D() {
      if (fallbackRunning || document.hidden) return;
      if (reducedMotion.matches) {
        draw2D();
        return;
      }
      fallbackRunning = true;
      fallbackRaf = requestAnimationFrame(tick2D);
    }

    function stop2D() {
      if (!fallbackRunning) return;
      fallbackRunning = false;
      cancelAnimationFrame(fallbackRaf);
      fallbackRaf = 0;
    }

    resize2D();
    buildParticles();
    start2D();

    window.addEventListener("resize", () => {
      resize2D();
      buildParticles();
      if (reducedMotion.matches) draw2D();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stop2D();
      } else {
        start2D();
      }
    });

    reducedMotion.addEventListener?.("change", () => {
      buildParticles();
      if (reducedMotion.matches) {
        stop2D();
        draw2D();
      } else {
        start2D();
      }
    });
  }

  const webglReady = startWebGLShaderAnimation();

  if (!webglReady) {
    console.warn("WebGL unavailable for background shader. Falling back to canvas particles.");
    startFallbackCanvasAnimation();
    return;
  }

  if (reducedMotion.matches) {
    renderWebGLStatic();
  } else {
    startWebGLLoop();
  }

  window.addEventListener("resize", () => {
    resizeCanvas();
    if (reducedMotion.matches) renderWebGLStatic();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopWebGLLoop();
    } else if (reducedMotion.matches) {
      renderWebGLStatic();
    } else {
      startWebGLLoop();
    }
  });

  reducedMotion.addEventListener?.("change", () => {
    if (reducedMotion.matches) {
      stopWebGLLoop();
      renderWebGLStatic();
    } else {
      startTime = 0;
      startWebGLLoop();
    }
  });
})();

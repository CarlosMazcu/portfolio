/* Carlos Mazcuñán — portfolio. Small, dependency-free progressive enhancement. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* ignore */ } },
  };

  /* ---------- Theme toggle ---------- */
  function initTheme() {
    const button = document.querySelector('.theme-toggle');
    if (!button) return;
    const labels = {
      dark: button.dataset.labelLight || 'Switch to light theme',
      light: button.dataset.labelDark || 'Switch to dark theme',
    };
    const sync = () => {
      const theme = root.dataset.theme === 'light' ? 'light' : 'dark';
      button.setAttribute('aria-label', labels[theme]);
      button.setAttribute('aria-pressed', String(theme === 'light'));
    };
    button.addEventListener('click', () => {
      const next = root.dataset.theme === 'light' ? 'dark' : 'light';
      root.dataset.theme = next;
      store.set('theme', next);
      sync();
    });
    sync();
  }

  /* ---------- Active section in the header ---------- */
  function initActiveNav() {
    const links = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
    const sections = links
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) return;

    const visible = new Map();
    const update = () => {
      let current = null;
      for (const section of sections) {
        if (visible.get(section)) { current = section; break; }
      }
      links.forEach((link) => {
        const on = current && link.getAttribute('href') === `#${current.id}`;
        if (on) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visible.set(entry.target, entry.isIntersecting));
      update();
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach((section) => observer.observe(section));
  }

  /* ---------- Looping media: play only when on screen, never with reduced motion ---------- */
  function initVideos() {
    const videos = Array.from(document.querySelectorAll('video[data-loop]'));
    if (!videos.length) return;

    const pauseAll = () => videos.forEach((v) => v.pause());
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      pauseAll();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting && !reduceMotion.matches) {
          const p = target.play();
          if (p && p.catch) p.catch(() => {});
        } else {
          target.pause();
        }
      });
    }, { threshold: 0.25 });

    videos.forEach((v) => observer.observe(v));
    reduceMotion.addEventListener?.('change', (e) => { if (e.matches) pauseAll(); });
  }

  /* ---------- Timecode burn-in + progress line on looping clips ---------- */
  function initTimecode() {
    const two = (n) => String(n).padStart(2, '0');
    const fmt = (t) => {
      if (!Number.isFinite(t)) return '--:--.--';
      const s = Math.max(0, t);
      return `${two(Math.floor(s / 60))}:${two(Math.floor(s % 60))}.${two(Math.floor((s % 1) * 100))}`;
    };

    document.querySelectorAll('video[data-loop]').forEach((video) => {
      let host = video.parentElement;
      if (!host.classList.contains('media')) {
        host = document.createElement('div');
        host.className = 'tc-host';
        video.before(host);
        host.appendChild(video);
      }
      const tc = document.createElement('span');
      tc.className = 'tc';
      tc.setAttribute('aria-hidden', 'true');
      tc.innerHTML = '<span class="tc-now"></span> / <span class="tc-dur"></span>';
      const bar = document.createElement('span');
      bar.className = 'tc-bar';
      bar.setAttribute('aria-hidden', 'true');
      host.append(tc, bar);

      const now = tc.firstChild;
      const dur = tc.lastChild;
      let raf = 0;
      const draw = () => {
        const d = video.duration;
        now.textContent = fmt(video.currentTime);
        dur.textContent = fmt(d);
        bar.style.transform = `scaleX(${d ? video.currentTime / d : 0})`;
      };
      const loop = () => { draw(); raf = requestAnimationFrame(loop); };
      video.addEventListener('play', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); });
      video.addEventListener('pause', () => { cancelAnimationFrame(raf); draw(); });
      video.addEventListener('loadedmetadata', draw);
      draw();
    });
  }

  /* ---------- Floating preview on "other projects" rows ---------- */
  function initPeek() {
    const rows = Array.from(document.querySelectorAll('.row[data-thumb]'));
    if (!rows.length || !finePointer.matches) return;

    const peek = document.createElement('img');
    peek.className = 'peek';
    peek.alt = '';
    peek.setAttribute('aria-hidden', 'true');
    peek.decoding = 'async';
    document.body.appendChild(peek);

    let x = 0;
    let y = 0;
    let frame = 0;
    const offset = 24;

    const place = () => {
      frame = 0;
      const w = peek.offsetWidth || 240;
      const h = peek.offsetHeight || 135;
      let left = x + offset;
      let top = y - h / 2;
      if (left + w > window.innerWidth - 16) left = x - w - offset;
      top = Math.max(16, Math.min(top, window.innerHeight - h - 16));
      peek.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
    };
    const schedule = (event) => {
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(place);
    };

    rows.forEach((row) => {
      row.addEventListener('mouseenter', (event) => {
        const src = row.dataset.thumb;
        if (peek.getAttribute('src') !== src) peek.src = src;
        schedule(event);
        peek.classList.add('is-visible');
      });
      row.addEventListener('mousemove', schedule);
      row.addEventListener('mouseleave', () => peek.classList.remove('is-visible'));
    });
    window.addEventListener('scroll', () => peek.classList.remove('is-visible'), { passive: true });
  }

  /* ---------- Copy email ---------- */
  function initCopy() {
    document.querySelectorAll('.copy[data-copy]').forEach((button) => {
      const idle = button.textContent;
      const done = button.dataset.done || 'copied';
      let timer = 0;
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.copy);
          button.textContent = done;
        } catch {
          window.location.href = `mailto:${button.dataset.copy}`;
          return;
        }
        clearTimeout(timer);
        timer = setTimeout(() => { button.textContent = idle; }, 1800);
      });
    });
  }

  /* ---------- YouTube: load the iframe only on click ---------- */
  function initYouTube() {
    document.querySelectorAll('.yt[data-id]').forEach((button) => {
      button.addEventListener('click', () => {
        // YouTube refuses embeds without a Referer (error 153). Pages opened from
        // disk send none, so there we hand off to youtube.com instead.
        if (!/^https?:$/.test(window.location.protocol)) {
          window.open(`https://www.youtube.com/watch?v=${button.dataset.id}`, '_blank', 'noopener');
          return;
        }
        const iframe = document.createElement('iframe');
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.src = `https://www.youtube-nocookie.com/embed/${button.dataset.id}?autoplay=1&rel=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`;
        iframe.title = button.getAttribute('aria-label') || 'Video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        const wrapper = document.createElement('div');
        wrapper.className = 'yt';
        wrapper.appendChild(iframe);
        button.replaceWith(wrapper);
        iframe.focus();
      });
    });
  }

  /* ---------- ← / → between project pages ---------- */
  function initPager() {
    const prev = document.querySelector('.pager .prev');
    const next = document.querySelector('.pager .next');
    if (!prev && !next) return;
    document.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const el = document.activeElement;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|IFRAME|VIDEO)$/.test(el.tagName))) return;
      if (event.key === 'ArrowLeft' && prev) window.location.href = prev.href;
      if (event.key === 'ArrowRight' && next) window.location.href = next.href;
    });
  }

  /* ---------- Debug overlay: the console key (` / º), like in an engine ---------- */
  function initDebug() {
    const BOX_SELECTOR = '.site-header, .hero, .section, .feature, .site-footer, .detail article > *';
    const session = {
      get() { try { return sessionStorage.getItem('debug') === '1'; } catch { return false; } },
      set(v) { try { sessionStorage.setItem('debug', v ? '1' : '0'); } catch { /* ignore */ } },
    };

    let on = false;
    let layer, boxes, hover, hoverTag, hud, observer;
    let raf = 0;
    let last = 0, acc = 0, frames = 0, worst = 0;
    let fps = 0, frameMs = 0, worstMs = 0;
    let target = null;
    let measured = [];

    const describe = (el) => {
      let name = el.tagName.toLowerCase();
      if (el.id) name += `#${el.id}`;
      else if (el.classList.length) name += `.${Array.from(el.classList).slice(0, 2).join('.')}`;
      return name;
    };
    const size = (r) => `${Math.round(r.width)}×${Math.round(r.height)}`;

    const build = () => {
      layer = document.createElement('div');
      layer.className = 'dbg';
      layer.setAttribute('aria-hidden', 'true');
      layer.innerHTML =
        '<div class="dbg-grid"></div>' +
        '<div class="dbg-col"><span class="dbg-tag"></span></div>' +
        '<div class="dbg-hover"><span class="dbg-tag"></span></div>' +
        '<pre class="dbg-hud"></pre>';
      boxes = document.createElement('div');
      boxes.className = 'dbg-boxes';
      boxes.setAttribute('aria-hidden', 'true');
      hover = layer.querySelector('.dbg-hover');
      hoverTag = hover.querySelector('.dbg-tag');
      hud = layer.querySelector('.dbg-hud');
      observer = 'ResizeObserver' in window ? new ResizeObserver(() => schedule()) : null;
    };

    /* Outline the layout blocks and paint their top margins (the 144px rhythm). */
    let pending = 0;
    const schedule = () => { if (!pending) pending = requestAnimationFrame(measure); };
    const measure = () => {
      pending = 0;
      if (!on) return;
      const sx = window.scrollX;
      const sy = window.scrollY;
      const frag = document.createDocumentFragment();
      measured = [];
      document.querySelectorAll(BOX_SELECTOR).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const top = r.top + sy;
        measured.push({ el, top, bottom: top + r.height });

        const box = document.createElement('div');
        box.className = 'dbg-box';
        box.style.cssText = `left:${r.left + sx}px;top:${top}px;width:${r.width}px;height:${r.height}px`;
        box.innerHTML = `<span class="dbg-tag">${describe(el)} <b>${size(r)}</b></span>`;
        frag.appendChild(box);

        const mt = parseFloat(getComputedStyle(el).marginTop) || 0;
        if (mt >= 24) {
          const gap = document.createElement('div');
          gap.className = 'dbg-gap';
          gap.style.cssText = `left:${r.left + sx}px;top:${top - mt}px;width:${r.width}px;height:${mt}px`;
          gap.innerHTML = `<span>${Math.round(mt)}</span>`;
          frag.appendChild(gap);
        }
      });
      boxes.replaceChildren(frag);
      boxes.style.height = `${document.documentElement.scrollHeight}px`;

      const wrap = document.querySelector('.wrap');
      if (wrap) {
        const cs = getComputedStyle(wrap);
        const r = wrap.getBoundingClientRect();
        const left = r.left + parseFloat(cs.paddingLeft);
        const width = r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        const col = layer.querySelector('.dbg-col');
        col.style.left = `${left}px`;
        col.style.width = `${width}px`;
        col.firstChild.textContent = `col ${Math.round(width)} · gutter ${Math.round(left)}`;
      }
    };

    const current = () => {
      const line = window.scrollY + window.innerHeight * 0.35;
      let found = null;
      for (const m of measured) if (m.top <= line) found = m.el;
      return found ? describe(found) : '—';
    };

    const pad = (s, n) => String(s).padEnd(n, ' ');
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (last) {
        const dt = now - last;
        acc += dt; frames += 1; worst = Math.max(worst, dt);
        if (acc >= 500) {
          fps = Math.round((frames * 1000) / acc);
          frameMs = acc / frames;
          worstMs = worst;
          acc = 0; frames = 0; worst = 0;
        }
      }
      last = now;

      if (target && target.isConnected) {
        const r = target.getBoundingClientRect();
        hover.style.cssText = `display:block;transform:translate(${r.left}px,${r.top}px);width:${r.width}px;height:${r.height}px`;
        hoverTag.textContent = `${describe(target)} ${size(r)}`;
      } else {
        hover.style.display = 'none';
      }

      const w = window.innerWidth;
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const y = Math.round(window.scrollY);
      const bp = w <= 520 ? 'xs  ≤520' : w <= 640 ? 'sm  ≤640' : 'lg  >640';
      hud.textContent = [
        `${pad('debug', 11)}${pad('', 12)}esc`,
        `${pad('fps', 11)}${fps || '··'}`,
        `${pad('frame', 11)}${frameMs ? frameMs.toFixed(1) : '··'} ms  max ${worstMs ? worstMs.toFixed(1) : '··'}`,
        `${pad('viewport', 11)}${w}×${window.innerHeight} @${+(window.devicePixelRatio || 1).toFixed(2)}x`,
        `${pad('scroll', 11)}${y} / ${max}  ${max ? Math.round((y / max) * 100) : 0}%`,
        `${pad('breakpoint', 11)}${bp}`,
        `${pad('theme', 11)}${root.dataset.theme === 'light' ? 'light' : 'dark'}`,
        `${pad('block', 11)}${current()}`,
        `${pad('hover', 11)}${target ? describe(target) : '—'}`,
      ].join('\n');
    };

    const onMove = (event) => {
      const el = event.target;
      target = el instanceof Element && el !== document.documentElement && el !== document.body ? el : null;
    };

    const set = (value) => {
      if (value === on) return;
      on = value;
      session.set(on);
      if (on) {
        if (!layer) build();
        document.body.append(boxes, layer);
        root.classList.add('debug-on');
        measure();
        observer?.observe(document.body);
        window.addEventListener('resize', schedule);
        if (finePointer.matches) document.addEventListener('mousemove', onMove, { passive: true });
        last = 0; acc = 0; frames = 0; worst = 0;
        raf = requestAnimationFrame(tick);
      } else {
        root.classList.remove('debug-on');
        cancelAnimationFrame(raf);
        observer?.disconnect();
        window.removeEventListener('resize', schedule);
        document.removeEventListener('mousemove', onMove);
        target = null;
        layer.remove();
        boxes.remove();
      }
    };

    document.addEventListener('keydown', (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const el = document.activeElement;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (event.code === 'Backquote' || event.key === '`' || event.key === 'º') {
        event.preventDefault();
        set(!on);
      } else if (event.key === 'Escape' && on) {
        set(false);
      }
    });
    if (session.get()) set(true);
  }

  root.classList.remove('no-js');
  initTheme();
  initActiveNav();
  initTimecode();
  initVideos();
  initPeek();
  initCopy();
  initYouTube();
  initPager();
  initDebug();
})();

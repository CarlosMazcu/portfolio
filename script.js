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
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${button.dataset.id}?autoplay=1&rel=0&playsinline=1`;
        iframe.title = button.getAttribute('aria-label') || 'Video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        const wrapper = document.createElement('div');
        wrapper.className = 'yt';
        wrapper.appendChild(iframe);
        button.replaceWith(wrapper);
        iframe.focus();
      }, { once: true });
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

  root.classList.remove('no-js');
  initTheme();
  initActiveNav();
  initVideos();
  initPeek();
  initCopy();
  initYouTube();
  initPager();
})();

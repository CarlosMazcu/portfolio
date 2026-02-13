// script.js

// Wait for the full DOM to load once
window.addEventListener('DOMContentLoaded', () => {
  initLanguageSwitcher();
  initNavigation();
  initHeroActions();
  initProjectFilters();
  initLazyProjectImages();
  initProjectCardReveal();
  initScrollAnimations();
  initSliders();
  initMobileMenu();
  initCarousel();
  initGalleryModal();
  initModalHandlers();
  initLiteYouTube();
});

function initLanguageSwitcher() {
  const nav = document.getElementById('primary-nav') || document.querySelector('.header-nav');
  const header = document.getElementById('header') || document.querySelector('.header');
  if (!nav || !header || nav.querySelector('.language-switcher')) return;

  const menuToggle = header?.querySelector('.menu-toggle');
  const hasHeaderLevelSwitcher = Array.from(header.children).some((node) => node.classList?.contains('language-switcher'));
  if (hasHeaderLevelSwitcher) return;

  const { enHref, esHref, isEs } = getLanguageLinks(window.location.pathname);
  const wrapper = document.createElement('div');
  wrapper.className = 'language-switcher';
  wrapper.setAttribute('aria-label', 'Language switcher');
  wrapper.classList.add(isEs ? 'is-es' : 'is-en');

  const en = document.createElement('a');
  en.href = enHref;
  en.textContent = 'EN';
  en.setAttribute('hreflang', 'en');
  if (!isEs) en.setAttribute('aria-current', 'page');

  const es = document.createElement('a');
  es.href = esHref;
  es.textContent = 'ES';
  es.setAttribute('hreflang', 'es');
  if (isEs) es.setAttribute('aria-current', 'page');

  wrapper.appendChild(en);
  wrapper.appendChild(es);

  const mediaQuery = window.matchMedia('(max-width: 900px)');

  const mountDesktop = () => {
    const firstNavLink = nav.querySelector('.nav-link');
    if (firstNavLink) {
      nav.insertBefore(wrapper, firstNavLink);
      return;
    }
    const socials = nav.querySelector('.header-socials');
    if (socials) {
      nav.insertBefore(wrapper, socials);
      return;
    }
    nav.appendChild(wrapper);
  };

  const mountMobile = () => {
    if (!menuToggle) {
      mountDesktop();
      return;
    }
    header.insertBefore(wrapper, menuToggle);
  };

  const syncPlacement = () => {
    if (mediaQuery.matches) {
      mountMobile();
      return;
    }
    mountDesktop();
  };

  syncPlacement();
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', syncPlacement);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(syncPlacement);
  }
}

function getLanguageLinks(pathname) {
  const normalized = (pathname || '').replace(/\\/g, '/');
  const isEs = normalized.includes('/es/');
  const isProject = normalized.includes('/projects/');
  const segments = normalized.split('/').filter(Boolean);
  const last = segments[segments.length - 1] || '';
  const fileName = last.includes('.html') ? last : 'index.html';

  if (isProject && isEs) {
    return {
      enHref: `../../projects/${fileName}`,
      esHref: fileName,
      isEs: true
    };
  }

  if (isProject && !isEs) {
    return {
      enHref: fileName,
      esHref: `../es/projects/${fileName}`,
      isEs: false
    };
  }

  if (!isProject && isEs) {
    return {
      enHref: '../index.html',
      esHref: 'index.html',
      isEs: true
    };
  }

  return {
    enHref: 'index.html',
    esHref: 'es/index.html',
    isEs: false
  };
}

function initScrollAnimations() {
  const header = document.getElementById('header') || document.querySelector('.header');
  if (!header) return;

  let ticking = false;
  const spyOffset = 200;
  const navLinks = Array.from(document.querySelectorAll('.header-nav .nav-link[href^="#"]'));
  const sectionTargets = [];

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    const target = href ? document.querySelector(href) : null;
    if (target?.id) {
      sectionTargets.push({ id: target.id, node: target });
    }
  });

  function handleHeaderAppearance() {
    if (window.scrollY > 100) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }

  function highlightActiveSection() {
    if (!sectionTargets.length) return;

    const probeY = window.pageYOffset + spyOffset;
    let currentSection = '';

    sectionTargets.forEach(({ id, node }) => {
      if (probeY >= node.offsetTop) {
        currentSection = id;
      }
    });

    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${currentSection}`;
      link.classList.toggle('active', isActive);
    });
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleHeaderAppearance();
        highlightActiveSection();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    highlightActiveSection();
  });

  // Initial state
  handleHeaderAppearance();
  highlightActiveSection();
}

function initNavigation() {
  const navLinks = document.querySelectorAll('.header-nav .nav-link[href^="#"]');
  const header = document.getElementById('header') || document.querySelector('.header');
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (!targetId || !targetId.startsWith('#')) return;
      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        e.preventDefault();
        const headerOffset = (header?.offsetHeight || 0) + 18;
        const targetTop = targetSection.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: targetTop,
          behavior: "smooth"
        });
      }

      const menuToggle = document.querySelector('.menu-toggle');
      if (document.body.classList.contains('nav-open') && menuToggle) {
        menuToggle.click();
      }
    });
  });
}

function initHeroActions() {
  const viewProjectsLink = document.querySelector('.hero-actions a[href="#projects"]');
  const projectsSection = document.getElementById('projects');
  const header = document.getElementById('header') || document.querySelector('.header');

  if (!viewProjectsLink || !projectsSection) return;

  viewProjectsLink.addEventListener('click', (event) => {
    event.preventDefault();

    const headerOffset = (header?.offsetHeight || 0) + 18;
    const targetTop = projectsSection.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: targetTop,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  });
}

function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav') || document.querySelector('.header-nav');
  if (!menuToggle || !nav) return;

  let overlay = document.querySelector('.header-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'header-overlay';
    document.body.appendChild(overlay);
  }

  const mobileQuery = window.matchMedia('(max-width: 900px)');
  let lockScrollY = 0;

  const lockBodyScroll = () => {
    lockScrollY = window.scrollY || window.pageYOffset || 0;
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  };

  const unlockBodyScroll = () => {
    const top = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.paddingRight = '';

    const restoreY = top ? Math.abs(parseInt(top, 10)) : lockScrollY;
    window.scrollTo(0, Number.isFinite(restoreY) ? restoreY : 0);
  };

  const getFocusableElements = () =>
    Array.from(
      nav.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter((el) => !el.hasAttribute('disabled'));

  const isOpen = () => nav.classList.contains('is-open');

  const closeMenu = ({ restoreFocus = true } = {}) => {
    const wasOpen = isOpen();
    nav.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    document.body.classList.remove('nav-open', 'no-scroll');
    if (wasOpen) {
      unlockBodyScroll();
    }
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');
    if (restoreFocus) {
      menuToggle.focus({ preventScroll: true });
    }
  };

  const openMenu = () => {
    if (!mobileQuery.matches) return;
    nav.classList.add('is-open');
    overlay.classList.add('is-visible');
    document.body.classList.add('nav-open', 'no-scroll');
    lockBodyScroll();
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close navigation menu');
    const [firstLink] = getFocusableElements();
    if (firstLink) {
      firstLink.focus({ preventScroll: true });
    }
  };

  const toggleMenu = () => {
    if (isOpen()) {
      closeMenu();
      return;
    }
    openMenu();
  };

  menuToggle.addEventListener('click', toggleMenu);

  nav.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('a')) {
      // Defer close to avoid swallowing the link action on some mobile browsers.
      window.setTimeout(() => closeMenu({ restoreFocus: false }), 30);
    }
  });

  overlay.addEventListener('click', () => closeMenu());

  document.addEventListener('keydown', (event) => {
    if (!isOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (!isOpen()) return;
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('.header-nav') || event.target.closest('.menu-toggle') || event.target.closest('.header-overlay')) {
      return;
    }
    closeMenu();
  });

  mobileQuery.addEventListener('change', (event) => {
    if (!event.matches) {
      closeMenu({ restoreFocus: false });
    }
  });

  window.closeMobileMenu = () => closeMenu({ restoreFocus: false });
}

function initProjectFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  const featuredProjects = document.querySelectorAll('.featured-project');
  const allProjects = [...projectCards, ...featuredProjects];

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.getAttribute('data-category');
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      allProjects.forEach(project => {
        const projectCategory = project.getAttribute('data-category');
        if (category === 'all' || projectCategory === category) {
          project.style.display = '';
          project.classList.add('fade-in');
          setTimeout(() => project.classList.remove('fade-in'), 500);
        } else {
          project.style.display = 'none';
        }
      });
    });
  });

  const filterContainer = document.getElementById('project-filters');
  if (filterContainer && window.innerWidth <= 768) {
    filterContainer.style.overflowX = 'auto';
    filterContainer.style.paddingBottom = '15px';
    filterContainer.style.justifyContent = 'flex-start';
    filterContainer.style.webkitOverflowScrolling = 'touch';
  }
}

function initLazyProjectImages() {
  const projectThumbImages = Array.from(document.querySelectorAll('.projects-section .project-tile img'));
  if (!projectThumbImages.length) return;

  const ensureThumbFrame = (img) => {
    const media = img.closest('picture') || img;
    let frame = media.parentElement;

    if (!frame || !frame.classList.contains('project-thumb-frame')) {
      frame = document.createElement('div');
      frame.className = 'project-thumb-frame';
      media.parentNode.insertBefore(frame, media);
      frame.appendChild(media);
    }

    if (!frame.querySelector('.project-thumb-skeleton')) {
      const skeleton = document.createElement('div');
      skeleton.className = 'project-thumb-skeleton skeleton';
      frame.appendChild(skeleton);
    }

    return frame;
  };

  const reveal = (img) => {
    const frame = ensureThumbFrame(img);
    const show = () => {
      img.classList.add('is-visible');
      frame.classList.add('is-loaded');
    };

    if (img.complete && img.naturalWidth > 0) {
      show();
      return;
    }
    img.addEventListener('load', show, { once: true });
    img.addEventListener('error', show, { once: true });
  };

  projectThumbImages.forEach((img) => {
    ensureThumbFrame(img);
    img.classList.add('lazy-image');
  });

  const lazyProjectImages = projectThumbImages.filter((img) => img.loading === 'lazy');
  const eagerProjectImages = projectThumbImages.filter((img) => img.loading !== 'lazy');

  if (!lazyProjectImages.length || !('IntersectionObserver' in window)) {
    projectThumbImages.forEach(reveal);
    return;
  }

  eagerProjectImages.forEach(reveal);

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      reveal(img);
      obs.unobserve(img);
    });
  }, {
    root: null,
    rootMargin: '120px 0px',
    threshold: 0.05
  });

  lazyProjectImages.forEach((img) => observer.observe(img));
}

function initProjectCardReveal() {
  const cards = Array.from(document.querySelectorAll('.projects-section .fade-in-card'));
  if (!cards.length) return;

  cards.forEach((card, index) => {
    card.dataset.revealIndex = String(index);
  });

  if (!('IntersectionObserver' in window)) {
    cards.forEach((card) => card.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const index = Number(entry.target.dataset.revealIndex || 0);
      const delay = Math.min(index * 28, 112);
      setTimeout(() => {
        entry.target.classList.add('is-visible');
      }, delay);
      obs.unobserve(entry.target);
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px 120px 0px'
  });

  cards.forEach((card) => observer.observe(card));
}

function initSliders() {
  const sliders = document.querySelectorAll('.slider');
  sliders.forEach(slider => {
    const wrapper = slider.querySelector('.slider-wrapper');
    const images = slider.querySelectorAll('img');
    const slides = wrapper ? Array.from(wrapper.children).filter((node) => node.nodeType === 1) : [];
    const prevBtn = slider.querySelector('.prev');
    const nextBtn = slider.querySelector('.next');
    initGalleryState(slider, images, prevBtn, nextBtn);
    if (!wrapper || !slides.length || !prevBtn || !nextBtn) return;

    let currentIndex = 0;
    const slideCount = slides.length;
    wrapper.style.width = `${slideCount * 100}%`;
    slides.forEach((slide) => {
      const basis = `${100 / slideCount}%`;
      slide.style.width = basis;
      slide.style.flex = `0 0 ${basis}`;
    });
    updateSliderPosition(slider, currentIndex);

    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + slideCount) % slideCount;
      updateSliderPosition(slider, currentIndex);
    });
    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % slideCount;
      updateSliderPosition(slider, currentIndex);
    });
    window.addEventListener('resize', () => updateSliderPosition(slider, currentIndex));

    let slideInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % slideCount;
      updateSliderPosition(slider, currentIndex);
    }, 5000);
    slider.addEventListener('mouseenter', () => clearInterval(slideInterval));
    slider.addEventListener('mouseleave', () => {
      slideInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % slideCount;
        updateSliderPosition(slider, currentIndex);
      }, 5000);
    });

    let touchStartX = 0;
    let touchEndX = 0;
    slider.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX);
    slider.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchEndX < touchStartX - 50) currentIndex = (currentIndex + 1) % slideCount;
      if (touchEndX > touchStartX + 50) currentIndex = (currentIndex - 1 + slideCount) % slideCount;
      updateSliderPosition(slider, currentIndex);
    });
  });
}

function updateSliderPosition(slider, index) {
  const wrapper = slider.querySelector('.slider-wrapper');
  const slideCount = wrapper ? wrapper.children.length : 0;
  if (!wrapper || !slideCount) return;
  wrapper.style.transform = `translateX(-${(100 / slideCount) * index}%)`;
}

function initCarousel() {
  const container = document.querySelector('.carousel-container');
  if (!container || window.innerWidth > 768) return;
  const wrapper = container.querySelector('.carousel-wrapper');
  const projects = wrapper.querySelectorAll('.featured-project');
  const btnPrev = container.querySelector('.carousel-btn.prev');
  const btnNext = container.querySelector('.carousel-btn.next');

  let index = 0;
  function updateCarousel() {
    const offset = -index * 100;
    wrapper.style.transform = `translateX(${offset}%)`;
  }
  btnPrev.addEventListener('click', () => {
    index = (index > 0) ? index - 1 : projects.length - 1;
    updateCarousel();
  });
  btnNext.addEventListener('click', () => {
    index = (index + 1) % projects.length;
    updateCarousel();
  });
  updateCarousel();
}

function initGalleryModal() {
  const galleryImages = document.querySelectorAll('.gallery img');
  if (!galleryImages.length) return;
  galleryImages.forEach(img => {
    img.addEventListener('click', () => {
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.background = 'rgba(0,0,0,0.8)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = '9999';

      const modalImg = document.createElement('img');
      modalImg.src = img.src;
      modalImg.style.maxWidth = '90%';
      modalImg.style.maxHeight = '90%';
      modalImg.style.borderRadius = '8px';
      modal.appendChild(modalImg);

      modal.addEventListener('click', () => document.body.removeChild(modal));
      document.body.appendChild(modal);
    });
  });
}

function initModalHandlers() {
  const forms = document.querySelectorAll('.contact-form--inline');
  if (!forms.length) return;

  forms.forEach((form) => {
    const statusNode = form.parentElement?.querySelector('.contact-form-status');
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const to = form.getAttribute('data-mailto') || 'carlosmazcu@gmail.com';
      const name = (form.querySelector('[name=\"name\"]')?.value || '').trim();
      const email = (form.querySelector('[name=\"email\"]')?.value || '').trim();
      const message = (form.querySelector('[name=\"message\"]')?.value || '').trim();

      const subject = `Portfolio Contact${name ? ` - ${name}` : ''}`;
      const body = [
        `Name: ${name || '-'}`,
        `Email: ${email || '-'}`,
        '',
        'Message:',
        message || '-'
      ].join('\n');

      const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      if (statusNode) {
        statusNode.textContent = 'Opening your email client...';
      }

      window.location.href = mailtoUrl;
    });
  });
}

function initGalleryState(slider, images, prevBtn, nextBtn) {
  const sliderWindow = slider.querySelector('.slider-window') || slider;
  if (!sliderWindow) return;

  if (!images.length) {
    slider.classList.add('gallery-empty');
    prevBtn?.setAttribute('hidden', '');
    nextBtn?.setAttribute('hidden', '');
    if (!sliderWindow.querySelector('.gallery-empty-message')) {
      const message = document.createElement('div');
      message.className = 'gallery-empty-message';
      message.textContent = 'No media available.';
      sliderWindow.appendChild(message);
    }
    return;
  }

  let pending = images.length;
  const markReady = () => {
    pending -= 1;
    if (pending <= 0) {
      applySmallestGalleryRatio(slider, images);
      slider.classList.add('gallery-loaded');
    }
  };

  images.forEach((img, index) => {
    const finish = () => {
      if (img.dataset.galleryReady === '1') return;
      img.dataset.galleryReady = '1';
      markReady();
    };

    const fail = () => {
      if (img.dataset.galleryFallback === '1') {
        finish();
        return;
      }
      img.dataset.galleryFallback = '1';
      img.src = createGalleryPlaceholder(`Image ${index + 1} unavailable`);
      img.alt = `${img.alt || 'Gallery image'} unavailable`;
      finish();
    };

    if (img.complete) {
      if (img.naturalWidth > 0) finish();
      else fail();
      return;
    }

    img.addEventListener('load', finish, { once: true });
    img.addEventListener('error', fail, { once: true });
  });
}

function applySmallestGalleryRatio(slider, images) {
  if (!slider.classList.contains('gallery--crop-smallest') || !images.length) return;

  const sliderWindow = slider.querySelector('.slider-window');
  if (!sliderWindow) return;

  let smallest = null;
  images.forEach((img) => {
    if (!img.naturalWidth || !img.naturalHeight) return;
    const heightRatio = img.naturalHeight / img.naturalWidth;
    if (!smallest || heightRatio < smallest.heightRatio) {
      smallest = {
        heightRatio,
        width: img.naturalWidth,
        height: img.naturalHeight
      };
    }
  });

  if (!smallest) return;
  sliderWindow.style.setProperty('--gallery-min-ratio', `${smallest.width} / ${smallest.height}`);
}

function createGalleryPlaceholder(label) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#111b2e"/>
          <stop offset="100%" stop-color="#0c1322"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)"/>
      <rect x="260" y="250" width="760" height="220" rx="14" fill="#13213a" stroke="#6f89ad" stroke-opacity="0.45"/>
      <text x="640" y="355" text-anchor="middle" fill="#c2d0e4" font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="600">Image unavailable</text>
      <text x="640" y="405" text-anchor="middle" fill="#9db1cf" font-family="Segoe UI, Arial, sans-serif" font-size="24">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// Lightweight YouTube embeds: replace placeholders on click
function initLiteYouTube() {
  const nodes = document.querySelectorAll('.yt-lite[data-videoid]');
  if (!nodes.length) return;
  nodes.forEach(node => {
    const id = node.getAttribute('data-videoid');
    // Set preview thumbnail
    node.style.backgroundImage = `url(https://img.youtube.com/vi/${id}/hqdefault.jpg)`;
    node.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      iframe.loading = 'lazy';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      node.textContent = '';
      node.appendChild(iframe);
    }, { once: true });
  });
}

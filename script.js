// script.js

// Wait for the full DOM to load once
window.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initProjectFilters();
  initScrollAnimations();
  initSliders();
  initMobileMenu();
  initCarousel();
  initGalleryModal();
  initModalHandlers();
  initLiteYouTube();
});

function initScrollAnimations() {
  const header = document.getElementById('header') || document.querySelector('.header');
  if (!header) return;

  let ticking = false;
  let lastY = window.pageYOffset || 0;

  function handleHeaderAppearance() {
    if (window.scrollY > 100) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }

  function handleAutoHide() {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) {
      header.classList.remove('header--hidden');
      return;
    }
    const currentY = window.pageYOffset || 0;
    const threshold = 10;
    const headerHeight = header.offsetHeight || 56;
    if (currentY > lastY + threshold && currentY > headerHeight + 20) {
      header.classList.add('header--hidden');
    } else if (currentY < lastY - threshold) {
      header.classList.remove('header--hidden');
    }
    lastY = currentY;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleHeaderAppearance();
        handleAutoHide();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    if (!window.matchMedia('(max-width: 768px)').matches) header.classList.remove('header--hidden');
  });

  // Section highlight (kept, safe if no nav)
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('header nav a');
  function highlightActiveSection() {
    let currentSection = '';
    const scrollY = window.pageYOffset;
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        currentSection = section.getAttribute('id');
      }
    });
    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) link.classList.add('active');
    });
  }
  window.addEventListener('scroll', highlightActiveSection, { passive: true });

  // Initial state
  handleHeaderAppearance();
  highlightActiveSection();
}

function initNavigation() {
  const navLinks = document.querySelectorAll("header nav a");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        window.scrollTo({
          top: targetSection.offsetTop - 80,
          behavior: "smooth"
        });
      }
      const nav = document.querySelector('nav');
      if (nav?.classList.contains('open')) {
        toggleMenu();
      }
    });
  });
}

function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('nav');
  const overlay = document.querySelector('.overlay');
  if (!menuToggle || !nav) return;

  window.toggleMenu = function () {
    nav.classList.toggle('open');
    menuToggle.classList.toggle('active');
    document.body.classList.toggle('no-scroll');
    if (overlay) overlay.classList.toggle('visible');
  };

  menuToggle.addEventListener('click', toggleMenu);
  overlay?.addEventListener('click', toggleMenu);
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

function initSliders() {
  const sliders = document.querySelectorAll('.slider');
  sliders.forEach(slider => {
    const wrapper = slider.querySelector('.slider-wrapper');
    const images = slider.querySelectorAll('img');
    const prevBtn = slider.querySelector('.prev');
    const nextBtn = slider.querySelector('.next');
    initGalleryState(slider, images, prevBtn, nextBtn);
    if (!wrapper || !images.length || !prevBtn || !nextBtn) return;

    let currentIndex = 0;
    const imgCount = images.length;
    wrapper.style.width = `${imgCount * 100}%`;
    images.forEach(img => img.style.width = `${100 / imgCount}%`);
    updateSliderPosition(slider, currentIndex);

    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + imgCount) % imgCount;
      updateSliderPosition(slider, currentIndex);
    });
    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % imgCount;
      updateSliderPosition(slider, currentIndex);
    });
    window.addEventListener('resize', () => updateSliderPosition(slider, currentIndex));

    let slideInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % imgCount;
      updateSliderPosition(slider, currentIndex);
    }, 5000);
    slider.addEventListener('mouseenter', () => clearInterval(slideInterval));
    slider.addEventListener('mouseleave', () => {
      slideInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % imgCount;
        updateSliderPosition(slider, currentIndex);
      }, 5000);
    });

    let touchStartX = 0;
    let touchEndX = 0;
    slider.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX);
    slider.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchEndX < touchStartX - 50) currentIndex = (currentIndex + 1) % imgCount;
      if (touchEndX > touchStartX + 50) currentIndex = (currentIndex - 1 + imgCount) % imgCount;
      updateSliderPosition(slider, currentIndex);
    });
  });
}

function updateSliderPosition(slider, index) {
  const wrapper = slider.querySelector('.slider-wrapper');
  const images = slider.querySelectorAll('img');
  if (!wrapper || !images.length) return;
  const imgCount = images.length;
  wrapper.style.transform = `translateX(-${(100 / imgCount) * index}%)`;
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
  const modal = document.getElementById('contact-modal');
  const closeModal = document.getElementById('modal-close');
  const emailLinks = document.querySelectorAll('a[href^="mailto"]');
  const headerEmail = document.getElementById('header-email');
  const fallbackMailto = 'mailto:carlosmazcu@gmail.com';

  if (!modal) {
    if (headerEmail && headerEmail.getAttribute('href') === '#') {
      headerEmail.setAttribute('href', fallbackMailto);
    }
    return;
  }

  function showModal(e) {
    e.preventDefault();
    modal.classList.remove('hidden');
  }

  emailLinks.forEach(link => link.addEventListener('click', showModal));
  headerEmail?.addEventListener('click', showModal);
  closeModal?.addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') modal.classList.add('hidden');
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

  slider.classList.add('gallery-loading');
  ensureGalleryLoadingOverlay(sliderWindow);

  let pending = images.length;
  const markReady = () => {
    pending -= 1;
    if (pending <= 0) {
      slider.classList.remove('gallery-loading');
      slider.classList.add('gallery-loaded');
      sliderWindow.querySelector('.gallery-loading-overlay')?.remove();
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

function ensureGalleryLoadingOverlay(sliderWindow) {
  if (sliderWindow.querySelector('.gallery-loading-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'gallery-loading-overlay';

  const skeleton = document.createElement('div');
  skeleton.className = 'gallery-skeleton';

  const text = document.createElement('p');
  text.className = 'gallery-loading-text';
  text.textContent = 'Loading media...';

  overlay.appendChild(skeleton);
  overlay.appendChild(text);
  sliderWindow.appendChild(overlay);
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

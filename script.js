// Add event listeners when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize elements
  initNavigation();
  initProjectFilters();
  initScrollAnimations();
  initSliders();
  initMobileMenu(); // Nueva función para el menú móvil
});

// Handle header appearance on scroll
function initScrollAnimations() {
  const header = document.getElementById('header');
  let lastScrollY = window.scrollY;
  let ticking = false;

  function handleHeaderAppearance() {
    if (window.scrollY > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleHeaderAppearance();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Add scroll highlighting for active navigation sections
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll("header nav a");

  function highlightActiveSection() {
    let currentSection = "";
    let scrollY = window.pageYOffset;

    // Find the current section based on scroll position
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        currentSection = section.getAttribute("id");
      }
    });

    // Update active class on navigation links
    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${currentSection}`) {
        link.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", highlightActiveSection);

  // Initial check for active section
  highlightActiveSection();
}

// Smooth scrolling for navigation links
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

      // Si estamos en móvil y el menú está abierto, cerrarlo
      const nav = document.querySelector('nav');
      if (nav.classList.contains('open')) {
        toggleMenu();
      }
    });
  });
}

// Mobile menu functionality
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('nav');
  const overlay = document.querySelector('.overlay');

  // Si no existen estos elementos, salir de la función
  if (!menuToggle || !nav) return;

  // Función para cambiar el estado del menú
  window.toggleMenu = function () {
    nav.classList.toggle('open');
    menuToggle.classList.toggle('active');
    document.body.classList.toggle('no-scroll');

    if (overlay) {
      overlay.classList.toggle('visible');
    }
  };

  // Añadir evento click al botón de menú
  menuToggle.addEventListener('click', toggleMenu);

  // Añadir evento click al overlay
  if (overlay) {
    overlay.addEventListener('click', toggleMenu);
  }
}

// Project filtering functionality
function initProjectFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  const featuredProjects = document.querySelectorAll('.featured-project');

  // Combine all filterable projects
  const allProjects = [...projectCards, ...featuredProjects];

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Get selected category
      const category = button.getAttribute('data-category');

      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Filter projects
      allProjects.forEach(project => {
        const projectCategory = project.getAttribute('data-category');

        if (category === 'all' || projectCategory === category) {
          project.style.display = ''; // Show project
          // Add animation when showing
          project.classList.add('fade-in');
          // Remove animation class after transition
          setTimeout(() => {
            project.classList.remove('fade-in');
          }, 500);
        } else {
          project.style.display = 'none'; // Hide project
        }
      });
    });
  });

  // Hacer los filtros de proyectos scrollables horizontalmente en móvil
  const filterContainer = document.getElementById('project-filters');
  if (filterContainer && window.innerWidth <= 768) {
    filterContainer.style.overflowX = 'auto';
    filterContainer.style.paddingBottom = '15px';
    filterContainer.style.justifyContent = 'flex-start';
    filterContainer.style.webkitOverflowScrolling = 'touch';
  }
}

// Image slider functionality
function initSliders() {
  const sliders = document.querySelectorAll('.slider');

  sliders.forEach(slider => {
    const sliderWrapper = slider.querySelector('.slider-wrapper');
    const images = slider.querySelectorAll('img');
    const prevBtn = slider.querySelector('.prev');
    const nextBtn = slider.querySelector('.next');

    if (!sliderWrapper || !images.length || !prevBtn || !nextBtn) return;

    let currentIndex = 0;
    const imgCount = images.length;

    // Set initial position and proper width for mobile
    updateSliderPosition(slider, currentIndex);

    // Configure slider for proper display
    sliderWrapper.style.width = `${imgCount * 100}%`;
    images.forEach(img => {
      img.style.width = `${100 / imgCount}%`;
    });

    // Previous button click
    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + imgCount) % imgCount;
      updateSliderPosition(slider, currentIndex);
    });

    // Next button click
    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % imgCount;
      updateSliderPosition(slider, currentIndex);
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      updateSliderPosition(slider, currentIndex);
    });

    // Auto-advance every 5 seconds
    let slideInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % imgCount;
      updateSliderPosition(slider, currentIndex);
    }, 5000);

    // Pause auto-advance when hovering
    slider.addEventListener('mouseenter', () => {
      clearInterval(slideInterval);
    });

    // Resume auto-advance when mouse leaves
    slider.addEventListener('mouseleave', () => {
      slideInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % imgCount;
        updateSliderPosition(slider, currentIndex);
      }, 5000);
    });

    // Añadir soporte para interacciones táctiles en móvil
    let touchStartX = 0;
    let touchEndX = 0;

    slider.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, false);

    slider.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, false);

    function handleSwipe() {
      // Detectar la dirección del swipe
      if (touchEndX < touchStartX - 50) {
        // Swipe hacia la izquierda - siguiente imagen
        currentIndex = (currentIndex + 1) % imgCount;
        updateSliderPosition(slider, currentIndex);
      }

      if (touchEndX > touchStartX + 50) {
        // Swipe hacia la derecha - imagen anterior
        currentIndex = (currentIndex - 1 + imgCount) % imgCount;
        updateSliderPosition(slider, currentIndex);
      }
    }
  });
}

// Actualizar la posición del slider
function updateSliderPosition(slider, index) {
  const sliderWrapper = slider.querySelector('.slider-wrapper');
  const images = slider.querySelectorAll('img');

  if (!sliderWrapper || !images.length) return;

  const imgCount = images.length;
  sliderWrapper.style.transform = `translateX(-${(100 / imgCount) * index}%)`;
}

// Intersection Observer for scroll animations
document.addEventListener('DOMContentLoaded', () => {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe project cards for animation on scroll
  document.querySelectorAll('.project-card, .featured-project').forEach(item => {
    observer.observe(item);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  initCarousel();
});

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
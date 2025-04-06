// Add event listeners when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize elements
  initNavigation();
  initProjectFilters();
  initScrollAnimations();
  initSliders();
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
    });
  });
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

    // Set initial position
    updateSliderPosition(slider, currentIndex);

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
  });
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
// Resaltar enlace activo en el menú
document.addEventListener("scroll", function () {
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll("header nav a");

  let currentSection = "";

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    if (pageYOffset >= sectionTop - 60) {
      currentSection = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href").includes(currentSection)) {
      link.classList.add("active");
    }
  });
});

// Scroll suave
document.querySelectorAll("header nav a").forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    const targetId = this.getAttribute("href").slice(1);
    const targetSection = document.getElementById(targetId);

    targetSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
});


window.addEventListener("scroll", function () {
  const sections = document.querySelectorAll("section");

  sections.forEach((section) => {
    const speed = 0.1; // Velocidad del parallax (ajustable)
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const offset = (window.scrollY - section.offsetTop) * speed;
      section.style.backgroundPositionY = `${-50 + offset}px`; // Ajustar la imagen de fondo dinámicamente
    }
  });
});

const filterButtons = document.querySelectorAll(".filter-btn");
const projects = document.querySelectorAll("#projects ul li");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const category = button.getAttribute("data-category");

    // Resaltar el botón activo
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    // Mostrar/Ocultar proyectos
    projects.forEach((project) => {
      if (category === "all" || project.getAttribute("data-category") === category) {
        project.style.display = "block"; // Mostrar
      } else {
        project.style.display = "none"; // Ocultar
      }
    });
  });
});
 
// Evento de scroll con debouncing
window.addEventListener("scroll", () => {
  lastKnownScrollY = window.scrollY || document.documentElement.scrollTop;
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(handleHeader, 50); // Ajusta si es necesario
});

// Slider functionality for multiple sliders
document.querySelectorAll(".slider").forEach((sliderContainer) => {
  const sliderWrapper = sliderContainer.querySelector(".slider-wrapper");
  const images = sliderContainer.querySelectorAll(".slider img");
  const prevButton = sliderContainer.querySelector(".prev");
  const nextButton = sliderContainer.querySelector(".next");

  let currentIndex = 0;

  function updateSlider() {
    const slideWidth = images[0].clientWidth;
    sliderWrapper.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
  }

  nextButton.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % images.length; // Loop back to the first image
    updateSlider();
  });

  prevButton.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length; // Loop to the last image
    updateSlider();
  });
});
// Adjust slider on window resize
window.addEventListener("resize", updateSlider);
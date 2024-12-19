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

// Efecto Parallax para las imágenes de fondo
/* window.addEventListener("scroll", function () {
  const sections = document.querySelectorAll("section");

  sections.forEach((section) => {
    const speed = 0.09; // Velocidad más baja para un efecto más sutil
    const offset = window.scrollY * speed;
    section.style.backgroundPositionY = `${offset}px`;
  });
}); */
window.addEventListener("scroll", function () {
  const sections = document.querySelectorAll("section");

  sections.forEach((section) => {
    const speed = 0.09; // Velocidad del parallax (ajustable)
    const rect = section.getBoundingClientRect(); // Posición relativa al viewport
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const offset = (window.scrollY - section.offsetTop) * speed;
      section.style.backgroundPositionY = `${offset}px`;
    }
  });
});

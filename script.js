// Siempre iniciar arriba (portada), incluso con scroll restoration
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("pageshow", () => {
  if (window.location.hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  window.scrollTo(0, 0);
});

// Año (si existe el elemento)
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// 1) Reveal on scroll
const revealEls = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("in-view");
    });
  },
  { threshold: 0.18 }
);
revealEls.forEach((el) => revealObserver.observe(el));

// 2) Active nav link by section
const navLinks = Array.from(document.querySelectorAll(".nav__link"));
const sectionIds = ["portada", "productos", "contacto"];
const sections = sectionIds.map((id) => document.getElementById(id));

function setActive(id){
  navLinks.forEach((a) => {
    const href = a.getAttribute("href") || "";
    a.classList.toggle("active", href === `#${id}`);
  });
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible?.target?.id) setActive(visible.target.id);
  },
  { threshold: [0.25, 0.4, 0.55] }
);

sections.forEach((s) => s && sectionObserver.observe(s));
setActive("portada");

// --- Scroll hint: solo en Portada + aparece con delay ---
const scrollHintBtn = document.getElementById("scrollHintBtn");
const portada = document.getElementById("portada");

let hintTimer = null;

function showHintWithDelay() {
  if (!scrollHintBtn) return;
  if (hintTimer) clearTimeout(hintTimer);

  hintTimer = setTimeout(() => {
    scrollHintBtn.classList.add("is-visible");
  }, 2500);
}

function hideHint() {
  if (!scrollHintBtn) return;
  if (hintTimer) clearTimeout(hintTimer);
  hintTimer = null;
  scrollHintBtn.classList.remove("is-visible");
}

// Smooth scroll con duración controlable
function smoothScrollTo(targetY, duration = 1800) {
  const startY = window.scrollY;
  const diff = targetY - startY;
  const start = performance.now();

  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function step(now) {
    const elapsed = now - start;
    const t = Math.min(1, elapsed / duration);
    window.scrollTo(0, startY + diff * easeInOutCubic(t));
    if (t < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// Click: baja a Productos
if (scrollHintBtn) {
  scrollHintBtn.addEventListener("click", () => {
    const el = document.getElementById("productos");
    if (!el) return;

    const navH = document.querySelector(".nav")?.offsetHeight || 0;
    const y = el.getBoundingClientRect().top + window.scrollY - navH;

    smoothScrollTo(y, 1800); // ajusta 1400-2600
  });
}

// Scroll lento para links del navbar
navLinks.forEach((a) => {
  a.addEventListener("click", (e) => {
    const href = a.getAttribute("href") || "";
    if (!href.startsWith("#")) return;

    const id = href.slice(1);
    const el = document.getElementById(id);
    if (!el) return;

    e.preventDefault();

    const navH = document.querySelector(".nav")?.offsetHeight || 0;
    const y = el.getBoundingClientRect().top + window.scrollY - navH;

    smoothScrollTo(y, 2200); // ↑ sube/baja para controlar velocidad
    history.replaceState(null, "", href); // actualiza el hash sin salto brusco
  });
});



// Observa si la portada está “activa”
if (portada) {
  const portadaObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
        showHintWithDelay();
      } else {
        hideHint();
      }
    },
    { threshold: [0.2, 0.6, 0.8] }
  );

  portadaObserver.observe(portada);
}

// --- Formulario -> Google Sheets ---
const SHEETS_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbw1Hmjv6OaCI6tFi5Cbbbj3BdzXGaLaBuqa9EJbu2jlfu3HQKgHFAAQWqejMuoYCbGouQ/exec";

const formEl = document.getElementById("contactForm");
const statusEl = document.getElementById("formStatus");

if (formEl) {
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = formEl.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn?.textContent || "Enviar";
if (submitBtn) {
  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando...";
  submitBtn.classList.remove("is-sent"); // por si estaba azul de antes
}

    const payload = {
      name: document.getElementById("name")?.value?.trim() || "",
      email: document.getElementById("email")?.value?.trim() || "",
      subject: document.getElementById("subject")?.value?.trim() || "",
      message: document.getElementById("message")?.value?.trim() || "",
      source: window.location.href
    };

    if (statusEl) statusEl.textContent = "Enviando...";

    try {
  const res = await fetch(SHEETS_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));

  if (data.ok) {
    submitBtn?.classList.add("is-sent");
    if (statusEl) statusEl.textContent = "¡Enviado! Gracias 🙌";
    formEl.reset();
  } else {
    if (statusEl) statusEl.textContent = "Error al enviar. Intenta de nuevo.";
    console.error("Sheets error:", data);
  }
} catch (err) {
  if (statusEl) statusEl.textContent = "Error de conexión. Intenta de nuevo.";
  console.error(err);
} finally {
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
}
  });
}
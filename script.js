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

const translations = {
  es: {
    "nav.products": "Productos",
    "nav.contact": "Contacto",
    "hero.headline1": "Umami natural para tus comidas.",
    "hero.headline2": "Sin MSG ni preservantes artificiales.",
    "hero.headline3": "100% artesanal.",
    "products.gourmetTitle": "“GOURMET GARLIC”",
    "products.gourmetSubtitle": "Ajos finamente picados, macerados en aceite 100% girasol.",
    "products.gourmetFhTitle": "Finas Hierbas & Sal de Maras",
    "products.gourmetFhText1": "Ajos finamente picados y macerados en aceite 100% de girasol, perfumados con finas hierbas y un toque de sal de Maras.",
    "products.gourmetFhText2": "El resultado es un sabor limpio y aromático, con notas herbales que realzan sin opacar. Úsalo para darle un toque gourmet a tus comidas. Ideal para pescados, aves y vegetales.",
    "products.gourmetHongoTitle": "Hongos & Laurel",
    "products.gourmetHongoText": "Ajos finamente picados y macerados en aceite 100% de girasol, con hongos secos y hojas de laurel que aportan profundidad y un aroma cálido. Un perfil intenso y terroso, perfecto para darle cuerpo y carácter a risottos, sopas y platos al horno.",
    "products.gourmetAjiTitle": "Ají Amarillo & Paprika",
    "products.gourmetAjiText1": "Ajos finamente picados y macerados en aceite 100% de girasol, con ají amarillo y hojuelas de paprika ahumada.",
    "products.gourmetAjiText2": "Un sabor intenso y equilibrado, ideal para realzar carnes, pastas y guisos con un toque de umami y calidez.",
    "products.gourmetZapalloTitle": "Zapallo Loche & Culantro*",
    "products.gourmetZapalloText": "Ajos finamente picados y macerados en aceite 100% de girasol, con zapallo loche rallado y toques de culantro. Cremoso, aromático y con ese sabor norteño inconfundible, perfecto para darle carácter a cualquier plato típico del norte del Perú.",
    "products.gourmetZapalloNote": "*PRÓXIMAMENTE",
    "products.gourmetChilliTitle": "Chilli Oil Peruano",
    "products.gourmetChilliText1": "Creado con pasión y dedicación, este garlic chili oil tiene el balance perfecto entre el mundo oriental y el criollo. Agrega el picante perfecto y resalta los sabores naturales de tus comidas.",
    "products.gourmetChilliText2": "Ingredientes: Ajos, ajíes & cebollas (confitados a fuego lento), aceite de ajonjolí, hojuelas de paprika, hongos secos, pecanas, nueces, finas hierbas, sal de maras y más.",
    "contact.title": "CONTÁCTANOS",
    "contact.subtitle": "Ventas al por mayor y menor.",
    "contact.text": "Escanea el QR para abrir el perfil.",
    "contact.instagram": "Instagram",
    "contact.form": "Formulario",
    "form.name": "Nombre",
    "form.email": "Email",
    "form.subject": "Asunto",
    "form.message": "Mensaje",
    "form.send": "Enviar"
  },
  en: {
    "nav.products": "Products",
    "nav.contact": "Contact",
    "hero.headline1": "Natural umami for your meals.",
    "hero.headline2": "No MSG or artificial preservatives.",
    "hero.headline3": "100% Artisan-made.",

    "products.gourmetTitle": "“GOURMET GARLIC”",
    "products.gourmetSubtitle": "Finely chopped garlic, macerated in 100% sunflower oil.",
    "products.gourmetFhTitle": "Fine Herbs & Maras Salt",
    "products.gourmetFhText1": "Finely chopped garlic, slowly infused in 100% sunflower oil, delicately scented with fine herbs and a touch of Maras salt.",
    "products.gourmetFhText2": "This result in a clean and aromatic flavor, with herbal notes that enhance your meals without overpowering. Perfect for adding a gourmet touch to fish, poultry, and vegetables.",
    "products.gourmetHongoTitle": "Mushrooms & Bay Leaf",
    "products.gourmetHongoText": "Finely chopped garlic, slowly infused in 100% sunflower oil with dried mushrooms and bay leaves to add depth and a warm aroma to your meals with an intense, earthy profile. Perfect for adding body and character to risottos, soups, and oven-baked dishes.",
    "products.gourmetAjiTitle": "Ají Amarillo & Paprika",
    "products.gourmetAjiText1": "Finely chopped garlic, slowly infused in 100% sunflower oil with ají amarillo (Peruvian Yellow Pepper) and smoked paprika flakes.",
    "products.gourmetAjiText2": "An intense and balanced flavor. Ideal for elevating meats, pastas, and stews with a spicy touch of umami and warmth.",
    "products.gourmetZapalloTitle": "Peruvian Loche Squash & Culantro*",
    "products.gourmetZapalloText": "Finely chopped garlic, slowly infused in 100% sunflower oil with grated Peruvian Loche squash and hints of culantro. Creamy and aromatic, with that unmistakable northern Peruvian flavor. Perfect for adding depth and character to classic dishes from Peru’s north coast.",
    "products.gourmetZapalloNote": "*AVAILABLE SOON",
    "products.gourmetChilliTitle": "Peruvian Chilli Oil",
    "products.gourmetChilliText1": "Crafted with passion and care, this garlic chili oil strikes the perfect balance between Eastern flavors and Peruvian tradition. It adds just the right heat and brings out the natural flavors of your meals.",
    "products.gourmetChilliText2": "Ingredients: Garlic, peppers & onions (slow-cooked), sesame oil, paprika flakes, dried mushrooms, pecans, walnuts, fine herbs, Maras salt, and more.",
    "contact.title": "CONTACT US",
    "contact.subtitle": "Wholesale and retail sales.",
    "contact.instagram": "Instagram",
    "contact.text": "Scan the QR code to open the profile.",

    "contact.form": "Contact form",
    "form.name": "Name",
    "form.email": "Email",
    "form.subject": "Subject",
    "form.message": "Message",
    "form.send": "Send"
  }
};

function setLanguage(lang) {
  const dict = translations[lang] || translations.es;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  // Update active button UI
  document.getElementById("langEs")?.classList.toggle("active", lang === "es");
  document.getElementById("langEn")?.classList.toggle("active", lang === "en");

  // Persist choice
  localStorage.setItem("lang", lang);
}

// Hook buttons
document.getElementById("langEs")?.addEventListener("click", () => setLanguage("es"));
document.getElementById("langEn")?.addEventListener("click", () => setLanguage("en"));

// On load: use saved language or default Spanish
const savedLang = localStorage.getItem("lang") || "es";
setLanguage(savedLang);
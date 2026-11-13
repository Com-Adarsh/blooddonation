import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

let initialized = false;
let lenisInstance = null;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const desktopPointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function injectLivingBackground() {
  if (document.querySelector(".living-background")) return;
  const layer = document.createElement("div");
  layer.className = "living-background";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = [
    '<span class="liquid-blob blob-a"></span>',
    '<span class="liquid-blob blob-b"></span>',
    '<span class="liquid-blob blob-c"></span>',
    '<span class="liquid-blob blob-d"></span>',
    '<span class="liquid-cell cell-a"></span>',
    '<span class="liquid-cell cell-b"></span>',
    '<span class="liquid-cell cell-c"></span>',
    '<span class="liquid-cell cell-d"></span>',
    '<div class="grain"></div>'
  ].join("");
  document.body.prepend(layer);
}

function injectBloodstream() {
  const main = document.querySelector("main");
  if (!main || main.querySelector(".bloodstream")) return;
  main.insertAdjacentHTML("afterbegin",
    '<svg class="bloodstream" aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 100 1000">' +
      '<defs><filter id="blood-glow"><feGaussianBlur stdDeviation="1.8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      '<path class="bloodstream-track" d="M50 0 C28 90 78 150 48 245 C18 340 82 405 54 505 C25 605 78 680 46 785 C27 850 62 920 50 1000"/>' +
      '<path class="bloodstream-line" d="M50 0 C28 90 78 150 48 245 C18 340 82 405 54 505 C25 605 78 680 46 785 C27 850 62 920 50 1000"/>' +
      '<g class="bloodstream-nodes"><circle cx="50" cy="0" r="3"/><circle cx="48" cy="245" r="3"/><circle cx="54" cy="505" r="3"/><circle cx="46" cy="785" r="3"/><circle cx="50" cy="1000" r="3"/></g>' +
    '</svg>'
  );
}

function injectStorySections() {
  const how = document.querySelector("#how-it-works");
  if (!how || document.querySelector("#safety-faq")) return;
  how.insertAdjacentHTML("afterend",
    '<section class="pulse-section shell" id="impact" aria-label="Campus pulse">' +
      '<div class="pulse-intro"><span class="section-kicker">CAMPUS PULSE</span><h2>Small actions keep support moving.</h2><p>These values come directly from the live Aashraya interface.</p></div>' +
      '<div class="pulse-stats">' +
        '<article class="pulse-stat glass"><strong data-live-stat="profiles">0</strong><span>student profiles in view</span></article>' +
        '<article class="pulse-stat glass"><strong>8</strong><span>blood groups supported</span></article>' +
        '<article class="pulse-stat glass"><strong>3</strong><span>steps to connect</span></article>' +
      '</div>' +
    '</section>' +
    '<section class="faq-section shell" id="safety-faq">' +
      '<div class="section-heading"><div><span class="section-kicker">SAFETY & ELIGIBILITY</span><h2>Clear answers, before you help.</h2><p>Critical guidance stays visible and does not depend on motion.</p></div></div>' +
      '<div class="faq-list">' +
        '<details class="faq-item glass"><summary>Who decides whether I can donate?</summary><p>A medical professional assesses donor suitability and eligibility. Aashraya only helps students connect.</p></details>' +
        '<details class="faq-item glass"><summary>Is my phone number public?</summary><p>No. Donor contact details stay private and are shared only with the authorized campus cell when required for coordination.</p></details>' +
        '<details class="faq-item glass"><summary>What should I do in an immediate emergency?</summary><p>Contact the hospital or local emergency services directly. Aashraya is a campus connection service, not an emergency dispatch service.</p></details>' +
      '</div>' +
    '</section>'
  );
}

function injectEcg() {
  const art = document.querySelector(".hero-art");
  if (!art || art.querySelector(".hero-ecg")) return;
  art.insertAdjacentHTML("beforeend",
    '<svg class="hero-ecg" aria-hidden="true" viewBox="0 0 420 90" preserveAspectRatio="none">' +
      '<path class="ecg-track" d="M0 46 H105 L126 46 L139 20 L153 70 L168 42 H214 L230 42 L242 12 L257 78 L270 46 H420"/>' +
      '<path class="ecg-line" d="M0 46 H105 L126 46 L139 20 L153 70 L168 42 H214 L230 42 L242 12 L257 78 L270 46 H420"/>' +
    '</svg>'
  );
}

function splitHeadline() {
  const heading = document.querySelector(".hero h1");
  if (!heading || heading.dataset.splitDone) return;
  heading.dataset.splitDone = "true";
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part.trim()) frag.appendChild(document.createTextNode(part));
        else {
          const span = document.createElement("span");
          span.className = "hero-word";
          span.textContent = part;
          frag.appendChild(span);
        }
      });
      node.replaceWith(frag);
      return;
    }
    Array.from(node.childNodes).forEach(walk);
  };
  walk(heading);
}

function initThemeToggle() {
  const button = document.querySelector("[data-theme-toggle]");
  if (!button || button.dataset.bound) return;
  button.dataset.bound = "true";
  const stored = localStorage.getItem("aashraya-theme");
  if (stored === "light") document.documentElement.dataset.theme = "light";
  const sync = () => {
    const light = document.documentElement.dataset.theme === "light";
    button.setAttribute("aria-pressed", String(light));
    button.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    button.textContent = light ? "☼" : "◐";
  };
  button.addEventListener("click", () => {
    const light = document.documentElement.dataset.theme === "light";
    document.documentElement.dataset.theme = light ? "dark" : "light";
    localStorage.setItem("aashraya-theme", light ? "dark" : "light");
    sync();
  });
  sync();
}

function initGlassCards() {
  if (!desktopPointer()) return;
  document.querySelectorAll(".glass, .donor-card, .step-card, .activity-panel, .care-note").forEach((card) => {
    if (card.dataset.glassBound) return;
    card.dataset.glassBound = "true";
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((event.clientX - rect.left) / rect.width * 100).toFixed(2) + "%");
      card.style.setProperty("--my", ((event.clientY - rect.top) / rect.height * 100).toFixed(2) + "%");
      if (!reducedMotion() && card.classList.contains("donor-card")) {
        const rx = ((event.clientY - rect.top) / rect.height - 0.5) * -3.5;
        const ry = ((event.clientX - rect.left) / rect.width - 0.5) * 4;
        card.style.transform = "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-3px)";
      }
    });
    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--mx");
      card.style.removeProperty("--my");
      card.style.transform = "";
    });
  });
}

function initMagneticButtons() {
  if (!desktopPointer() || reducedMotion()) return;
  document.querySelectorAll(".button-primary, .button-white, .header-cta").forEach((button) => {
    if (button.dataset.magnetic) return;
    button.dataset.magnetic = "true";
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
      button.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
    });
    button.addEventListener("pointerleave", () => button.style.transform = "");
  });
}

function initCursorGlow() {
  if (!desktopPointer() || reducedMotion() || document.querySelector(".cursor-glow")) return;
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  glow.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);
  let raf = 0;
  let x = window.innerWidth / 2, y = window.innerHeight / 2, tx = x, ty = y;
  window.addEventListener("pointermove", (event) => { tx = event.clientX; ty = event.clientY; }, { passive: true });
  const tick = () => {
    x += (tx - x) * 0.14; y += (ty - y) * 0.14;
    glow.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

function initMotion() {
  if (initialized) return;
  initialized = true;
  injectLivingBackground();
  injectBloodstream();
  injectStorySections();
  splitHeadline();
  injectEcg();
  initThemeToggle();
  initGlassCards();
  initMagneticButtons();
  initCursorGlow();

  if (reducedMotion()) {
    document.documentElement.classList.add("reduced-motion");
    return;
  }

  lenisInstance = new Lenis({ duration: 1.05, smoothWheel: true, anchors: true, allowNestedScroll: true, autoRaf: false });
  lenisInstance.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenisInstance?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const bloodstream = document.querySelector(".bloodstream-line");
  if (bloodstream) {
    const length = bloodstream.getTotalLength();
    gsap.set(bloodstream, { strokeDasharray: length, strokeDashoffset: length });
    gsap.to(bloodstream, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: { trigger: "main", start: "top top", end: "bottom bottom", scrub: 1.2 }
    });
  }

  gsap.from(".hero-word", {
    yPercent: 110,
    opacity: 0,
    filter: "blur(9px)",
    duration: 0.9,
    ease: "power4.out",
    stagger: 0.045,
    delay: 0.08
  });
  gsap.from(".hero-text, .hero-actions, .hero-note", {
    y: 24, opacity: 0, filter: "blur(8px)", duration: 0.8, ease: "power3.out", stagger: 0.1, delay: 0.35
  });
  gsap.to(".art-heart", { scale: 1.08, duration: 1.15, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".ecg-line", { strokeDashoffset: 0, duration: 2.2, repeat: -1, ease: "none" });

  gsap.utils.toArray(".section-heading, .donor-card, .step-card, .activity-panel, .care-note, .pulse-section, .faq-item").forEach((el) => {
    gsap.from(el, {
      y: 34, opacity: 0, filter: "blur(8px)", duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 86%", once: true }
    });
  });

  gsap.utils.toArray(".liquid-cell").forEach((cell, i) => {
    gsap.to(cell, { y: i % 2 ? -80 : 90, x: i % 2 ? 30 : -24, duration: 5 + i, repeat: -1, yoyo: true, ease: "sine.inOut" });
  });

  const sections = ["discover", "how-it-works", "impact", "safety-faq", "activity"];
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  sections.forEach((id) => {
    const section = document.getElementById(id);
    if (!section) return;
    ScrollTrigger.create({
      trigger: section, start: "top 45%", end: "bottom 45%",
      onToggle: (self) => {
        if (!self.isActive) return;
        navLinks.forEach((link) => link.classList.toggle("is-current", link.getAttribute("href") === "#" + id));
      }
    });
  });

  const header = document.querySelector(".site-header");
  ScrollTrigger.create({
    start: 40,
    end: "max",
    onUpdate: (self) => header?.classList.toggle("is-scrolled", self.scroll() > 40)
  });

  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      gsap.fromTo(chip, { scale: 0.94 }, { scale: 1, duration: 0.35, ease: "back.out(2)" });
    });
  });

  document.querySelectorAll(".button, .filter-chip").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.remove("click-ripple");
      void button.offsetWidth;
      button.classList.add("click-ripple");
    });
  });

  const stat = document.querySelector('[data-live-stat="profiles"]');
  const countNode = document.getElementById("result-count");
  if (stat && countNode) {
    const updateStat = () => {
      const value = parseInt((countNode.textContent || "0").replace(/\D/g, ""), 10) || 0;
      gsap.to(stat, { innerText: value, duration: 0.55, snap: { innerText: 1 }, ease: "power2.out" });
    };
    updateStat();
    new MutationObserver(updateStat).observe(countNode, { childList: true });
  }

  const pointer = { x: 0, y: 0 };
  if (desktopPointer()) {
    window.addEventListener("pointermove", (event) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
      document.documentElement.style.setProperty("--pointer-x", pointer.x.toFixed(3));
      document.documentElement.style.setProperty("--pointer-y", pointer.y.toFixed(3));
    }, { passive: true });
  }

  const donorList = document.getElementById("donor-list");
  if (donorList) {
    new MutationObserver(() => {
      initGlassCards();
      if (!reducedMotion()) {
        donorList.querySelectorAll(".donor-card").forEach((card) => {
          gsap.fromTo(card, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" });
        });
      }
    }).observe(donorList, { childList: true });
  }

  ScrollTrigger.refresh();
}

export function initAashrayaMotion() {
  requestAnimationFrame(initMotion);
}

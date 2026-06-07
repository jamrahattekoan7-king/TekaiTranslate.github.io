// Premium Tekoan Translator - 2026 Edition
// ============================================

let dictionary = {};
let examData = [];
let infoData = [];
let translationHistory = [];
const MAX_HISTORY = 10;

// ============================================
// INITIALIZATION & DATA LOADING
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  initializeElements();
  setupEventListeners();
  loadData();
  setupAnimationObservers();
  initializeNavigation();
});

function initializeElements() {
  window.inputText = document.getElementById("inputText");
  window.outputText = document.getElementById("outputText");
  window.translateBtn = document.getElementById("translateBtn");
  window.swapBtn = document.getElementById("swapBtn");
  window.sourceLang = document.getElementById("sourceLang");
  window.targetLang = document.getElementById("targetLang");
  window.playTranslationBtn = document.getElementById("playTranslationBtn");
  window.autoplayCheckbox = document.getElementById("autoplayCheckbox");
}

// ============================================
// DATA LOADING WITH ANIMATIONS
// ============================================

function loadData() {
  Promise.all([
    fetch("tekoan_eksam_output.json").then(res => res.json()).catch(() => []),
    fetch("tekoan_info_output.json").then(res => res.json()).catch(() => []),
    window.dataLoader.loadAll().catch(() => ({ pairs: [] }))
  ]).then(([examJson, infoJson, loaderData]) => {
    examData = examJson || [];
    infoData = infoJson || [];
    renderExamData();
    renderInfoData();
    renderPhrasebookPreview(loaderData.pairs || []);
  }).catch(err => console.log("Data loading handled gracefully", err));
}

function renderExamData() {
  const container = document.getElementById("examData");
  if (!container) return;
  
  container.innerHTML = examData.map((page, idx) => `
    <div class="exam-page content-page" style="animation-delay: ${idx * 100}ms;">
      <p>${page.content || ''}</p>
    </div>
  `).join("");
  
  addStaggerAnimation(container.querySelectorAll(".exam-page"));
}

function renderInfoData() {
  const container = document.getElementById("infoData");
  if (!container) return;
  
  container.innerHTML = infoData.map((page, idx) => `
    <div class="info-page content-page" style="animation-delay: ${idx * 100}ms;">
      <p>${page.content || ''}</p>
    </div>
  `).join("");
  
  addStaggerAnimation(container.querySelectorAll(".info-page"));
}

function renderPhrasebookPreview(pairs) {
  const container = document.getElementById('phraseList');
  if (!container) return;
  
  const visiblePhrases = pairs
    .filter(p => p.term && p.gloss)
    .slice(0, 8)
    .map((p, idx) => ({
      term: p.term.trim(),
      gloss: p.gloss.trim(),
      id: `phrase-preview-${idx}`
    }));

  if (!visiblePhrases.length) {
    container.innerHTML = '<div class="phrase-empty">No phrasebook entries available.</div>';
    return;
  }

  container.innerHTML = visiblePhrases.map(phrase => `
    <button class="phrase-item" type="button" data-term="${escapeHtml(phrase.term)}" data-gloss="${escapeHtml(phrase.gloss)}">
      <div class="phrase-term">${escapeHtml(phrase.term)}</div>
      <div class="phrase-gloss">${escapeHtml(phrase.gloss)}</div>
    </button>
  `).join('');

  container.querySelectorAll('.phrase-item').forEach(button => {
    button.addEventListener('click', () => {
      const phrase = button.dataset.term || '';
      const gloss = button.dataset.gloss || '';
      if (window.sourceLang && window.targetLang) {
        window.inputText.value = window.sourceLang.value === 'en' ? gloss : phrase;
        window.outputText.value = window.sourceLang.value === 'en' ? phrase : gloss;
        animateOutputText(window.outputText);
      }
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================
// PREMIUM ANIMATIONS & EFFECTS
// ============================================

function addStaggerAnimation(elements) {
  elements.forEach((el, idx) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    setTimeout(() => {
      el.style.transition = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, idx * 150);
  });
}

function pulseButton(element) {
  element.style.animation = "none";
  setTimeout(() => {
    element.style.animation = "pulse 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
  }, 10);
}

function shimmerEffect(element) {
  element.style.backgroundImage = "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)";
  element.style.backgroundSize = "200% 100%";
  element.style.animation = "shimmer 2s infinite";
}

// ============================================
// DICTIONARY SETUP
// ============================================

dictionary = {
  "hello": "akisa",
  "hi": "aka",
  "thank you": "damsen",
  "yes": "sai",
  "no": "saito",
  "good morning": "sazbah asam",
  "good night": "sazbah luan",
  "goodbye": "sidak",
  "ok": "meso",
  "water": "zan",
  "food": "kil",
  "love": "tam",
  "friend": "mika",
  "family": "tara",
  "help": "dun",
  "sorry": "xalaf",
  "please": "lotia",
  "welcome": "bisa",
  "beautiful": "sazi",
  "strong": "vok"
};

window.dictionary = Object.fromEntries(Object.entries(dictionary).map(([k,v]) => [String(k).toLowerCase().trim(), v]));
const reverseDictionary = Object.fromEntries(Object.entries(window.dictionary).map(([en, tk]) => [String(tk).toLowerCase().trim(), en]));
window.reverseDictionary = reverseDictionary;

// ============================================
// EVENT LISTENERS & INTERACTIONS
// ============================================

function setupEventListeners() {
  if (window.swapBtn) {
    window.swapBtn.addEventListener("click", handleSwapLanguages);
    window.swapBtn.addEventListener("mouseenter", () => addGlowEffect(window.swapBtn));
  }

  if (window.translateBtn) {
    window.translateBtn.addEventListener("click", handleTranslate);
    window.translateBtn.addEventListener("mouseenter", () => addGlowEffect(window.translateBtn));
  }

  if (window.playTranslationBtn) {
    window.playTranslationBtn.addEventListener('click', async () => {
      const out = window.outputText?.value || '';
      if (!out) { showNotification('Nothing to play', 'warning'); return; }
      try { await window.speakText(out); } catch (err) { showNotification('TTS error', 'warning'); }
    });
  }

  if (window.inputText) {
    window.inputText.addEventListener("input", handleInputChange);
    window.inputText.addEventListener("focus", () => addFocusGlow(window.inputText));
    window.inputText.addEventListener("blur", () => removeFocusGlow(window.inputText));
  }

  if (window.sourceLang && window.targetLang) {
    window.sourceLang.addEventListener("change", handleLanguageChange);
    window.targetLang.addEventListener("change", handleLanguageChange);
  }

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && window.translateBtn) {
      handleTranslate();
    }
  });
}

function handleSwapLanguages() {
  const temp = window.sourceLang.value;
  window.sourceLang.value = window.targetLang.value;
  window.targetLang.value = temp;
  
  pulseButton(window.swapBtn);
  addRippleEffect(window.swapBtn);
  
  window.outputText.value = "";
  window.inputText.value = "";
  window.inputText.focus();
}

function handleLanguageChange() {
  window.outputText.value = "";
  addTransitionEffect(window.sourceLang);
  addTransitionEffect(window.targetLang);
}

function handleInputChange() {
  const text = window.inputText.value.trim();
  if (text.length > 0 && !window.outputText.value) {
    window.outputText.style.opacity = "0.5";
  }
}

async function handleTranslate() {
  const source = window.sourceLang.value;
  const target = window.targetLang.value;
  const raw = window.inputText.value || '';
  const text = raw.trim();

  if (!text) {
    showNotification("Please enter text to translate", "warning");
    return;
  }

  pulseButton(window.translateBtn);
  let translation = '';

  try {
    if (window.translateService && typeof window.translateService.translate === 'function'){
      translation = await window.translateService.translate(text, source, target);
    } else {
      // fallback to old dictionary lookup
      const low = text.toLowerCase();
      if (source === 'en' && target === 'tk') translation = dictionary[low] || 'Translation not found in dictionary.';
      else if (source === 'tk' && target === 'en') translation = reverseDictionary[low] || 'Translation not found in dictionary.';
      else translation = 'Unsupported language pair.';
    }
  } catch (err) {
    console.error('Translation error:', err);
    translation = 'Error during translation.';
  }

  window.outputText.value = translation;
  animateOutputText(window.outputText);
  addToHistory(text, translation, source, target);

  // autoplay if enabled
  try {
    if (window.autoplayCheckbox && window.autoplayCheckbox.checked && translation) {
      await window.speakText(translation);
    }
  } catch (err) {
    console.error('Autoplay TTS error:', err);
  }
}

function animateOutputText(element) {
  element.style.opacity = "0";
  element.style.transform = "scale(0.98)";
  
  setTimeout(() => {
    element.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
    element.style.opacity = "0.9";
    element.style.transform = "scale(1)";
  }, 50);
}

// ============================================
// ANIMATION UTILITIES
// ============================================

function addGlowEffect(element) {
  element.style.boxShadow = "0 0 20px rgba(201, 162, 39, 0.6), 0 0 40px rgba(123, 31, 61, 0.3)";
  element.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
}

function addFocusGlow(element) {
  element.style.boxShadow = "0 0 0 3px rgba(111, 90, 224, 0.15), 0 10px 15px rgba(0, 0, 0, 0.08)";
  element.parentElement?.style?.setProperty("animation", "focusPulse 0.6s ease-out");
}

function removeFocusGlow(element) {
  element.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";
}

function addRippleEffect(element) {
  const ripple = document.createElement("span");
  ripple.style.position = "absolute";
  ripple.style.borderRadius = "50%";
  ripple.style.background = "radial-gradient(circle, rgba(255,255,255,0.6), transparent)";
  ripple.style.width = "20px";
  ripple.style.height = "20px";
  ripple.style.pointerEvents = "none";
  ripple.style.animation = "ripple 0.6s ease-out";
  
  element.style.position = "relative";
  element.style.overflow = "hidden";
  element.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 600);
}

function addTransitionEffect(element) {
  element.style.animation = "none";
  setTimeout(() => {
    element.style.animation = "slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
  }, 10);
}

// ============================================
// HISTORY & NOTIFICATIONS
// ============================================

function addToHistory(input, output, source, target) {
  translationHistory.unshift({ input, output, source, target, timestamp: new Date() });
  if (translationHistory.length > MAX_HISTORY) {
    translationHistory.pop();
  }
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${type === "warning" ? "#d97706" : "#0d9488"};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 500;
    letter-spacing: 0.3px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
    setTimeout(() => notification.remove(), 400);
  }, 3000);
}

// ============================================
// NAVIGATION INTERACTIONS
// ============================================

function initializeNavigation() {
  const navLinks = document.querySelectorAll(".navbar nav a");
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      shimmerEffect(link);
    });
  });
}

// ============================================
// INTERSECTION OBSERVER FOR LAZY ANIMATIONS
// ============================================

function setupAnimationObservers() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -100px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = "slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards";
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll(".content-page, .translation-box").forEach(el => {
    observer.observe(el);
  });
}

// ============================================
// CSS ANIMATIONS (Injected)
// ============================================

const style = document.createElement("style");
style.textContent = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.9; }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  
  @keyframes ripple {
    0% { transform: scale(0); opacity: 1; }
    100% { transform: scale(4); opacity: 0; }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  @keyframes slideDown {
    from { transform: translateY(-5px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes focusPulse {
    0% { box-shadow: 0 0 0 0 rgba(111, 90, 224, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(111, 90, 224, 0); }
    100% { box-shadow: 0 0 0 0 rgba(111, 90, 224, 0); }
  }
`;

document.head.appendChild(style);

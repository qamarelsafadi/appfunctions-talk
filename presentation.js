/**
 * Presentation Engine
 * Handles slide navigation, keyboard controls, touch gestures,
 * progress tracking, and fullscreen mode.
 */

(function () {
  'use strict';

  // ---- State ----
  const state = {
    currentSlide: 1,
    totalSlides: 0,
    isAnimating: false,
    touchStartX: 0,
    touchStartY: 0,
  };

  // ---- DOM References ----
  const slides = document.querySelectorAll('.slide');
  const progressBar = document.getElementById('progressBar');
  const currentSlideEl = document.getElementById('currentSlide');
  const totalSlidesEl = document.getElementById('totalSlides');
  const fullscreenBtn = document.getElementById('fullscreenBtn');

  state.totalSlides = slides.length;
  totalSlidesEl.textContent = String(state.totalSlides).padStart(2, '0');

  // ---- Navigation ----
  function goToSlide(n) {
    if (state.isAnimating) return;
    if (n < 1 || n > state.totalSlides) return;
    if (n === state.currentSlide) return;

    state.isAnimating = true;
    const direction = n > state.currentSlide ? 1 : -1;

    const currentEl = slides[state.currentSlide - 1];
    const nextEl = slides[n - 1];

    // Exit current slide
    currentEl.classList.remove('active');
    currentEl.classList.add(direction === 1 ? 'exit-left' : 'exit-right');

    // Prepare next slide entry direction
    nextEl.style.transform = direction === 1 ? 'translateX(60px)' : 'translateX(-60px)';
    nextEl.classList.remove('exit-left', 'exit-right');

    // Force reflow
    void nextEl.offsetWidth;

    // Activate next slide
    nextEl.style.transform = '';
    nextEl.classList.add('active');

    // Update state
    state.currentSlide = n;
    updateUI();

    // Update URL hash
    history.replaceState(null, '', `#${n}`);

    // Reset animation lock
    setTimeout(() => {
      state.isAnimating = false;
      currentEl.classList.remove('exit-left', 'exit-right');
    }, 600);
  }

  function nextSlide() {
    goToSlide(state.currentSlide + 1);
  }

  function prevSlide() {
    goToSlide(state.currentSlide - 1);
  }

  function updateUI() {
    // Update counter
    currentSlideEl.textContent = String(state.currentSlide).padStart(2, '0');

    // Update progress bar
    const progress = ((state.currentSlide) / state.totalSlides) * 100;
    progressBar.style.width = `${progress}%`;
  }

  // ---- Keyboard Controls ----
  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
      case 'PageDown':
        e.preventDefault();
        nextSlide();
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        prevSlide();
        break;

      case 'Home':
        e.preventDefault();
        goToSlide(1);
        break;

      case 'End':
        e.preventDefault();
        goToSlide(state.totalSlides);
        break;

      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;

      case 'Escape':
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        break;

      default:
        // Number keys 1-9 for quick jump (first 9 slides)
        if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey) {
          const num = parseInt(e.key);
          if (num <= state.totalSlides) {
            e.preventDefault();
            goToSlide(num);
          }
        }
        break;
    }
  });

  // ---- Touch Gestures ----
  document.addEventListener('touchstart', (e) => {
    state.touchStartX = e.changedTouches[0].screenX;
    state.touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const deltaX = e.changedTouches[0].screenX - state.touchStartX;
    const deltaY = e.changedTouches[0].screenY - state.touchStartY;

    // Only process horizontal swipes that are more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }, { passive: true });

  // ---- Click navigation (left/right halves) ----
  document.querySelector('.presentation').addEventListener('click', (e) => {
    // Don't navigate if clicking on interactive elements
    if (e.target.closest('a, button, .code-block, .terminal, .resource-link')) return;

    const x = e.clientX;
    const width = window.innerWidth;

    if (x > width * 0.65) {
      nextSlide();
    } else if (x < width * 0.35) {
      prevSlide();
    }
  });

  // ---- Fullscreen ----
  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  fullscreenBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFullscreen();
  });

  // ---- Hash-based navigation ----
  function handleHash() {
    const hash = window.location.hash.slice(1);
    const slideNum = parseInt(hash);
    if (slideNum && slideNum >= 1 && slideNum <= state.totalSlides) {
      // Direct jump without animation on load
      slides.forEach((s) => {
        s.classList.remove('active', 'exit-left');
      });
      slides[slideNum - 1].classList.add('active');
      state.currentSlide = slideNum;
      updateUI();
    }
  }

  window.addEventListener('hashchange', handleHash);

  // ---- Presenter Notes (console) ----
  const presenterNotes = {
    1: "Welcome everyone. Today I'll show you how Android apps can become on-device MCP-style servers using AppFunctions.",
    2: "We've all been there — switching between apps. AI agents can solve this, but they need structured access, not UI hacks.",
    3: "AppFunctions give your app a self-describing API that agents can discover and invoke. It's the MCP pattern, but native on Android.",
    4: "Here's the full pipeline. You write the function, KSP generates metadata, system indexes it, agents discover and execute it.",
    5: "Our demo app has three simple functions. searchContacts is the entry point — you must call it before sending or calling.",
    6: "Here's the Gradle setup. Three dependencies plus one KSP config flag.",
    7: "This is what a real AppFunction looks like. Notice the KDoc — it's critical. The annotation just marks it; the KDoc describes behavior.",
    8: "Bad KDoc means the agent won't know when or how to call your function. Good KDoc acts as the instruction manual for the AI.",
    9: "You also need to register the service in your manifest, describe your app in metadata, and set up a configuration provider.",
    10: "Before waiting for Gemini integration, test with ADB. This command lists all registered functions on device.",
    11: "Demo time — let's ask Gemini to find Alice and send her a message.",
    12: "Under the hood, the agent chains function calls. searchContacts returns an endpoint, which feeds into sendMessage.",
    13: "If you know MCP, you already understand AppFunctions. Same philosophy — expose tools, let AI orchestrate. But native on Android.",
    14: "Current status — the API is live on Android 16+, the Jetpack library is alpha, and Gemini integration is in private preview.",
    15: "Four key takeaways: write great KDoc, design composable functions, make errors readable, and test with ADB early.",
    16: "Links to everything we covered today.",
    17: "Your app is no longer just an app — it's an MCP server for AI agents. Thank you!",
  };

  // Log presenter notes to console for speaker reference
  const originalGoToSlide = goToSlide;
  function goToSlideWithNotes(n) {
    originalGoToSlide(n);
    if (presenterNotes[n]) {
      console.log(`%c🎤 Slide ${n} Notes:`, 'color: #4285f4; font-weight: bold; font-size: 14px;');
      console.log(`%c${presenterNotes[n]}`, 'color: #a8b8d0; font-size: 12px;');
    }
  }

  // Override navigation to include notes
  window.goToSlide = goToSlideWithNotes;

  // ---- Initialize ----
  handleHash();
  updateUI();

  // Log initial notes
  if (presenterNotes[state.currentSlide]) {
    console.log(`%c🎤 Slide ${state.currentSlide} Notes:`, 'color: #4285f4; font-weight: bold; font-size: 14px;');
    console.log(`%c${presenterNotes[state.currentSlide]}`, 'color: #a8b8d0; font-size: 12px;');
  }

  console.log('%c🎤 Presentation Controls:', 'color: #4285f4; font-weight: bold; font-size: 14px;');
  console.log('%c  ← → Arrow keys to navigate', 'color: #a8b8d0;');
  console.log('%c  F    Toggle fullscreen', 'color: #a8b8d0;');
  console.log('%c  1-9  Jump to slide', 'color: #a8b8d0;');
  console.log('%c  Click left/right halves to navigate', 'color: #a8b8d0;');

})();

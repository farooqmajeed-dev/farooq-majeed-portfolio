(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

  /* ========================================================================
     1. Two-State Color Scheme Toggle
     ======================================================================== */
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  const themeToggleBtn = document.getElementById('theme-toggle');
  const darkMql = window.matchMedia('(prefers-color-scheme: dark)');

  const getSystemScheme = () => (darkMql.matches ? 'dark' : 'light');
  const getStoredScheme = () => {
    try {
      const val = localStorage.getItem('color-scheme');
      return val === 'light' || val === 'dark' ? val : null;
    } catch {
      return null;
    }
  };
  const applyScheme = (scheme) => {
    metaColorScheme.content = scheme ?? 'light dark';
  };

  if (themeToggleBtn && metaColorScheme) {
    themeToggleBtn.addEventListener('click', () => {
      const currentRendered = getStoredScheme() ?? getSystemScheme();
      const target = currentRendered === 'dark' ? 'light' : 'dark';
      const system = getSystemScheme();

      try {
        if (target === system) {
          localStorage.removeItem('color-scheme');
          applyScheme(null);
        } else {
          localStorage.setItem('color-scheme', target);
          applyScheme(target);
        }
      } catch {
        applyScheme(target === system ? null : target);
      }
    });

    window.addEventListener('storage', (event) => {
      if (event.key === 'color-scheme') {
        const val = event.newValue;
        applyScheme(val === 'light' || val === 'dark' ? val : null);
      }
    });
  }

  /* ========================================================================
     2. Scroll Progress Fallback (when animation-timeline: scroll() unsupported)
     ======================================================================== */
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar && !prefersReducedMotion && !CSS.supports('animation-timeline', 'scroll()')) {
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      progressBar.style.transform = `scaleX(${pct})`;
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  /* ========================================================================
     3. Hero Pointer Spotlight & 3D Card Tilt (Fine Pointer + Motion Allowed)
     ======================================================================== */
  if (!prefersReducedMotion && hasFinePointer) {
    const heroSection = document.getElementById('top');
    heroSection?.addEventListener('pointermove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      heroSection.style.setProperty('--mx', `${x.toFixed(1)}%`);
      heroSection.style.setProperty('--my', `${y.toFixed(1)}%`);
    });

    document.querySelectorAll('.tilt-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-2px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ========================================================================
     4. Interactive Developer Console (Audit Replay + Tab Switch)
     ======================================================================== */
  const auditLines = document.querySelectorAll('.audit-line');
  const rerunBtn = document.getElementById('rerun-audit');
  const consoleTabs = document.querySelectorAll('.console-tab');
  const consolePanels = document.querySelectorAll('[data-console-panel]');

  const playAuditAnimation = () => {
    if (prefersReducedMotion) {
      auditLines.forEach((line) => line.classList.add('is-shown'));
      return;
    }
    auditLines.forEach((line) => line.classList.remove('is-shown'));
    auditLines.forEach((line) => {
      const delay = Number(line.dataset.delay || 0);
      setTimeout(() => line.classList.add('is-shown'), delay);
    });
  };

  playAuditAnimation();
  rerunBtn?.addEventListener('click', () => {
    // Switch back to audit tab if currently viewing profile.json
    consoleTabs.forEach((t) => {
      const active = t.dataset.consoleTab === 'audit';
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    consolePanels.forEach((p) => {
      p.hidden = p.dataset.consolePanel !== 'audit';
    });
    playAuditAnimation();
  });

  consoleTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.consoleTab;
      consoleTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      consolePanels.forEach((panel) => {
        panel.hidden = panel.dataset.consolePanel !== target;
      });
    });
  });

  /* ========================================================================
     5. Animated Stat Counters
     ======================================================================== */
  const counterEls = document.querySelectorAll('[data-count]');
  if (!prefersReducedMotion && counterEls.length) {
    counterEls.forEach((el) => {
      const target = Number(el.dataset.count);
      const decimals = Number(el.dataset.decimals || 0);
      const suffix = el.dataset.suffix || '';
      const duration = 1100;
      const start = performance.now();

      const step = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = (target * eased).toFixed(decimals);
        el.textContent = `${value}${suffix}`;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ========================================================================
     6. Tech Marquee Pause / Play Control (WCAG 2.2.2)
     ======================================================================== */
  const marqueeToggle = document.getElementById('marquee-toggle');
  const marqueeTrack = document.getElementById('marquee-track');

  marqueeToggle?.addEventListener('click', () => {
    const paused = marqueeTrack?.classList.toggle('is-paused');
    marqueeToggle.textContent = paused ? 'Play' : 'Pause';
    marqueeToggle.setAttribute(
      'aria-label',
      paused ? 'Play scrolling tech stack' : 'Pause scrolling tech stack'
    );
  });

  /* ========================================================================
     7. Skills Category Filter Tabs
     ======================================================================== */
  const filterButtons = document.querySelectorAll('.filter-chip');
  const skillCards = document.querySelectorAll('.skill-card');

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      filterButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });

      skillCards.forEach((card) => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.hidden = !match;
      });
    });
  });

  /* ========================================================================
     8. Project Case Study Modal (<dialog> with Top-Layer Exit Fallback)
     ======================================================================== */
  const projectData = {
    bookscribe: {
      year: '2022',
      title: 'BookScribe Online',
      badge: 'Frontend UX & Technical SEO',
      summary:
        'Designed, developed, and optimized the frontend user experience and technical SEO foundation for BookScribe Online.',
      bullets: [
        'Architected responsive landing pages and conversion-focused UI flows.',
        'Applied technical SEO best practices and load-speed optimization.',
        'Drove 100+ customer acquisitions through improved UX and search visibility.'
      ]
    },
    aps: {
      year: '2023',
      title: 'American Publishing Studios',
      badge: 'Web Platform & Performance Tuning',
      summary:
        'Built and maintained the web platform with data-driven technical SEO and frontend performance tuning.',
      bullets: [
        'Refactored assets, caching, and page structure for faster Core Web Vitals.',
        'Implemented structured technical SEO and analytics tracking.',
        'Achieved top USA search rankings for target publishing keywords.'
      ]
    },
    security: {
      year: '2024',
      title: 'Security & Uptime Infrastructure',
      badge: 'Server Hardening & Reliability',
      summary:
        'Deployed Imunify360, SSL/TLS encryption, and server hardening protocols across 350+ managed web properties.',
      bullets: [
        'Standardized SSL/TLS and Imunify360 protection across cPanel / WHM & Hostwinds.',
        'Reduced security vulnerabilities by 30% across the managed fleet.',
        'Maintained 99.9% security uptime for client production websites.'
      ]
    },
    campaign: {
      year: '2024',
      title: 'Digital Campaign & Design Leadership',
      badge: 'Creative Production & Brand Visibility',
      summary:
        'Led end-to-end design production for digital campaigns, social media assets, book trailers, and press releases.',
      bullets: [
        'Coordinated visual assets across marketing, design, and product teams.',
        'Delivered cohesive campaign collateral to expand digital visibility.',
        'Aligned creative deliverables with measurable user engagement goals.'
      ]
    }
  };

  const modal = document.getElementById('project-modal');
  const modalYear = document.getElementById('modal-year');
  const modalTitle = document.getElementById('modal-title');
  const modalBadge = document.getElementById('modal-badge');
  const modalSummary = document.getElementById('modal-summary');
  const modalBullets = document.getElementById('modal-bullets');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalContactLink = document.getElementById('modal-contact-link');

  let supportsDisplayTransition;
  const canTransitionDisplay = () => {
    if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
    if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
      return false;
    }
    const probe = document.createElement('div');
    probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
    document.body.appendChild(probe);
    getComputedStyle(probe).display;
    probe.style.display = 'none';
    supportsDisplayTransition = getComputedStyle(probe).display === 'block';
    probe.remove();
    return supportsDisplayTransition;
  };

  const supportsTopLayerExit = () =>
    window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay();

  const closeTopLayer = async (element, reason = '') => {
    if (!element?.open) return;
    if (!supportsTopLayerExit()) {
      element.setAttribute('data-closing', '');
      const animations = element.getAnimations({ subtree: true });
      if (animations.length > 0) {
        await Promise.race([
          Promise.allSettled(animations.map((a) => a.finished)),
          new Promise((r) => setTimeout(r, 400))
        ]);
      }
      if (!element.hasAttribute('data-closing')) return;
      element.removeAttribute('data-closing');
    }
    element.close(reason);
  };

  document.querySelectorAll('.project-detail-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const data = projectData[btn.dataset.project];
      if (!data || !modal) return;

      modalYear.textContent = data.year;
      modalTitle.textContent = data.title;
      modalBadge.textContent = data.badge;
      modalSummary.textContent = data.summary;
      modalBullets.replaceChildren(
        ...data.bullets.map((text) => {
          const li = document.createElement('li');
          li.textContent = text;
          return li;
        })
      );
      modal.showModal();
    });
  });

  if (modal) {
    modalCloseBtn?.addEventListener('click', () => closeTopLayer(modal, 'close'));
    modalContactLink?.addEventListener('click', () => closeTopLayer(modal, 'contact'));

    modal.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeTopLayer(modal, 'cancel');
    });

    modal.addEventListener('close', () => {
      modal.returnValue = '';
    });

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e) => {
        const r = modal.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      modal.addEventListener('pointerdown', (e) => {
        pressedOutside = outside(e);
      });
      modal.addEventListener('pointerup', (e) => {
        if (pressedOutside && outside(e)) closeTopLayer(modal, 'backdrop');
      });
    }
  }

  /* ========================================================================
     9. Accessible Contact Form Validation (:user-invalid + ARIA Sync)
     ======================================================================== */
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  const linkError = (el, shown) => {
    const errorId = el.dataset.error;
    if (!errorId) return;
    const ids = (el.getAttribute('aria-describedby') || '')
      .split(/\s+/)
      .filter((id) => id && id !== errorId);
    if (shown) ids.push(errorId);
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
    else el.removeAttribute('aria-describedby');
  };

  if (contactForm) {
    const supportsUserInvalid = CSS.supports('selector(:user-invalid)');
    const dirtyState = new WeakMap();

    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.classList.add('visually-hidden');
    document.body.append(announcer);
    let announceTimer;
    let announcedField;

    const spokenText = (node) => {
      const copy = node.cloneNode(true);
      copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
      copy.querySelectorAll('[role="img"][aria-label]').forEach((n) => {
        n.replaceWith(`${n.getAttribute('aria-label')}: `);
      });
      return copy.textContent.replace(/\s+/g, ' ').trim();
    };

    const announceError = (el) => {
      const error = document.getElementById(el.dataset.error);
      if (!error) return;
      const label = el.labels?.[0] ? `${spokenText(el.labels[0])}: ` : '';
      clearTimeout(announceTimer);
      announcer.textContent = '';
      announcedField = el;
      announceTimer = setTimeout(() => {
        announcer.textContent = label + spokenText(error);
      }, 500);
    };

    const flagged = new WeakSet();
    const announced = new WeakSet();

    const syncAria = (el, announce = false) => {
      if (!el.matches?.('input, select, textarea')) return;
      const invalid = supportsUserInvalid
        ? el.matches(':user-invalid')
        : el.classList.contains('user-invalid-fallback');

      if (invalid) {
        if (announce && !announced.has(el)) {
          announceError(el);
          announced.add(el);
        }
        el.setAttribute('aria-invalid', 'true');
        linkError(el, true);
        flagged.add(el);
      } else if (flagged.has(el) || el.getAttribute('aria-invalid') !== 'true') {
        el.setAttribute('aria-invalid', 'false');
        linkError(el, false);
        flagged.delete(el);
        announced.delete(el);
        if (announcedField === el) {
          clearTimeout(announceTimer);
          announcer.textContent = '';
        }
      }
    };

    contactForm.querySelectorAll('input, textarea').forEach((el) => syncAria(el));

    if (!supportsUserInvalid) {
      const updateFallback = (input) => {
        const isValid = input.validity.valid;
        input.classList.toggle('user-invalid-fallback', !isValid);
        input.classList.toggle('user-valid-fallback', isValid);
        syncAria(input, !isValid);
      };

      contactForm.addEventListener('blur', (e) => {
        if (!e.target.checkValidity) return;
        const state = dirtyState.get(e.target) || { hasInteracted: false, hasBlurred: false };
        state.hasBlurred = true;
        dirtyState.set(e.target, state);
        if (state.hasInteracted) updateFallback(e.target);
      }, true);

      contactForm.addEventListener('input', (e) => {
        if (!e.target.checkValidity) return;
        const state = dirtyState.get(e.target) || { hasInteracted: false, hasBlurred: false };
        state.hasInteracted = true;
        dirtyState.set(e.target, state);
        if (state.hasBlurred) updateFallback(e.target);
      });

      contactForm.addEventListener('invalid', (e) => {
        dirtyState.set(e.target, { hasInteracted: true, hasBlurred: true });
        announced.add(e.target);
        updateFallback(e.target);
      }, true);
    } else {
      contactForm.addEventListener('blur', (e) => syncAria(e.target, true), true);
      contactForm.addEventListener('input', (e) => {
        if (e.target.hasAttribute('aria-invalid')) syncAria(e.target);
      });
      contactForm.addEventListener('invalid', (e) => {
        announced.add(e.target);
        syncAria(e.target);
      }, true);
    }

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        const firstInvalid = contactForm.querySelector(':invalid');
        firstInvalid?.focus();
        return;
      }

      const name = contactForm.elements.name.value.trim();
      const email = contactForm.elements.email.value.trim();
      const message = contactForm.elements.message.value.trim();

      const subject = encodeURIComponent(`Portfolio Inquiry from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
      window.location.href = `mailto:farooqmajeed.1@outlook.com?subject=${subject}&body=${body}`;

      if (formStatus) {
        formStatus.textContent = 'Opening your email client to send your message to Farooq Majeed...';
      }
      contactForm.reset();
      setTimeout(() => {
        contactForm.querySelectorAll('input, textarea').forEach((el) => {
          el.classList.remove('user-invalid-fallback', 'user-valid-fallback');
          dirtyState.delete(el);
          syncAria(el);
        });
      });
    });
  }

  /* ========================================================================
     10. Staggered Scroll Reveal (Only when prefers-reduced-motion: no-preference)
     ======================================================================== */
  const revealEls = document.querySelectorAll('.reveal');

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ========================================================================
     11. Footer Year
     ======================================================================== */
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();

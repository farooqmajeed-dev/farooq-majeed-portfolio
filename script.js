(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

  /* ========================================================================
     0. Live Karachi (PKT) Timezone Clock + Optional Web Audio Micro-SFX
     ======================================================================== */
  const pktClockEl = document.getElementById('pkt-clock');
  const updateClock = () => {
    if (!pktClockEl) return;
    try {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(now);
      pktClockEl.textContent = `${formatted} PKT`;
    } catch {
      pktClockEl.textContent = 'PKT (UTC+5)';
    }
  };
  updateClock();
  setInterval(updateClock, 30000);

  let sfxEnabled = false;
  let audioCtx = null;
  const sfxBtn = document.getElementById('sfx-toggle');
  const sfxIcon = document.getElementById('sfx-icon');

  const playTick = (freq = 660, duration = 0.035) => {
    if (!sfxEnabled) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.035, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // Ignore Web Audio errors if blocked
    }
  };

  sfxBtn?.addEventListener('click', () => {
    sfxEnabled = !sfxEnabled;
    sfxBtn.setAttribute('aria-pressed', String(sfxEnabled));
    sfxBtn.setAttribute('aria-label', sfxEnabled ? 'Disable UI sound effects' : 'Enable UI sound effects');
    if (sfxIcon) sfxIcon.textContent = sfxEnabled ? '\u{1F50A}' : '\u{1F507}';
    if (sfxEnabled) playTick(780, 0.05);
  });

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
    if (metaColorScheme) metaColorScheme.content = scheme ?? 'light dark';
  };

  const toggleTheme = () => {
    if (!metaColorScheme) return;
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
  };

  themeToggleBtn?.addEventListener('click', toggleTheme);
  window.addEventListener('storage', (event) => {
    if (event.key === 'color-scheme') {
      const val = event.newValue;
      applyScheme(val === 'light' || val === 'dark' ? val : null);
    }
  });

  /* ========================================================================
     2. Scroll Progress Fallback
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
     3. Hero Role Cycler & Pointer Spotlight / 3D Tilt
     ======================================================================== */
  const roleCycler = document.getElementById('role-cycler');
  const roles = [
    'Frontend Developer & UI/UX',
    'QA & Performance Specialist',
    'Accessibility & Speed Engineer'
  ];

  if (roleCycler && !prefersReducedMotion) {
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % roles.length;
      roleCycler.style.opacity = '0';
      setTimeout(() => {
        roleCycler.textContent = roles[idx];
        roleCycler.style.opacity = '1';
      }, 180);
    }, 3200);
    roleCycler.style.transition = 'opacity 0.18s ease';
  }

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
     4. Copy Email Button
     ======================================================================== */
  const copyEmailBtn = document.getElementById('copy-email-btn');
  const copyStatus = document.getElementById('copy-email-status');

  const copyEmail = async () => {
    const email = copyEmailBtn?.dataset.email || 'mfarooqmajeedr@gmail.com';
    try {
      await navigator.clipboard.writeText(email);
      if (copyStatus) {
        copyStatus.textContent = 'Copied!';
        setTimeout(() => { copyStatus.textContent = 'Copy'; }, 2000);
      }
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };
  copyEmailBtn?.addEventListener('click', copyEmail);

  /* ========================================================================
     5. Interactive Developer CLI Terminal
     ======================================================================== */
  const auditLog = document.getElementById('audit-log');
  const rerunBtn = document.getElementById('rerun-audit');
  const consoleTabs = document.querySelectorAll('.console-tab');
  const consolePanels = document.querySelectorAll('[data-console-panel]');
  const cliForm = document.getElementById('cli-form');
  const cliInput = document.getElementById('cli-input');
  const typedCmd = document.getElementById('typed-cmd');

  const defaultLines = [
    { badge: 'PASS', cls: 'ok', text: 'Load-Speed Optimization ', strong: '+40% faster' },
    { badge: 'PASS', cls: 'ok', text: 'Managed Fleet Uptime ', strong: '350+ sites (99.9%)' },
    { badge: 'PASS', cls: 'ok', text: 'Accessibility & Cross-Browser QA ', strong: 'Verified' },
    { badge: 'PASS', cls: 'ok', text: 'Analytics & Retention ', strong: '+35% tracking / +15% retention' }
  ];

  const cliOutputs = {
    whoami: [
      { badge: 'USER', cls: 'info', text: 'Farooq Majeed — ', strong: 'Frontend Developer & UI/UX (5+ yrs)' },
      { badge: 'LOC ', cls: 'info', text: 'Karachi, PK — ', strong: 'Open to Remote (Gulf, UK, Europe & USA)' }
    ],
    skills: [
      { badge: 'UI  ', cls: 'info', text: 'HTML5, CSS3, ES6+, jQuery, Bootstrap, ', strong: 'WCAG Auditing' },
      { badge: 'QA  ', cls: 'info', text: 'Manual QA, Cross-Browser, ', strong: 'Load-Speed Analysis' },
      { badge: 'OPS ', cls: 'info', text: 'WordPress, PHP, cPanel/WHM, Imunify360, ', strong: 'GTM & CDN' }
    ],
    projects: [
      { badge: '2022', cls: 'ok', text: 'BookScribe Online — ', strong: '100+ acquisitions' },
      { badge: '2023', cls: 'ok', text: 'American Publishing Studios — ', strong: 'Top USA rankings' },
      { badge: '2024', cls: 'ok', text: 'Security & Uptime Infra — ', strong: '99.9% uptime (350+ sites)' }
    ],
    help: [
      { badge: 'CMD ', cls: 'info', text: 'Available: ', strong: 'whoami | skills | projects | audit | clear' }
    ]
  };

  const renderTerminalLines = (cmdText, lines) => {
    if (!auditLog) return;
    if (typedCmd) typedCmd.textContent = cmdText;
    auditLog.replaceChildren();

    lines.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'audit-line';
      const badge = document.createElement('span');
      badge.className = item.cls;
      badge.textContent = item.badge;
      const strong = document.createElement('strong');
      strong.textContent = item.strong;
      li.append(badge, document.createTextNode(item.text), strong);
      auditLog.appendChild(li);

      if (prefersReducedMotion) {
        li.classList.add('is-shown');
      } else {
        setTimeout(() => li.classList.add('is-shown'), index * 120);
      }
    });
  };

  const runCommand = (rawCmd) => {
    const cmd = rawCmd.trim().toLowerCase();
    if (!cmd) return;
    playTick(540, 0.03);
    if (cmd === 'clear') {
      if (typedCmd) typedCmd.textContent = 'clear';
      auditLog?.replaceChildren();
      return;
    }
    if (cmd === 'audit' || cmd === 'npx web-audit --engineer farooq-majeed') {
      renderTerminalLines('npx web-audit --engineer farooq-majeed', defaultLines);
      return;
    }
    if (cliOutputs[cmd]) {
      renderTerminalLines(cmd, cliOutputs[cmd]);
    } else {
      renderTerminalLines(cmd, [
        { badge: 'ERR ', cls: 'info', text: `Command not found: ${cmd}. Try `, strong: 'help' }
      ]);
    }
  };

  renderTerminalLines('npx web-audit --engineer farooq-majeed', defaultLines);

  rerunBtn?.addEventListener('click', () => {
    consoleTabs.forEach((t) => {
      const active = t.dataset.consoleTab === 'audit';
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    consolePanels.forEach((p) => { p.hidden = p.dataset.consolePanel !== 'audit'; });
    renderTerminalLines('npx web-audit --engineer farooq-majeed', defaultLines);
  });

  document.querySelectorAll('.cli-chip').forEach((chip) => {
    chip.addEventListener('click', () => runCommand(chip.dataset.cli || 'help'));
  });

  cliForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!cliInput) return;
    runCommand(cliInput.value);
    cliInput.value = '';
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
     6. Animated Stat Counters
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
        el.textContent = `${(target * eased).toFixed(decimals)}${suffix}`;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ========================================================================
     7. Tech Marquee Pause / Play Control (WCAG 2.2.2)
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
     8. Skills Category Filter Tabs
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
        card.hidden = !(filter === 'all' || card.dataset.category === filter);
      });
    });
  });

  /* ========================================================================
     9. Shared Top-Layer Dialog Close Helper + Modals & Command Palette
     ======================================================================== */
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

  const setupDialogDismiss = (dialogEl) => {
    if (!dialogEl) return;
    dialogEl.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeTopLayer(dialogEl, 'cancel');
    });
    dialogEl.addEventListener('close', () => {
      dialogEl.returnValue = '';
    });
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e) => {
        const r = dialogEl.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      dialogEl.addEventListener('pointerdown', (e) => { pressedOutside = outside(e); });
      dialogEl.addEventListener('pointerup', (e) => {
        if (pressedOutside && outside(e)) closeTopLayer(dialogEl, 'backdrop');
      });
    }
  };

  /* Project Case Study Modal */
  const projectData = {
    bookscribe: {
      year: '2022',
      title: 'BookScribe Online',
      badge: 'Frontend UX & Technical SEO',
      summary: 'Designed, developed, and optimized the frontend user experience and technical SEO foundation for BookScribe Online.',
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
      summary: 'Built and maintained the web platform with data-driven technical SEO and frontend performance tuning.',
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
      summary: 'Deployed Imunify360, SSL/TLS encryption, and server hardening protocols across 350+ managed web properties.',
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
      summary: 'Led end-to-end design production for digital campaigns, social media assets, book trailers, and press releases.',
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

  document.getElementById('modal-close-btn')?.addEventListener('click', () => closeTopLayer(modal, 'close'));
  document.getElementById('modal-contact-link')?.addEventListener('click', () => closeTopLayer(modal, 'contact'));
  setupDialogDismiss(modal);

  /* Developer Command Palette (Ctrl+K / Cmd+K) */
  const cmdPalette = document.getElementById('cmd-palette');
  const cmdBtn = document.getElementById('cmd-palette-btn');
  const cmdCloseBtn = document.getElementById('cmd-close-btn');
  const cmdSearch = document.getElementById('cmd-search');
  const cmdItems = document.querySelectorAll('#cmd-list li');

  const openCmdPalette = () => {
    if (!cmdPalette || cmdPalette.open) return;
    playTick(720, 0.04);
    if (cmdSearch) cmdSearch.value = '';
    cmdItems.forEach((li) => { li.hidden = false; });
    cmdPalette.showModal();
  };

  cmdBtn?.addEventListener('click', openCmdPalette);
  cmdCloseBtn?.addEventListener('click', () => closeTopLayer(cmdPalette, 'esc'));
  setupDialogDismiss(cmdPalette);

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (cmdPalette?.open) closeTopLayer(cmdPalette, 'toggle');
      else openCmdPalette();
    }
  });

  cmdSearch?.addEventListener('input', () => {
    const q = cmdSearch.value.trim().toLowerCase();
    cmdItems.forEach((li) => {
      const text = li.textContent.toLowerCase();
      li.hidden = !text.includes(q);
    });
  });

  document.querySelectorAll('.cmd-item').forEach((item) => {
    item.addEventListener('click', async () => {
      const action = item.dataset.action;
      const target = item.dataset.target;
      await closeTopLayer(cmdPalette, 'select');

      if (action === 'goto' && target) {
        document.querySelector(target)?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      } else if (action === 'copy-email') {
        copyEmail();
      } else if (action === 'toggle-theme') {
        toggleTheme();
      } else if (action === 'open-url' && target) {
        window.open(target, '_blank', 'noopener,noreferrer');
      }
    });
  });

  /* ========================================================================
     10. Accessible Contact Form Validation (:user-invalid + ARIA Sync)
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
      window.location.href = `mailto:mfarooqmajeedr@gmail.com?subject=${subject}&body=${body}`;

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
     11. Staggered Scroll Reveal
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
     12. Footer Year
     ======================================================================== */
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();

(() => {
  if (!('IntersectionObserver' in window)) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('.motion-toggle');
  const selector = '.sheet > h1, .sheet > h2, .sheet > .lede, .cover > div, .delivery-steps > section, .sheet > .project-proof, .scope > section, .timeline > .row, .sheet > .callout, .sheet > .support-callout, .sheet > table, #optimization-priorities > table, .sheet > .brief-next, .sheet > .price';
  let requested = true;
  const targets = [...document.querySelectorAll(selector)];
  const pending = new Set();
  const observer = new IntersectionObserver(entries => {
    let order = 0;
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      element.style.setProperty('--reveal-delay', `${Math.min(order++, 3) * 50}ms`);
      element.classList.remove('reveal-pending');
      pending.delete(element);
      observer.unobserve(element);
    });
  }, { rootMargin: '0px 0px -30px 0px', threshold: 0.05 });

  function enabled() {
    return !reduced.matches && (!toggle || toggle.getAttribute('aria-pressed') !== 'false');
  }
  function showImmediately(element) {
    element.classList.add('reveal-instant');
    element.classList.remove('reveal-pending');
    pending.delete(element);
    observer.unobserve(element);
  }
  function showAll() {
    if (enabled()) return;
    pending.forEach(showImmediately);
    targets.forEach(element => element.classList.add('reveal-instant'));
  }

  syncMotion();
  if (enabled()) {
    targets.forEach(element => {
      // Leave the initial viewport visible and avoid hiding content already read.
      if (element.getBoundingClientRect().top < window.innerHeight) return;
      element.classList.add('scroll-reveal', 'reveal-pending');
      pending.add(element);
      observer.observe(element);
    });
  }
  function syncMotion() {
    const active = requested && !reduced.matches;
    if (toggle) {
      toggle.hidden = false;
      toggle.disabled = reduced.matches;
      toggle.textContent = active ? 'Motion on' : 'Motion off';
      toggle.setAttribute('aria-pressed', String(active));
      toggle.setAttribute('aria-label', active ? 'Turn animations off' : 'Turn animations on');
    }
    showAll();
  }
  reduced.addEventListener('change', syncMotion);
  if (toggle) toggle.addEventListener('click', () => {
    requested = !requested;
    syncMotion();
  });
  document.addEventListener('focusin', event => {
    pending.forEach(element => {
      if (element.contains(event.target)) showImmediately(element);
    });
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('.section-menu a');
    if (!link) return;
    const section = document.getElementById(link.hash.slice(1));
    pending.forEach(element => {
      if (section && section.contains(element)) showImmediately(element);
    });
  }, true);
})();

(() => {
  if (!('IntersectionObserver' in window)) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('.motion-toggle');
  const selector = '.sheet > h1, .sheet > h2, .sheet > .lede, .cover > div, .sheet > .issue-overview, .sheet > .compact-issue, .page-previews > section, .delivery-steps > section, .sheet > .project-proof, .diagram-pair > section, .scope > section, .timeline > .row, .sheet > .callout, .sheet > .support-callout, .sheet > table, #optimization-priorities > table, .sheet > .brief-next, .sheet > .price';
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

  if (enabled()) {
    targets.forEach(element => {
      // Leave the initial viewport visible and avoid hiding content already read.
      if (element.getBoundingClientRect().top < window.innerHeight) return;
      element.classList.add('scroll-reveal', 'reveal-pending');
      pending.add(element);
      observer.observe(element);
    });
  }
  reduced.addEventListener('change', showAll);
  if (toggle) new MutationObserver(showAll).observe(toggle, { attributes: true, attributeFilter: ['aria-pressed'] });
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

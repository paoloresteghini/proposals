(() => {
  const diagrams = [...document.querySelectorAll('.diagram')];
  const toggle = document.querySelector('.motion-toggle');
  if (!diagrams.length || !toggle || !Element.prototype.animate) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ease = getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim();
  const states = new Map();
  let requested = true;
  let enabled = false;

  diagrams.forEach(diagram => {
    states.set(diagram, { animations: [], timer: null, seen: false, visible: false });
    diagram.querySelector('.diagram-replay').addEventListener('click', () => play(diagram));
  });

  function stop(diagram) {
    const state = states.get(diagram);
    clearTimeout(state.timer);
    state.animations.forEach(animation => animation.cancel());
    state.animations = [];
    diagram.querySelector('.diagram-replay').disabled = !enabled;
    diagram.classList.remove('is-playing');
  }

  function play(diagram) {
    if (!enabled) return;
    stop(diagram);
    const state = states.get(diagram);
    const replay = diagram.querySelector('.diagram-replay');
    state.seen = true;
    replay.disabled = true;
    diagram.classList.add('is-playing');
    let end = 0;

    diagram.querySelectorAll('.diagram-ink, .diagram-halo').forEach(element => {
      const step = Number(element.dataset.step || element.parentElement.dataset.step || 0);
      const delay = step * 600;
      const ink = element.classList.contains('diagram-ink');
      const vertical = element.dataset.axis === 'y';
      const frames = ink
        ? [{ transform: vertical ? 'translateY(-100%)' : 'translateX(-100%)', opacity: 0.5 },
           { transform: vertical ? 'translateY(0)' : 'translateX(0)', opacity: 1 }]
        : [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }];
      state.animations.push(element.animate(frames, {
        duration: 500, delay, easing: ink ? 'linear' : ease, fill: 'forwards'
      }));
      end = Math.max(end, delay + 500);
    });

    state.timer = setTimeout(() => {
      replay.disabled = !enabled;
      diagram.classList.remove('is-playing');
    }, end);
  }

  function sync() {
    enabled = requested && !reduced.matches;
    document.documentElement.classList.add('motion-supported');
    document.documentElement.classList.toggle('diagram-motion-off', !enabled);
    toggle.hidden = false;
    toggle.disabled = reduced.matches;
    toggle.textContent = enabled ? 'Motion on' : 'Motion off';
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute('aria-label', enabled ? 'Turn animations off' : 'Turn animations on');
    diagrams.forEach(diagram => {
      if (!enabled) stop(diagram);
      diagram.querySelector('.diagram-replay').disabled = !enabled;
      const state = states.get(diagram);
      if (enabled && state.visible && !state.seen) play(diagram);
    });
  }

  toggle.addEventListener('click', () => {
    requested = !enabled;
    sync();
  });
  reduced.addEventListener('change', sync);
  sync();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const state = states.get(entry.target);
        state.visible = entry.isIntersecting && entry.intersectionRatio >= 0.4;
        if (state.visible && !state.seen) play(entry.target);
        if (!state.visible) stop(entry.target);
      });
    }, { threshold: 0.4 });
    diagrams.forEach(diagram => observer.observe(diagram));
  }
})();

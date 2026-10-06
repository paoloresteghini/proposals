(() => {
  const sections = [...document.querySelectorAll('.sheet[id][data-screen-label]')];
  if (!sections.length) return;

  const toggle = document.createElement('button');
  toggle.className = 'section-jump';
  toggle.type = 'button';
  toggle.setAttribute('aria-haspopup', 'dialog');
  toggle.setAttribute('aria-controls', 'section-menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="2.5" width="5" height="5" rx="2"/><rect x="12.5" y="2.5" width="5" height="5" rx="2"/><rect x="2.5" y="12.5" width="5" height="5" rx="2"/><path d="M15 12.5v5m-2.5-2.5h5"/></svg><span></span>';

  const dialog = document.createElement('dialog');
  dialog.id = 'section-menu';
  dialog.className = 'section-menu';
  dialog.setAttribute('aria-labelledby', 'section-menu-title');
  dialog.innerHTML = '<button class="section-menu-close" type="button"><span aria-hidden="true">×</span> Close</button><div class="section-menu-inner"><h2 id="section-menu-title">Jump to a section</h2><nav aria-label="Proposal sections"><ol></ol></nav></div>';
  const list = dialog.querySelector('ol');
  const links = sections.map((section, index) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${section.id}`;
    const number = document.createElement('span');
    number.className = 'section-menu-number';
    number.textContent = String(index + 1).padStart(2, '0');
    number.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = section.dataset.screenLabel;
    link.append(number, label);
    link.addEventListener('click', () => {
      dialog.close();
      section.tabIndex = -1;
      section.focus({ preventScroll: true });
    });
    item.append(link);
    list.append(item);
    return link;
  });
  document.body.append(toggle, dialog);

  let current = 0;
  let queued = false;
  function update() {
    queued = false;
    const marker = window.innerHeight * 0.35;
    current = 0;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= marker) current = index;
    });
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      current = sections.length - 1;
    }
    toggle.querySelector('span').textContent = `${current + 1} of ${sections.length}`;
    toggle.setAttribute('aria-label', `Jump to a section, ${current + 1} of ${sections.length}: ${sections[current].dataset.screenLabel}`);
    links.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }
  toggle.addEventListener('click', () => {
    update();
    dialog.showModal();
    document.body.classList.add('section-nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    links[current].focus();
  });
  dialog.querySelector('.section-menu-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const first = dialog.querySelector('.section-menu-close');
    const last = links[links.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('section-nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  document.fonts.ready.then(schedule);
  update();
})();

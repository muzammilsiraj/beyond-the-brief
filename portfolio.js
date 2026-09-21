(() => {
  'use strict';
  const root = document.querySelector('#beyond-brief');
  if (!root) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const navigation = [...document.querySelectorAll('.pf-header nav a')];
  const progress = document.querySelector('.pf-progress');
  const groups = ['top', 'chapters', 'approach', 'selected-work', 'contact']
    .map(id => document.getElementById(id)).filter(Boolean);
  let scheduled = false;
  function updateReadingPosition() {
    scheduled = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
    let current = groups[0];
    for (const group of groups) {
      if (group.getBoundingClientRect().top <= innerHeight * .35) current = group;
    }
    if (max > 0 && scrollY >= max - 4) current = groups[groups.length - 1];
    for (const link of navigation) {
      if (link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
  function scheduleUpdate() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateReadingPosition); }
  }
  addEventListener('scroll', scheduleUpdate, { passive: true });
  addEventListener('resize', scheduleUpdate);
  addEventListener('load', scheduleUpdate);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleUpdate).observe(root);
  document.fonts?.ready.then(scheduleUpdate);
  updateReadingPosition();

  // Content stays visible without JS, observer support, or successful animation.
  // Animate once on entry; never hide the document while waiting for a scroll.
  const running = new Set();
  function reveal(element, delay = 0) {
    if (motion.matches || !element.animate) return;
    const animation = element.animate([
      { opacity: .25, translate: '0 18px' },
      { opacity: 1, translate: '0 0' }
    ], { duration: 620, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    running.add(animation);
    animation.finished.catch(() => {}).finally(() => running.delete(animation));
  }
  let observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        reveal(entry.target);
      }
    }, { threshold: .12 });
    root.querySelectorAll('section > h2, .ch-layer, .bb-workintro, section > .bb-art, .bb-case-notes > div, .pf-index-heading, .pf-work-index nav a').forEach(el => observer.observe(el));
  }
  root.querySelectorAll('.cover-line').forEach((line, i) => reveal(line, i * 75));
  motion.addEventListener('change', () => {
    if (motion.matches) {
      for (const animation of running) animation.cancel();
      running.clear();
    }
  });
  // Native anchors retain history and work with scripts disabled. Move keyboard
  // focus to the destination as well, without interrupting native smooth scroll.
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      const target = document.getElementById(link.hash.slice(1));
      if (target?.hasAttribute('tabindex')) target.focus({ preventScroll: true });
    });
  });
})();

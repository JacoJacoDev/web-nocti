/**
 * Sistema de revelado al hacer scroll.
 * Implementa un IntersectionObserver suave con umbral y escalonado.
 * Cumple con las Pautas de Diseño de Apple §14 (movimiento reducido).
 */
export function initScrollReveal() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll<HTMLElement>('.reveal-item');

  if (prefersReducedMotion) {
    items.forEach((el) => el.classList.add('is-revealed'));
    return;
  }

  const observerOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.15,
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  items.forEach((item) => {
    observer.observe(item);
  });
}

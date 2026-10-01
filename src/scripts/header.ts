/**
 * Controlador del header y la navegación móvil.
 *
 * Accesibilidad (WCAG 2.1.1, 2.1.2, 2.4.3, 2.4.7, 4.1.2):
 * - El overlay móvil es un diálogo modal real: `role="dialog"` + `aria-modal`,
 *   con foco movido al abrirlo y devuelto al botón al cerrarlo.
 * - El foco queda atrapado dentro del overlay (Tab cicla, no sale a la página
 *   que está detrás).
 * - El contenido de fondo se marca `inert`, así no es alcanzable por puntero ni
 *   por teclado mientras el overlay está abierto.
 * - El botón de cierre queda FUERA del `inert` a propósito: es el `z-[60]` que
 *   se pinta sobre el overlay (`z-[55]`), de modo que se puede cerrar con el dedo.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Selector de los hijos de <body> que quedan detrás del overlay. */
const BACKGROUND_SELECTOR = 'main, footer, aside, #local-nav';

export function initHeader() {
  const header = document.getElementById('site-header');
  const menuBtn = document.getElementById('menu-toggle-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!header) return;

  // 1. Listener de scroll para el estilo del header fijo
  let lastScrollY = window.scrollY;
  const updateHeaderState = () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScrollY = currentScrollY;
  };

  window.addEventListener('scroll', updateHeaderState, { passive: true });
  updateHeaderState();

  // 2. Manejo del menú móvil
  if (menuBtn && mobileMenu) {
    let isOpen = false;
    let scrollYBeforeOpen = 0;

    /** Elementos enfocables visibles dentro del overlay, en orden de tabulación. */
    const getFocusable = (): HTMLElement[] =>
      Array.from(mobileMenu.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement,
      );

    /** Aísla el fondo: sin `inert`, el Tab recorrería la página tras el overlay. */
    const backgroundEls = Array.from(
      document.querySelectorAll<HTMLElement>(BACKGROUND_SELECTOR),
    ).filter((el) => !mobileMenu.contains(el) && el !== menuBtn);

    const setBackgroundInert = (inert: boolean) => {
      backgroundEls.forEach((el) => {
        if (inert) {
          el.setAttribute('inert', '');
        } else {
          el.removeAttribute('inert');
        }
      });
    };

    const setLines = (open: boolean) => {
      const lines = menuBtn.querySelectorAll<HTMLElement>('.menu-line');
      if (lines.length < 2) return;
      lines[0].style.transform = open ? 'translateY(4px) rotate(45deg)' : '';
      lines[1].style.transform = open ? 'translateY(-4px) rotate(-45deg)' : '';
    };

    /**
     * Foco atrapado dentro del overlay (WCAG 2.4.3).
     * En el primer y último elemento el Tab cicla en lugar de escapar al fondo.
     */
    const trapTab = (e: KeyboardEvent) => {
      const focusables = getFocusable();
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // El foco está fuera del overlay (p. ej. tras un click en el fondo): lo
      // reenganchamos al primer elemento en vez de dejarlo huérfano.
      if (!active || !mobileMenu.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    /** Red de seguridad: nada fuera del overlay puede conservar el foco. */
    const enforceFocus = (e: FocusEvent) => {
      if (!isOpen) return;
      const target = e.target as HTMLElement | null;
      // El toggle queda permitido: es el control de cierre del propio diálogo.
      if (target && (mobileMenu.contains(target) || target === menuBtn)) return;
      const focusables = getFocusable();
      (focusables[0] ?? menuBtn).focus();
    };

    const setMenuOpen = (open: boolean) => {
      if (open === isOpen) return;
      isOpen = open;

      menuBtn.setAttribute('aria-expanded', String(isOpen));
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));

      if (isOpen) {
        scrollYBeforeOpen = window.scrollY;
        mobileMenu.removeAttribute('inert');
        mobileMenu.classList.remove('pointer-events-none', 'opacity-0');
        mobileMenu.classList.add('pointer-events-auto', 'opacity-100');
        setBackgroundInert(true);
        document.body.style.overflow = 'hidden';
        menuBtn.setAttribute('aria-label', 'Cerrar menú');
        setLines(true);

        // El foco entra en el diálogo; si no, el primer Tab posterior se
        // saltaría el overlay por completo (WCAG 2.4.3).
        const focusables = getFocusable();
        (focusables[0] ?? mobileMenu).focus();
      } else {
        setBackgroundInert(false);
        mobileMenu.setAttribute('inert', '');
        mobileMenu.classList.remove('pointer-events-auto', 'opacity-100');
        mobileMenu.classList.add('pointer-events-none', 'opacity-0');
        document.body.style.overflow = '';
        menuBtn.setAttribute('aria-label', 'Abrir menú de navegación');
        setLines(false);

        // Devolver el foco al control que abrió el overlay (WCAG 2.4.3).
        if (document.activeElement !== menuBtn) {
          menuBtn.focus({ preventScroll: true });
        }
        // El scroll nunca se manipuló más allá de `overflow: hidden`, pero lo
        // garantizamos por si el navegador lo alteró al bloquear el scroll.
        if (window.scrollY !== scrollYBeforeOpen) {
          window.scrollTo({ top: scrollYBeforeOpen, behavior: 'instant' as ScrollBehavior });
        }
      }
    };

    menuBtn.addEventListener('click', () => {
      setMenuOpen(!isOpen);
    });

    // Cerrar al pulsar cualquier enlace de navegación.
    // Se delega en el contenedor: los enlaces se generan desde un array, así que
    // no existe la lista estática de nodos que se tenía antes.
    mobileMenu.addEventListener('click', (e) => {
      const link = (e.target as Element | null)?.closest('a[href]');
      if (!link) return;

      setMenuOpen(false);

      // En una navegación interna el navegador devuelve el foco a <body>, así
      // que un usuario de teclado se queda sin punto de referencia. Lo llevamos
      // a la sección de destino (WCAG 2.4.3). El `tabindex="-1"` solo se aplica
      // en memoria: mantiene el elemento fuera del orden de tabulación.
      const href = link.getAttribute('href') ?? '';
      if (href.startsWith('#') && href.length > 1) {
        const target = document.getElementById(href.slice(1));
        if (target) {
          if (!target.hasAttribute('tabindex')) {
            target.setAttribute('tabindex', '-1');
          }
          // Tras la navegación por fragmento, no en el mismo tick.
          requestAnimationFrame(() => target.focus({ preventScroll: true }));
        }
      }
    });

    // Cerrar al hacer clic en el fondo del overlay (fuera de sus enlaces).
    mobileMenu.addEventListener('click', (e) => {
      if (e.target === mobileMenu) setMenuOpen(false);
    });

    // El trampa se registra en `document`, no en el overlay: el toggle queda
    // fuera del diálogo y sigue siendo enfocable (es el control de cierre), así
    // que un Tab desde ahí nunca alcanzaría un listener colgado en el overlay y
    // se escaparía hacia la página de fondo.
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !isOpen) return;
      trapTab(e);
    });

    document.addEventListener('focusin', enforceFocus);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setMenuOpen(false);
      }
    });

    // Si el viewport pasa a desktop con el overlay abierto, `md:hidden` lo
    // ocultaría pero el `inert` y el foco seguirían atrapados: lo cerramos.
    const desktopQuery = window.matchMedia('(min-width: 768px)');
    desktopQuery.addEventListener('change', (e) => {
      if (e.matches && isOpen) setMenuOpen(false);
    });
  }
}
/**
 * Controlador del header y la navegación móvil.
 * Implementa transiciones fluidas e interrumpibles, accesibilidad por teclado
 * y estado de desenfoque de fondo.
 */
export function initHeader() {
  const header = document.getElementById('site-header');
  const menuBtn = document.getElementById('menu-toggle-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-menu-link');

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

    const setMenuOpen = (open: boolean) => {
      isOpen = open;
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));

      if (isOpen) {
        mobileMenu.classList.remove('pointer-events-none', 'opacity-0');
        mobileMenu.classList.add('pointer-events-auto', 'opacity-100');
        document.body.style.overflow = 'hidden';
        menuBtn.setAttribute('aria-label', 'Cerrar menú');

        // Transformar el hamburguesa en icono de cerrar
        const lines = menuBtn.querySelectorAll('.menu-line');
        if (lines.length >= 2) {
          (lines[0] as HTMLElement).style.transform = 'translateY(4px) rotate(45deg)';
          (lines[1] as HTMLElement).style.transform = 'translateY(-4px) rotate(-45deg)';
        }
      } else {
        mobileMenu.classList.remove('pointer-events-auto', 'opacity-100');
        mobileMenu.classList.add('pointer-events-none', 'opacity-0');
        document.body.style.overflow = '';
        menuBtn.setAttribute('aria-label', 'Abrir menú');

        const lines = menuBtn.querySelectorAll('.menu-line');
        if (lines.length >= 2) {
          (lines[0] as HTMLElement).style.transform = '';
          (lines[1] as HTMLElement).style.transform = '';
        }
      }
    };

    menuBtn.addEventListener('click', () => {
      setMenuOpen(!isOpen);
    });

    // Cerrar al hacer clic en cualquier enlace de navegación
    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        setMenuOpen(false);
      });
    });

    // Cerrar al presionar la tecla Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        setMenuOpen(false);
        menuBtn.focus();
      }
    });
  }
}

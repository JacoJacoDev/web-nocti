/**
 * Header & Mobile Navigation Controller
 * Implements fluid, interruptible transitions, keyboard accessibility and backdrop blur state.
 */
export function initHeader() {
  const header = document.getElementById('site-header');
  const menuBtn = document.getElementById('menu-toggle-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-menu-link');

  if (!header) return;

  // 1. Scroll listener for sticky header styling
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

  // 2. Mobile Menu Handling
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
        menuBtn.setAttribute('aria-label', 'Close menu');
        
        // Transform hamburger to close icon
        const lines = menuBtn.querySelectorAll('.menu-line');
        if (lines.length >= 2) {
          (lines[0] as HTMLElement).style.transform = 'translateY(4px) rotate(45deg)';
          (lines[1] as HTMLElement).style.transform = 'translateY(-4px) rotate(-45deg)';
        }
      } else {
        mobileMenu.classList.remove('pointer-events-auto', 'opacity-100');
        mobileMenu.classList.add('pointer-events-none', 'opacity-0');
        document.body.style.overflow = '';
        menuBtn.setAttribute('aria-label', 'Open menu');

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

    // Close when clicking any nav link
    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        setMenuOpen(false);
      });
    });

    // Close on Escape key press
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        setMenuOpen(false);
        menuBtn.focus();
      }
    });
  }
}

// Improvements: performance, accessibility, robustness
(() => {
    'use strict';

    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-menu a');
    const sections = document.querySelectorAll('section');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Manage open/closed state and ARIA attributes
    function setMenuOpen(open) {
        if (!hamburger || !navMenu) return;
        hamburger.classList.toggle('active', open);
        navMenu.classList.toggle('active', open);
        hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
        navMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    }

    // Toggle menu on click
    if (hamburger && navMenu) {
        // initialize ARIA
        hamburger.setAttribute('aria-controls', navMenu.id || 'navMenu');
        hamburger.setAttribute('aria-expanded', hamburger.classList.contains('active') ? 'true' : 'false');
        navMenu.setAttribute('aria-hidden', hamburger.classList.contains('active') ? 'false' : 'true');

        hamburger.addEventListener('click', () => {
            setMenuOpen(!hamburger.classList.contains('active'));
        });
    }

    // Close menu when a nav link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => setMenuOpen(false));
    });

    // Close menu when clicking outside (pointerdown is more responsive than click)
    document.addEventListener('pointerdown', (e) => {
        if (!navMenu || !hamburger) return;
        const target = e.target;
        if (!target.closest('#' + CSS.escape(navMenu.id || 'navMenu')) && !target.closest('#' + CSS.escape(hamburger.id || 'hamburger'))) {
            setMenuOpen(false);
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setMenuOpen(false);
    });

    // Map section ids to nav links for quick lookup
    const idToLink = Object.create(null);
    navLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('#')) idToLink[href.slice(1)] = link;
    });

    // Use IntersectionObserver to highlight the active nav link (better performance than scroll)
    if ('IntersectionObserver' in window && sections.length) {
        const observerOpts = { root: null, threshold: [0.45, 0.6] };
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.id;
                const link = idToLink[id];
                if (!link) return;
                if (entry.isIntersecting) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        }, observerOpts);

        sections.forEach(s => sectionObserver.observe(s));
    } else {
        // Fallback: throttled scroll handler
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                let current = '';
                sections.forEach(section => {
                    const rect = section.getBoundingClientRect();
                    if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.25) {
                        current = section.id;
                    }
                });
                navLinks.forEach(link => link.classList.toggle('active', (link.getAttribute('href') || '').slice(1) === current));
                ticking = false;
            });
        }, { passive: true });
    }

    // Inject CSS for active links (scoped, minimal)
    const style = document.createElement('style');
    style.textContent = `
        .nav-menu a.active { color: var(--primary-color); }
        .nav-menu a.active::after { width: 100%; }
    `;
    document.head.appendChild(style);

    // Scroll/entrance animations: respect reduced motion preference
    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
        const animObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

        document.querySelectorAll('.section').forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            animObserver.observe(section);
        });
    } else {
        // If user prefers reduced motion or observer unavailable, make sections visible immediately
        document.querySelectorAll('.section').forEach(section => {
            section.style.opacity = '1';
            section.style.transform = 'none';
        });
    }
})();

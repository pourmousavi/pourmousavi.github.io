// Common JavaScript functionality across all pages

// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    // Mobile nav toggle
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('primary-navigation');
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            const expanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!expanded));
            nav.classList.toggle('show');
        });

        // Close menu on link click (optional for better UX)
        nav.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                nav.classList.remove('show');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                nav.classList.remove('show');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Close if resizing to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                nav.classList.remove('show');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Email obfuscation: build mailto links on the client
    const buildEmail = (el) => {
        const user = el.getAttribute('data-email-user') || '';
        // domain split across parts to avoid simple scrapers
        const d1 = el.getAttribute('data-email-d1') || '';
        const d2 = el.getAttribute('data-email-d2') || '';
        const d3 = el.getAttribute('data-email-d3') || '';
        const domain = [d1, d2, d3].filter(Boolean).join('.');
        if (!user || !domain) return null;
        return `${user}@${domain}`;
    };

    document.querySelectorAll('a.ob-email').forEach((el) => {
        const mode = el.getAttribute('data-email-reveal') || 'auto';
        const email = buildEmail(el);
        const linkText = el.getAttribute('data-email-text');
        const subject = el.getAttribute('data-email-subject');
        const body = el.getAttribute('data-email-body');
        const buildMailto = () => {
            let href = `mailto:${email}`;
            const params = [];
            if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
            if (body) params.push(`body=${encodeURIComponent(body)}`);
            if (params.length) href += `?${params.join('&')}`;
            return href;
        };

        if (!email) return;

        if (mode === 'click') {
            // Hide real link until click
            if (!el.textContent.trim()) {
                el.textContent = 'Show email';
            }
            el.addEventListener('click', (e) => {
                // On first click, convert to real mailto and proceed
                if (!el.getAttribute('href') || el.getAttribute('href').indexOf('mailto:') !== 0) {
                    e.preventDefault();
                    el.setAttribute('href', buildMailto());
                    el.textContent = linkText || email;
                    // Trigger second navigation after microtask to allow UI update
                    setTimeout(() => {
                        el.click();
                    }, 0);
                }
            }, { once: true });
        } else {
            // Auto mode: set mailto immediately on client
            el.setAttribute('href', buildMailto());
            if (linkText) {
                el.textContent = linkText;
            } else if (!el.textContent.trim()) {
                // default to email text if no content provided
                el.textContent = email;
            }
        }
    });

    // Scroll to Top Button
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '↑';
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.setAttribute('aria-label', 'Scroll to top');
    scrollToTopBtn.setAttribute('title', 'Back to top');
    document.body.appendChild(scrollToTopBtn);

    // Show/hide button based on scroll position
    const toggleScrollButton = () => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    };

    window.addEventListener('scroll', toggleScrollButton);
    toggleScrollButton(); // Check initial state

    // Scroll to top on click
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

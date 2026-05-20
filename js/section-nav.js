// Section Navigation - Hybrid implementation
// Desktop: Floating dot indicators (right side)
// Mobile: Sticky horizontal sub-nav bar

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        mobileBreakpoint: 768,
        scrollOffset: 80, // Account for fixed header
        showBarAfterScroll: 200, // Show mobile bar after scrolling this many pixels
        intersectionThreshold: 0.3,
        debounceDelay: 10
    };

    // State
    let sections = [];
    let activeSection = null;
    let isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
    let observer = null;
    let userHasInteracted = false;
    let suppressUrlUpdate = false;
    let suppressUrlTimeout = null;

    // DOM Elements
    let dotsContainer = null;
    let barContainer = null;
    let chipsContainer = null;

    /**
     * Initialize the section navigation
     */
    function init() {
        // Find all sections with data-section-label attribute
        sections = Array.from(document.querySelectorAll('[data-section-label]'));

        if (sections.length < 2) {
            // Don't show navigation for pages with fewer than 2 sections
            return;
        }

        createNavigationElements();
        setupIntersectionObserver();
        setupEventListeners();
        updateActiveSection();
        handleResize();
        honourInitialHash();
    }

    /**
     * If the page loaded with a hash that matches a known section, jump there
     * with the correct fixed-header offset applied. Scroll-margin-top in CSS
     * covers most cases, but calling scrollToSection() keeps a single source
     * of truth for the offset value.
     */
    function honourInitialHash() {
        const hash = location.hash;
        if (!hash || hash.length < 2) return;

        const id = hash.slice(1);
        const target = sections.find(s => s.id === id);
        if (!target) return;

        // Use 'auto' to avoid a long smooth scroll on initial load.
        // writeUrl:false because the hash is already correct.
        scrollToSection(id, { writeUrl: false, behavior: 'auto' });
    }

    /**
     * Create the navigation DOM elements
     */
    function createNavigationElements() {
        // Create main container
        const nav = document.createElement('nav');
        nav.className = 'section-nav';
        nav.setAttribute('aria-label', 'Page sections');

        // Create desktop dots container
        dotsContainer = document.createElement('div');
        dotsContainer.className = 'section-nav-dots';
        dotsContainer.setAttribute('role', 'navigation');
        dotsContainer.setAttribute('aria-label', 'Section navigation');

        // Create mobile bar container
        barContainer = document.createElement('div');
        barContainer.className = 'section-nav-bar';

        chipsContainer = document.createElement('div');
        chipsContainer.className = 'section-nav-chips';
        barContainer.appendChild(chipsContainer);

        // Create navigation items for each section
        sections.forEach((section, index) => {
            const id = section.id || `section-${index}`;
            const label = section.getAttribute('data-section-label');

            // Ensure section has an ID
            if (!section.id) {
                section.id = id;
            }

            // Create dot for desktop
            const dot = createDot(id, label, index);
            dotsContainer.appendChild(dot);

            // Create chip for mobile
            const chip = createChip(id, label, index);
            chipsContainer.appendChild(chip);
        });

        nav.appendChild(dotsContainer);
        nav.appendChild(barContainer);

        // Insert after main nav
        const mainNav = document.querySelector('nav');
        if (mainNav && mainNav.nextSibling) {
            mainNav.parentNode.insertBefore(nav, mainNav.nextSibling);
        } else {
            document.body.insertBefore(nav, document.body.firstChild);
        }
    }

    /**
     * Create a dot element for desktop navigation
     */
    function createDot(id, label, index) {
        const dot = document.createElement('button');
        dot.className = 'section-nav-dot';
        dot.setAttribute('data-section-id', id);
        dot.setAttribute('aria-label', `Go to ${label}`);
        dot.setAttribute('tabindex', '0');
        dot.title = label;

        // Create tooltip
        const tooltip = document.createElement('span');
        tooltip.className = 'section-nav-tooltip';
        tooltip.textContent = label;
        dot.appendChild(tooltip);

        // Click handler
        dot.addEventListener('click', () => scrollToSection(id));

        // Keyboard handler
        dot.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                scrollToSection(id);
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                focusNextDot(index);
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                focusPreviousDot(index);
            }
        });

        return dot;
    }

    /**
     * Create a chip element for mobile navigation
     */
    function createChip(id, label, index) {
        const chip = document.createElement('button');
        chip.className = 'section-nav-chip';
        chip.setAttribute('data-section-id', id);
        chip.textContent = label;

        // Click handler
        chip.addEventListener('click', () => {
            scrollToSection(id);
            // Auto-scroll chip into view
            chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });

        return chip;
    }

    /**
     * Focus the next dot in the list
     */
    function focusNextDot(currentIndex) {
        const dots = dotsContainer.querySelectorAll('.section-nav-dot');
        const nextIndex = (currentIndex + 1) % dots.length;
        dots[nextIndex].focus();
    }

    /**
     * Focus the previous dot in the list
     */
    function focusPreviousDot(currentIndex) {
        const dots = dotsContainer.querySelectorAll('.section-nav-dot');
        const prevIndex = (currentIndex - 1 + dots.length) % dots.length;
        dots[prevIndex].focus();
    }

    /**
     * Scroll to a section by ID
     */
    function scrollToSection(id, options) {
        const section = document.getElementById(id);
        if (!section) return;

        const writeUrl = !options || options.writeUrl !== false;
        const behavior = options && options.behavior ? options.behavior : 'smooth';

        userHasInteracted = true;

        // Suppress scroll-driven URL updates while the smooth scroll is in flight,
        // otherwise the IntersectionObserver fires as we pass through sections and
        // overwrites the hash we just pushed.
        suppressUrlUpdate = true;
        clearTimeout(suppressUrlTimeout);
        suppressUrlTimeout = setTimeout(() => { suppressUrlUpdate = false; }, 700);

        const top = section.getBoundingClientRect().top + window.pageYOffset - CONFIG.scrollOffset;
        window.scrollTo({ top: top, behavior: behavior });

        if (writeUrl && location.hash !== '#' + id) {
            history.pushState(null, '', '#' + id);
        }
    }

    /**
     * Reflect the active section in the address bar.
     * - replaceState (not pushState) so scroll doesn't flood the back stack.
     * - Strips the hash entirely when the user is at the very top of the page.
     * - No-ops until the user has actually interacted, so a fresh page load
     *   doesn't append a hash for the auto-selected first section.
     */
    function updateUrlForActiveSection(id) {
        if (!userHasInteracted || suppressUrlUpdate) return;

        if (window.pageYOffset < CONFIG.scrollOffset) {
            if (location.hash) {
                history.replaceState(null, '', location.pathname + location.search);
            }
            return;
        }

        const newHash = '#' + id;
        if (location.hash !== newHash) {
            history.replaceState(null, '', newHash);
        }
    }

    /**
     * Setup Intersection Observer for scroll spy
     */
    function setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: `-${CONFIG.scrollOffset}px 0px -50% 0px`,
            threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5]
        };

        observer = new IntersectionObserver((entries) => {
            // Find the most visible section
            let maxRatio = 0;
            let mostVisible = null;

            entries.forEach(entry => {
                if (entry.intersectionRatio > maxRatio) {
                    maxRatio = entry.intersectionRatio;
                    mostVisible = entry.target;
                }
            });

            // Update if we found a visible section with decent visibility
            if (mostVisible && maxRatio > 0.1) {
                setActiveSection(mostVisible.id);
            }
        }, options);

        sections.forEach(section => {
            observer.observe(section);
        });
    }

    /**
     * Set the active section and update UI
     */
    function setActiveSection(id) {
        if (activeSection === id) return;
        activeSection = id;

        // Update dots
        dotsContainer.querySelectorAll('.section-nav-dot').forEach(dot => {
            const isActive = dot.getAttribute('data-section-id') === id;
            dot.classList.toggle('active', isActive);
            dot.setAttribute('aria-current', isActive ? 'true' : 'false');
        });

        // Update chips
        chipsContainer.querySelectorAll('.section-nav-chip').forEach(chip => {
            const isActive = chip.getAttribute('data-section-id') === id;
            chip.classList.toggle('active', isActive);
            chip.setAttribute('aria-current', isActive ? 'true' : 'false');

            // Auto-scroll active chip into view on mobile
            if (isActive && isMobile) {
                chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        });

        updateUrlForActiveSection(id);
    }

    /**
     * Update active section based on scroll position (fallback)
     */
    function updateActiveSection() {
        const scrollTop = window.pageYOffset;
        let current = null;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - CONFIG.scrollOffset - 100;
            if (scrollTop >= sectionTop) {
                current = section.id;
            }
        });

        if (current) {
            setActiveSection(current);
        } else if (sections.length > 0) {
            setActiveSection(sections[0].id);
        }
    }

    /**
     * Handle scroll events for mobile bar visibility
     */
    function handleScroll() {
        const scrollTop = window.pageYOffset;
        const shouldShowBar = scrollTop > CONFIG.showBarAfterScroll;

        if (barContainer) {
            barContainer.classList.toggle('visible', shouldShowBar && isMobile);
        }

        // Any real scroll past the offset counts as user interaction, which
        // unlocks scroll-driven URL updates (see updateUrlForActiveSection).
        if (!userHasInteracted && scrollTop > CONFIG.scrollOffset) {
            userHasInteracted = true;
        }
    }

    /**
     * Handle window resize
     */
    function handleResize() {
        const wasMobile = isMobile;
        isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;

        // Update visibility based on screen size
        if (dotsContainer) {
            dotsContainer.classList.toggle('hidden', isMobile);
        }
        if (barContainer) {
            barContainer.classList.toggle('hidden', !isMobile);
            // Re-check scroll position for bar visibility
            handleScroll();
        }

        // If switched modes, reset the active chip scroll position
        if (wasMobile !== isMobile && isMobile) {
            const activeChip = chipsContainer.querySelector('.section-nav-chip.active');
            if (activeChip) {
                activeChip.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
            }
        }
    }

    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Debounced scroll handler
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) {
                cancelAnimationFrame(scrollTimeout);
            }
            scrollTimeout = requestAnimationFrame(() => {
                handleScroll();
                updateActiveSection();
            });
        }, { passive: true });

        // Resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 150);
        });

        // Respect reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.style.setProperty('--section-nav-transition', '0s');
        }

        // Back/forward and manual URL-bar hash edits: scroll to the target
        // with the correct offset, but don't re-write the URL.
        window.addEventListener('hashchange', () => {
            const hash = location.hash;
            if (!hash || hash.length < 2) return;
            const id = hash.slice(1);
            if (sections.find(s => s.id === id)) {
                scrollToSection(id, { writeUrl: false });
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

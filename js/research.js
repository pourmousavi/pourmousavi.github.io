// Research page functionality - Project expand/collapse
document.addEventListener('DOMContentLoaded', function() {
    const expandButtons = document.querySelectorAll('.expand-btn');

    expandButtons.forEach(button => {
        button.addEventListener('click', function() {
            const projectBody = this.closest('.project-body');
            const detailsSection = projectBody.querySelector('.project-details');

            if (detailsSection.style.display === 'none') {
                // Expand
                detailsSection.style.display = 'block';
                this.textContent = 'Show Less ↑';

                // Smooth scroll to top of project after expansion
                setTimeout(() => {
                    this.closest('.project-detail').scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 100);
            } else {
                // Collapse
                detailsSection.style.display = 'none';
                this.textContent = 'Show More Details ↓';
            }
        });
    });

    // Partners Carousel Auto-scroll
    const carousel = document.getElementById('partners-carousel');
    const indicatorContainer = document.getElementById('scroll-indicators');
    
    if (carousel) {
        const cards = carousel.querySelectorAll('.partner-logo-card');
        const totalCards = cards.length;
        let currentIndex = 0;
        let autoScrollInterval = null;
        let isUserInteracting = false;

        // Create scroll indicators
        for (let i = 0; i < totalCards; i++) {
            const dot = document.createElement('div');
            dot.className = 'scroll-dot';
            if (i === 0) dot.classList.add('active');
            indicatorContainer.appendChild(dot);
        }

        const dots = indicatorContainer.querySelectorAll('.scroll-dot');

        // Function to scroll to specific card
        function scrollToCard(index) {
            const cardWidth = cards[0].offsetWidth;
            const gap = 24; // 1.5rem gap in pixels
            const scrollPosition = index * (cardWidth + gap);
            
            carousel.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });

            // Update indicators
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }

        // Auto-scroll function
        function autoScroll() {
            if (!isUserInteracting) {
                currentIndex = (currentIndex + 1) % totalCards;
                scrollToCard(currentIndex);
            }
        }

        // Function to start auto-scrolling
        function startAutoScroll() {
            // Clear any existing interval first
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
            }
            autoScrollInterval = setInterval(autoScroll, 3000);
        }

        // Function to stop auto-scrolling
        function stopAutoScroll() {
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
                autoScrollInterval = null;
            }
        }

        // Start auto-scrolling initially
        startAutoScroll();

        // Pause on hover
        carousel.addEventListener('mouseenter', () => {
            isUserInteracting = true;
            stopAutoScroll();
        });

        // Resume on mouse leave
        carousel.addEventListener('mouseleave', () => {
            isUserInteracting = false;
            startAutoScroll();
        });

        // Manual scroll detection
        let scrollTimeout;
        carousel.addEventListener('scroll', () => {
            // Mark as user interacting
            isUserInteracting = true;
            stopAutoScroll();
            
            // Clear the existing timeout
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            
            // Set a timeout to detect when scrolling has stopped
            scrollTimeout = setTimeout(() => {
                const cardWidth = cards[0].offsetWidth;
                const gap = 24;
                const newIndex = Math.round(carousel.scrollLeft / (cardWidth + gap));
                
                // Only update if index actually changed
                if (newIndex !== currentIndex && newIndex >= 0 && newIndex < totalCards) {
                    currentIndex = newIndex;
                    
                    // Update indicators based on scroll position
                    dots.forEach((dot, i) => {
                        dot.classList.toggle('active', i === currentIndex);
                    });
                }
                
                // Resume auto-scrolling after user stops
                isUserInteracting = false;
                startAutoScroll();
            }, 1500); // Wait 1.5 seconds after scroll stops
        });

        // Click on dots to navigate
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                isUserInteracting = true;
                stopAutoScroll();
                currentIndex = index;
                scrollToCard(index);
                
                // Resume auto-scroll after dot click
                setTimeout(() => {
                    isUserInteracting = false;
                    startAutoScroll();
                }, 3000); // Wait 3 seconds before resuming
            });
        });
    }
});
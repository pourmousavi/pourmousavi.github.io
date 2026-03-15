// Research page functionality - Project Modal
document.addEventListener('DOMContentLoaded', function() {
    // Project data
    const projectData = {
        fresno: {
            acronym: 'FRESNO',
            title: 'Flexibility Aggregator Simulation Platform',
            subtitle: 'Enabling massive renewable integration through advanced grid simulation',
            meta: [
                { label: 'Duration', value: '2021 - 2024' },
                { label: 'Funding Source', value: 'UofA RTP + Watts Denmark' },
                { label: 'PhD Students', value: '3 Graduated' },
                { label: 'Research Output', value: '15+ Publications' }
            ],
            description: [
                'The FRESNO project created a revolutionary platform to simulate, test, and verify advanced smart grid operation mechanisms at the distribution level. This groundbreaking platform facilitates studying larger amounts of renewable integration into the grid to provide a secure environment for larger adoption of electric vehicles by avoiding excessive capital cost of grid upgrades.',
                'Particularly beneficial for South Australia with the highest behind-the-meter PV and storage penetration per capita in the world, this project aligned perfectly with the SA government\'s plan to create the largest virtual power plant (VPP) in the world, consisting of 50,000 prosumers.'
            ],
            partners: ['Watts (Denmark)'],
            achievements: [
                { title: 'Three PhD Graduates', desc: 'Successfully supervised three PhD students to completion, all focused on different aspects of flexibility aggregation and prosumer modeling.' },
                { title: 'IEEE Competition Success', desc: 'Team FRESNO won 5th place in the international IEEE-CIS FORECAST+OPTIMIZE competition.' },
                { title: 'International Collaboration', desc: 'Students completed 6-month industry placements in Denmark with Watts, including round-trip tickets and additional €9K scholarship.' },
                { title: 'High-Impact Publications', desc: 'Multiple publications in top-tier journals including Renewable & Sustainable Energy Reviews and IEEE transactions.' },
                { title: 'Competitive Funding', desc: 'PhD students received $10K p.a. top-up scholarship and $5K p.a. research allowance from industry partner.' },
                { title: 'Platform Development', desc: 'Developed fully functional simulation platform for testing VPP operations and flexibility aggregation mechanisms.' }
            ]
        },
        move: {
            acronym: 'MOVE',
            title: 'Mining Operational Vehicles Electrification',
            subtitle: 'Transforming Australia\'s mining industry through battery-electric vehicles',
            meta: [
                { label: 'Duration', value: '2020 - 2024 (3.5 years)' },
                { label: 'Total Funding', value: '$3.5M+' },
                { label: 'Industry Partners', value: '7+ Organizations' },
                { label: 'PhD Students', value: '3 Active/Completing' }
            ],
            description: [
                'The MOVE project is a landmark industry-focused initiative providing the Australian mining industry with essential tools and information needed to transition operations to battery-supported electric vehicles (BEVs) and associated stationary machinery. The project addresses one of mining\'s most significant challenges: reducing the 30-50% of total mine site energy usage related to diesel-powered mining vehicles.',
                'This project enables the resources sector to reduce energy costs, improve reliability, enhance occupational health and safety (OHS), and significantly reduce the carbon footprint of mining production—addressing the industry\'s 4-7% contribution to global greenhouse gas emissions.'
            ],
            partners: [
                'Future Battery Industry CRC',
                'BHP Nickel West',
                'IGO Limited',
                'Energetics Pty Ltd',
                'Allkem',
                'Multicom Resources',
                'SA Dept Energy & Mining',
                'QLD Dept Energy',
                'MRIWA',
                'University of WA'
            ],
            achievements: [
                { title: 'All Deliverables Completed', desc: 'Successfully delivered all project reports and technical deliverables to FBICRC and industry partners on schedule.' },
                { title: 'Major Media Coverage', desc: 'Featured in Australian Mining Magazine and Nikkei Magazine (Japan) for leading-edge research in mining electrification.' },
                { title: 'Masterclass Delivery', desc: 'Delivered Underground Mining Fleet Electrification Masterclass in Perth (2024) for industry professionals.' },
                { title: 'Industry Partnerships', desc: 'Established strong collaborations with Australia\'s leading mining companies and government departments.' },
                { title: 'Technical Innovation', desc: 'Developed comprehensive assessment, design, and operational frameworks for battery-electric mining vehicles.' },
                { title: 'Environmental Impact', desc: 'Created pathways for mining industry to significantly reduce carbon emissions and improve sustainability.' }
            ]
        }
    };

    const modal = document.getElementById('project-modal');
    const modalOverlay = modal.querySelector('.project-modal-overlay');
    const modalClose = modal.querySelector('.project-modal-close');
    const modalAcronym = document.getElementById('modal-acronym');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('project-modal-body');

    // Open modal
    function openProjectModal(projectId) {
        const project = projectData[projectId];
        if (!project) return;

        // Set header
        modalAcronym.textContent = project.acronym;
        modalTitle.textContent = project.title;

        // Build body content
        let bodyHTML = '';

        // Subtitle
        bodyHTML += `<p style="color: var(--accent); font-weight: 500; margin-bottom: 1.5rem;">${project.subtitle}</p>`;

        // Meta info
        bodyHTML += '<div class="project-modal-meta">';
        project.meta.forEach(item => {
            bodyHTML += `
                <div class="project-modal-meta-item">
                    <h4>${item.label}</h4>
                    <p>${item.value}</p>
                </div>
            `;
        });
        bodyHTML += '</div>';

        // Description
        bodyHTML += '<div class="project-modal-description">';
        project.description.forEach(para => {
            bodyHTML += `<p>${para}</p>`;
        });
        bodyHTML += '</div>';

        // Partners
        bodyHTML += `
            <div class="project-modal-section">
                <h3>${project.partners.length > 1 ? 'Project Partners' : 'Industry Partner'}</h3>
                <div class="project-modal-partners">
                    ${project.partners.map(p => `<span class="project-modal-partner-badge">${p}</span>`).join('')}
                </div>
            </div>
        `;

        // Achievements
        bodyHTML += `
            <div class="project-modal-section">
                <h3>Key Achievements</h3>
                <div class="project-modal-achievements">
                    ${project.achievements.map(a => `
                        <div class="project-modal-achievement">
                            <h4>${a.title}</h4>
                            <p>${a.desc}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        modalBody.innerHTML = bodyHTML;

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close modal
    function closeProjectModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Event listeners for opening modal
    document.querySelectorAll('.project-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const projectId = this.getAttribute('data-project');
            openProjectModal(projectId);
        });
    });

    // Event listeners for closing modal
    modalClose.addEventListener('click', closeProjectModal);
    modalOverlay.addEventListener('click', closeProjectModal);

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeProjectModal();
        }
    });

    // Auto-open modal if URL has project hash
    const hash = window.location.hash.replace('#', '');
    if (hash && projectData[hash]) {
        // Small delay to allow page to render first
        setTimeout(() => {
            openProjectModal(hash);
        }, 100);
    }

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

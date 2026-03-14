// News functionality for index.html with filter tabs and modal

// State variables
let allNews = [];
let filteredNews = [];
let modalFilteredNews = [];
let activeFilter = 'all';
let modalActiveFilter = 'all';
const ITEMS_ON_PAGE = 5;

// Type groupings for filter tabs
const TYPE_GROUPS = {
    'all': null, // shows everything
    'publications': ['publication'],
    'awards-grants': ['award', 'grant'],
    'team': ['student', 'graduation'],
    'media': ['media'],
    'events': ['conference', 'collaboration']
};

// Load news from JSON
async function loadNews() {
    try {
        const response = await fetch('data/news.json');
        const data = await response.json();
        allNews = data.news;

        // Sort by date (newest first)
        allNews.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Initialize with all news
        filterNews('all');
    } catch (error) {
        console.error('Error loading news:', error);
        document.getElementById('news-container').innerHTML =
            '<p class="news-empty">Unable to load latest news. Please try again later.</p>';
    }
}

// Filter news on main page
function filterNews(groupKey) {
    activeFilter = groupKey;

    // Update active tab styling
    document.querySelectorAll('.news-filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === groupKey);
    });

    // Filter the news based on type group
    const allowedTypes = TYPE_GROUPS[groupKey];
    if (allowedTypes === null) {
        filteredNews = [...allNews];
    } else {
        filteredNews = allNews.filter(news => allowedTypes.includes(news.type));
    }

    // Display limited items on page
    displayNews();
}

// Display news items on main page (limited)
function displayNews() {
    const container = document.getElementById('news-container');
    const viewAllButton = document.getElementById('view-all-news');

    const itemsToShow = filteredNews.slice(0, ITEMS_ON_PAGE);

    if (itemsToShow.length === 0) {
        container.innerHTML = '<p class="news-empty">No news in this category.</p>';
        viewAllButton.style.display = 'none';
        return;
    }

    container.innerHTML = renderNewsItems(itemsToShow);

    // Show "View All" button if there are more items
    if (filteredNews.length > ITEMS_ON_PAGE) {
        viewAllButton.style.display = 'inline-block';
    } else {
        viewAllButton.style.display = 'none';
    }
}

// Render news items HTML
function renderNewsItems(items) {
    let html = '';

    items.forEach(news => {
        const date = new Date(news.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const typeLabel = getNewsTypeLabel(news.type);

        html += `
            <div class="news-item ${news.featured ? 'featured' : ''}">
                <div class="news-meta">
                    <span class="news-date">${formattedDate}</span>
                    <span class="update-type-label update-type-${news.type}">${typeLabel}</span>
                </div>
                <div class="news-content">
                    ${news.link && news.link !== '#' ?
                        `<a href="${news.link}" class="news-link">${news.title}</a>` :
                        `<span class="news-link">${news.title}</span>`
                    }
                </div>
            </div>
        `;
    });

    return html;
}

// Modal functions
function openModal() {
    const modal = document.getElementById('news-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Initialize modal with same filter as main page
    filterModalNews(activeFilter);
}

function closeModal() {
    const modal = document.getElementById('news-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function filterModalNews(groupKey) {
    modalActiveFilter = groupKey;

    // Update active tab styling in modal
    document.querySelectorAll('.news-modal-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === groupKey);
    });

    // Filter the news
    const allowedTypes = TYPE_GROUPS[groupKey];
    if (allowedTypes === null) {
        modalFilteredNews = [...allNews];
    } else {
        modalFilteredNews = allNews.filter(news => allowedTypes.includes(news.type));
    }

    // Display all filtered items in modal
    displayModalNews();
}

function displayModalNews() {
    const container = document.getElementById('news-modal-container');

    if (modalFilteredNews.length === 0) {
        container.innerHTML = '<p class="news-empty">No news in this category.</p>';
        return;
    }

    container.innerHTML = renderNewsItems(modalFilteredNews);
}

// Get type label for news type
function getNewsTypeLabel(type) {
    const labels = {
        'publication': 'Publication',
        'student': 'Student',
        'media': 'Media',
        'grant': 'Grant',
        'graduation': 'Graduation',
        'conference': 'Conference',
        'collaboration': 'Partnership',
        'award': 'Award',
        'default': 'News'
    };
    return labels[type] || labels.default;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Main page filter tab click handlers
    document.querySelectorAll('.news-filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            filterNews(this.dataset.filter);
        });
    });

    // View All button opens modal
    const viewAllButton = document.getElementById('view-all-news');
    viewAllButton.addEventListener('click', openModal);

    // Modal tab click handlers
    document.querySelectorAll('.news-modal-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            filterModalNews(this.dataset.filter);
        });
    });

    // Close modal handlers
    const modal = document.getElementById('news-modal');
    const closeBtn = modal.querySelector('.news-modal-close');
    const overlay = modal.querySelector('.news-modal-overlay');

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Load news on page load
    loadNews();
});

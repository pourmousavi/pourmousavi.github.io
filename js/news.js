// News/Updates functionality for index.html
let allNews = [];
let showingAll = false;
const maxDisplayItems = 5;

// Load news from JSON
async function loadNews() {
    try {
        const response = await fetch('data/news.json');
        const data = await response.json();
        allNews = data.news;
        
        // Sort by date (newest first)
        allNews.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        displayNews();
    } catch (error) {
        console.error('Error loading news:', error);
        document.getElementById('updates-container').innerHTML = 
            '<p style="text-align: center; color: var(--text-secondary); grid-column: 1 / -1;">Unable to load latest updates. Please try again later.</p>';
    }
}

// Display news items
function displayNews() {
    const container = document.getElementById('updates-container');
    const viewAllButton = document.getElementById('view-all-updates');
    
    const itemsToShow = showingAll ? allNews : allNews.slice(0, maxDisplayItems);
    
    if (itemsToShow.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1 / -1;">No updates available.</p>';
        return;
    }
    
    let html = '';
    
    itemsToShow.forEach(news => {
        const date = new Date(news.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short',
            day: 'numeric'
        });
        
        // Get type label styling
        const typeLabel = getNewsTypeLabel(news.type);
        
        html += `
            <div class="update-item ${news.featured ? 'update-featured' : ''}">
                <div class="update-labels">
                    <span class="update-date-label">${formattedDate}</span>
                    <span class="update-type-label update-type-${news.type}">${typeLabel}</span>
                </div>
                <div class="update-text">
                    ${news.link && news.link !== '#' ? 
                        `<a href="${news.link}" class="update-link">${news.title}</a>` : 
                        `<span>${news.title}</span>`
                    }
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Show/hide "View All" button
    if (allNews.length > maxDisplayItems) {
        viewAllButton.style.display = 'inline-block';
        viewAllButton.textContent = showingAll ? 'Show Recent Only' : 'View All Updates';
    } else {
        viewAllButton.style.display = 'none';
    }
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
    // View all button functionality
    const viewAllButton = document.getElementById('view-all-updates');
    viewAllButton.addEventListener('click', function() {
        showingAll = !showingAll;
        displayNews();
        
        // Scroll to updates section if showing all
        if (showingAll) {
            document.querySelector('#updates-container').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
    
    // Load news on page load
    loadNews();
});
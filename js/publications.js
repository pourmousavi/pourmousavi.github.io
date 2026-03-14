// Publications page JavaScript functionality
let allPublications = [];
let featuredPublications = [];
let activeFilters = new Set(['featured', 'journal', 'conference', 'book_chapter', 'book', 'patent']);
let searchTerm = '';

// Convert markdown links to HTML buttons
function convertMarkdownLinksToButtons(text) {
    if (!text) return '';
    
    // Match markdown links: [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    return text.replace(markdownLinkRegex, (match, linkText, url) => {
        return `<a href="${url}" target="_blank" class="pub-note-link">${linkText}</a>`;
    });
}

// Load publications from JSON
async function loadPublications() {
    try {
        const response = await fetch('data/publications.json');
        const data = await response.json();
        allPublications = data.publications;
        
        // Sort by year (newest first)
        allPublications.sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year;
            // If same year, sort by month (latest first)
            const monthOrder = {
                'December': 12, 'Dec.': 12, 'Nov.': 11, 'November': 11, 
                'October': 10, 'Oct.': 10, 'September': 9, 'Sep.': 9,
                'August': 8, 'Aug.': 8, 'July': 7, 'Jul.': 7,
                'June': 6, 'Jun.': 6, 'May': 5, 'April': 4, 'Apr.': 4,
                'March': 3, 'Mar.': 3, 'February': 2, 'Feb.': 2,
                'January': 1, 'Jan.': 1
            };
            const aMonth = monthOrder[a.month] || 0;
            const bMonth = monthOrder[b.month] || 0;
            return bMonth - aMonth;
        });
        
        buildFeaturedList();
        updateCounts();
        displayPublications();
    } catch (error) {
        console.error('Error loading publications:', error);
        document.getElementById('publications-container').innerHTML = 
            '<p style="text-align: center; color: var(--text-secondary);">Error loading publications. Please try again later.</p>';
    }
}

// Build featured publications list with reasons
function buildFeaturedList() {
    // Priority 1: Papers explicitly marked as featured
    const manuallyFeatured = allPublications.filter(p => p.featured === true);
    
    // If there are manually featured papers, use ONLY those (no fallback)
    if (manuallyFeatured.length > 0) {
        featuredPublications = manuallyFeatured.slice(0, 10); // Limit to max 10
    } else {
        // Fallback: Only use automatic selection if NO manually featured papers exist
        
        // Priority 2: Papers with awards
        const awarded = allPublications.filter(p => p.award && p.award.trim());
        
        // Priority 3: Recent high-impact journals (2020+) as backup
        const recentJournals = allPublications
            .filter(p => p.type === 'journal' && p.year >= 2020 && !p.award)
            .slice(0, 20);
        
        // Combine: awards first, then recent journals to reach minimum 6
        let featured = awarded.slice(0, 6);
        
        if (featured.length < 6) {
            const need = 6 - featured.length;
            featured = featured.concat(recentJournals.slice(0, need));
        }
        
        featuredPublications = featured.slice(0, 10); // Limit to max 10
    }
    
    // Add reasons for featuring
    featuredPublications.forEach(pub => {
        // Use custom reason if provided, otherwise generate one
        if (!pub.featuredReason) {
            if (pub.featured && pub.award) {
                pub.featuredReason = `Featured research: ${pub.award}`;
            } else if (pub.featured) {
                pub.featuredReason = 'Selected as a key contribution to the field';
            } else if (pub.award) {
                pub.featuredReason = `Award-winning research: ${pub.award}`;
            } else if (pub.type === 'journal') {
                pub.featuredReason = 'High-impact journal publication with significant citations';
            } else {
                pub.featuredReason = 'Notable contribution to the field';
            }
        }
    });
}

// Render Featured Papers based on simple heuristics (awards or notable notes)
function renderFeaturedPapers() {
    const container = document.getElementById('featured-papers');
    if (!container) return;

    // Heuristic: prioritize items with awards, then recent high-impact journals
    const awarded = allPublications.filter(p => p.award && p.award.trim());
    let featured = awarded.slice(0, 5);

    if (featured.length < 3) {
        const journals = allPublications
            .filter(p => p.type === 'journal')
            .slice(0, 20);
        const need = 3 - featured.length;
        featured = featured.concat(journals.filter(j => !featured.includes(j)).slice(0, need));
    }

    if (!featured.length) {
        container.style.display = 'none';
        return;
    }

    const list = container.querySelector('.featured-list');
    let html = '<ul class="featured-papers-list">';
    featured.forEach(p => {
        const venue = p.journal || p.conference || p.book || '';
        const note = p.award ? p.award : (p.abstract ? p.abstract : venue);
        const teaser = (note || '').toString().replace(/<[^>]*>/g, '').slice(0, 160) + (note && note.length > 160 ? '…' : '');
        html += `
            <li class="featured-paper-item">
                <div class="featured-paper-title">${p.title}</div>
                <div class="featured-paper-meta">${venue} • ${p.year}</div>
                <div class="featured-paper-teaser" style="color: var(--text-secondary); font-size: .95rem;">${teaser}</div>
            </li>`;
    });
    html += '</ul>';
    list.innerHTML = html;
    container.style.display = 'block';
}

// Update publication counts in tabs
function updateCounts() {
    const counts = {
        all: allPublications.length,
        featured: featuredPublications.length,
        journal: allPublications.filter(p => p.type === 'journal').length,
        conference: allPublications.filter(p => p.type === 'conference').length,
        book_chapter: allPublications.filter(p => p.type === 'book_chapter').length,
        book: allPublications.filter(p => p.type === 'book').length,
        patent: allPublications.filter(p => p.type === 'patent').length
    };

    Object.keys(counts).forEach(type => {
        const element = document.getElementById(`count-${type}`);
        if (element) element.textContent = counts[type];
    });

    // Update total publications in stats bar
    const totalPubsElement = document.getElementById('total-publications');
    if (totalPubsElement) {
        totalPubsElement.textContent = allPublications.length;
    }
}

// Display publications based on current filters and search
function displayPublications() {
    const container = document.getElementById('publications-container');

    // Filter publications based on active filter chips
    let filteredPubs = allPublications.filter(pub => {
        // Check if publication type is in active filters
        if (activeFilters.has(pub.type)) return true;
        // Check if featured filter is active and publication is featured
        if (activeFilters.has('featured') && featuredPublications.includes(pub)) return true;
        return false;
    });

    // Remove duplicates (a featured publication might also match its type)
    filteredPubs = [...new Map(filteredPubs.map(p => [p.title, p])).values()];

    // Apply search filter if search term exists
    if (searchTerm.trim()) {
        filteredPubs = filteredPubs.filter(pub => {
            const searchText = searchTerm.toLowerCase();
            const venue = pub.journal || pub.conference || pub.book || '';
            return pub.title.toLowerCase().includes(searchText) ||
                   pub.authors.toLowerCase().includes(searchText) ||
                   venue.toLowerCase().includes(searchText) ||
                   (pub.abstract && pub.abstract.toLowerCase().includes(searchText));
        });

        // Update search results text
        const resultsText = document.getElementById('search-results');
        resultsText.style.display = 'block';
        resultsText.textContent = `Found ${filteredPubs.length} publication${filteredPubs.length !== 1 ? 's' : ''} matching "${searchTerm}"`;
    } else {
        // Hide search results text when no search
        document.getElementById('search-results').style.display = 'none';
    }

    if (filteredPubs.length === 0) {
        const noResultsMsg = searchTerm.trim() ?
            `No publications found matching "${searchTerm}" with the selected filters.` :
            'No publications found. Try selecting more filter types.';
        container.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">${noResultsMsg}</p>`;
        return;
    }

    let html = '<div class="publication-list">';
    
    filteredPubs.forEach(pub => {
        html += `<div class="publication-item" data-type="${pub.type}">`;
        
        // Main content on the left, metadata on the right
        html += '<div class="pub-content">';
        html += `<h3 class="pub-title">${pub.title}</h3>`;
        html += `<p class="pub-authors">${pub.authors}</p>`;
        
        // Publication details based on type
        let details = '';
        if (pub.type === 'journal' && pub.journal) {
            details = pub.journal;
            if (pub.volume) details += `, ${pub.volume}`;
        } else if (pub.type === 'conference' && pub.conference) {
            details = pub.conference;
            if (pub.location) details += `, ${pub.location}`;
        } else if (pub.type === 'book_chapter' && pub.book) {
            details = `In: ${pub.book}`;
            if (pub.publisher) details += `, ${pub.publisher}`;
        } else if (pub.type === 'book' && pub.publisher) {
            details = pub.publisher;
        } else if (pub.type === 'patent' && pub.patent_office) {
            details = pub.patent_office;
            if (pub.patent_number) details += ` (${pub.patent_number})`;
        }
        
        if (details) {
            html += `<p class="pub-venue">${details}</p>`;
        }

        // Add abstract if available
        if (pub.abstract && pub.abstract.trim()) {
            html += `<div class="pub-abstract" style="margin-top: 0.75rem;">${pub.abstract}</div>`;
        }

        // Add notes if available
        if (pub.notes && pub.notes.trim()) {
            const notesHtml = convertMarkdownLinksToButtons(pub.notes);
            html += `<div class="publication-notes">${notesHtml}</div>`;
        }

        html += '</div>'; // Close pub-content

        // Metadata on the right
        html += '<div class="pub-metadata">';

        // Year badge, Featured indicator, and Best Paper indicator
        html += `<div class="pub-year-container">`;
        if (featuredPublications.includes(pub)) {
            html += `<span class="pub-badge pub-featured">FEATURED</span>`;
        }
        if (pub.award === 'Best Paper') {
            html += `<span class="pub-badge pub-award-best-paper">BEST PAPER</span>`;
        }
        html += `<span class="pub-badge pub-year">${pub.year}</span>`;
        html += `</div>`;
        
        // Show other awards as separate badges below
        if (pub.award && pub.award !== 'Best Paper') {
            html += `<span class="pub-badge pub-award">${pub.award}</span>`;
        }
        
        // Links
        html += '<div class="pub-links">';
        if (pub.url) {
            html += `<a href="${pub.url}" target="_blank" class="pub-link" title="View Publication">🔗</a>`;
        }
        if (pub.pdf) {
            html += `<a href="${pub.pdf}" target="_blank" class="pub-link" title="Download PDF">📄</a>`;
        }
        html += '</div>';
        html += '</div>'; // Close pub-metadata
        
        html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
}

// Display featured publications with special card layout
function displayFeaturedPublications(pubs, container) {
    let html = '<div class="featured-publications-grid">';
    
    pubs.forEach((pub, index) => {
        const venue = pub.journal || pub.conference || pub.book || '';
        const abstract = pub.abstract ? pub.abstract.replace(/<[^>]*>/g, '').slice(0, 200) + '...' : '';
        
        html += `<div class="featured-pub-card">`;
        
        // Featured badge
        html += `<div class="featured-pub-header">`;
        html += `<span class="featured-rank">Featured #${index + 1}</span>`;
        if (pub.award) {
            html += `<span class="featured-award-badge">🏆 ${pub.award}</span>`;
        }
        html += `</div>`;
        
        // Title and authors
        html += `<h3 class="featured-pub-title">${pub.title}</h3>`;
        html += `<p class="featured-pub-authors">${pub.authors}</p>`;
        
        // Venue and year
        html += `<p class="featured-pub-venue">${venue} • ${pub.year}</p>`;
        
        // Why featured section
        html += `<div class="featured-reason">`;
        html += `<div class="featured-reason-label">Why Featured:</div>`;
        html += `<p class="featured-reason-text">${pub.featuredReason}</p>`;
        html += `</div>`;
        
        // Abstract excerpt
        if (abstract) {
            html += `<div class="featured-pub-abstract">${abstract}</div>`;
        }
        
        // Links
        html += '<div class="featured-pub-links">';
        if (pub.url) {
            html += `<a href="${pub.url}" target="_blank" class="featured-link" title="View Publication">🔗</a>`;
        }
        if (pub.pdf) {
            html += `<a href="${pub.pdf}" target="_blank" class="featured-link" title="Download PDF">📄</a>`;
        }
        html += '</div>';
        
        html += '</div>'; // Close card
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Filter chip buttons functionality
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', function() {
            const filterType = this.dataset.filter;

            // Toggle the active state
            if (activeFilters.has(filterType)) {
                activeFilters.delete(filterType);
                this.classList.remove('active');
            } else {
                activeFilters.add(filterType);
                this.classList.add('active');
            }

            displayPublications();
        });
    });

    // Search functionality
    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('clear-search');

    searchInput.addEventListener('input', function() {
        searchTerm = this.value;
        displayPublications();
        
        // Show/hide clear button
        clearButton.style.display = searchTerm.trim() ? 'block' : 'none';
    });

    clearButton.addEventListener('click', function() {
        searchInput.value = '';
        searchTerm = '';
        this.style.display = 'none';
        displayPublications();
        searchInput.focus();
    });

    // Load publications on page load
    loadPublications();
});
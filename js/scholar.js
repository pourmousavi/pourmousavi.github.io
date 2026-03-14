// Populate total citations and h-index dynamically.
// Note: Google Scholar does not provide a public API and blocks direct scraping from the browser
// due to CORS and bot protections. This script is designed to read from a local JSON file
// (data/scholar_metrics.json) that you can update via a small server-side task or manual refresh.

(function() {
  const CITATIONS_EL = document.getElementById('total-citations');
  const HINDEX_EL = document.getElementById('h-index');
  if (!CITATIONS_EL && !HINDEX_EL) return;

  // Helper to format numbers with commas
  const formatNumber = (n) => {
    try { return Number(n).toLocaleString(); } catch { return n; }
  };

  fetch('data/scholar_metrics.json', { cache: 'no-store' })
    .then((r) => r.ok ? r.json() : null)
    .then((data) => {
      if (!data) return;
      if (CITATIONS_EL && data.totalCitations != null) {
        CITATIONS_EL.textContent = formatNumber(data.totalCitations);
      }
      if (HINDEX_EL && data.hIndex != null) {
        HINDEX_EL.textContent = String(data.hIndex);
      }
    })
    .catch(() => { /* silent */ });
})();

// ==================== API Configuration ====================
const API_URL = 'http://localhost:5000/api';

/**
 * Load all artworks from the server and display them in grid
 */
async function loadArtworks() {
  try {
    // Fetch artworks from API
    const response = await fetch(`${API_URL}/gallery`);
    
    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const artworks = await response.json();

    const gallery = document.getElementById('galleryGrid');
    const loading = document.getElementById('loading');

    // Hide loading message
    loading.style.display = 'none';

    // Check if artworks exist
    if (!artworks || artworks.length === 0) {
      gallery.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
          <p style="font-size: 1.2rem; color: #888;">
            🎨 No artworks yet. Check back soon!
          </p>
        </div>
      `;
      return;
    }

    // Generate HTML for each artwork
    gallery.innerHTML = artworks
      .map((artwork) => createArtworkCard(artwork))
      .join('');

    // Add animation to cards
    animateCards();
  } catch (error) {
    console.error('Error loading artworks:', error);
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    loading.innerHTML = `
      <p style="color: var(--accent); font-size: 1rem;">
        ⚠️ Error loading artworks. Please try again later.
      </p>
    `;
  }
}

/**
 * Create HTML for a single artwork card
 * @param {Object} artwork - Artwork object from database
 * @returns {string} HTML string for artwork
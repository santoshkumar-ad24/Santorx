// Blog category filter and load more functionality
document.addEventListener('DOMContentLoaded', function () {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const blogsContainer = document.getElementById('blogs-container');
  const categoryGroups = document.querySelectorAll('.category-group');
  const itemsPerGroup = 6;

  // Store blog data from HTML
  const blogsByCategory = {};
  categoryGroups.forEach(group => {
    const category = group.getAttribute('data-category');
    const cards = group.querySelectorAll('.blogs-card');
    blogsByCategory[category] = Array.from(cards).map(card => ({
      html: card.outerHTML,
      element: card
    }));
  });

  // Filter blogs by category
  filterButtons.forEach(button => {
    button.addEventListener('click', function () {
      const selectedCategory = this.getAttribute('data-category');

      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      // Show/hide groups based on filter
      categoryGroups.forEach(group => {
        const groupCategory = group.getAttribute('data-category');
        
        if (selectedCategory === 'all' || groupCategory === selectedCategory) {
          group.classList.remove('hidden');
          group.style.animation = 'fadeIn 0.4s ease-in-out';
        } else {
          group.classList.add('hidden');
        }
      });
    });
  });

  // Load More functionality for each category
  const loadMoreButtons = document.querySelectorAll('.load-more-btn');
  loadMoreButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const category = this.getAttribute('data-category');
      const total = parseInt(this.getAttribute('data-total'));
      let shown = parseInt(this.getAttribute('data-shown'));
      
      const categoryGroup = document.querySelector(`[data-category="${category}"]`);
      const articleGrid = categoryGroup.querySelector('.article');
      
      // Find original blog data from backend
      const allCards = categoryGroup.querySelectorAll('.blogs-card');
      const currentlyShown = allCards.length;
      
      // Load 6 more items
      const nextBatch = shown + itemsPerGroup;
      const remaining = total - nextBatch;

      // Create hidden cards for new items
      const hiddenCardsFromHTML = categoryGroup.querySelectorAll('.blogs-card[data-hidden="true"]');
      
      let cardsAdded = 0;
      hiddenCardsFromHTML.forEach(card => {
        if (cardsAdded < itemsPerGroup) {
          card.removeAttribute('data-hidden');
          card.style.animation = 'fadeIn 0.4s ease-in-out';
          cardsAdded++;
        }
      });

      // Update button state
      if (remaining <= 0) {
        this.style.display = 'none';
      } else {
        this.setAttribute('data-shown', nextBatch);
        this.textContent = remaining > 0 ? `Load More (${remaining} more)` : 'No more articles';
      }

      // Smooth scroll to new content
      setTimeout(() => {
        articleGrid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    });
  });

  // Add fade-in animation
  if (!document.querySelector('#fadeInAnimation')) {
    const style = document.createElement('style');
    style.id = 'fadeInAnimation';
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }
});


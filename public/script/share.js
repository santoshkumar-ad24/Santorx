// Get the current page URL and title
const currentUrl = window.location.href;
const pageTitle = document.title;
// ==================== COPY LINK ====================
const copyLinkBtn = document.getElementById("copyLinkBtn");
if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", (e) => {
        e.preventDefault();
        
        // Copy to clipboard
        navigator.clipboard.writeText(currentUrl)
            .then(() => {
                // Show feedback
                const originalText = copyLinkBtn.textContent;
                copyLinkBtn.textContent = "✓ 🔗";
                copyLinkBtn.style.opacity = "0.7";
                
                setTimeout(() => {
                    copyLinkBtn.textContent = originalText;
                    copyLinkBtn.style.opacity = "1";
                }, 2000);
            })
            .catch(err => {
                console.error("Failed to copy: ", err);
                alert("Failed to copy link");
            });
    });
}

// ==================== FACEBOOK SHARE ====================
const facebookBtn = document.getElementById("shareBtn-facebook");
if (facebookBtn) {
    facebookBtn.addEventListener("click", (e) => {
        e.preventDefault();
        
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
        window.open(facebookUrl, 'facebook-share-dialog', 'width=800,height=600');
    });
}

// ==================== TWITTER SHARE ====================
const twitterBtn = document.getElementById("shareBtn-twitter");
if (twitterBtn) {
    twitterBtn.addEventListener("click", (e) => {
        e.preventDefault();
        
        const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(pageTitle)}`;
        window.open(twitterUrl, 'twitter-share-dialog', 'width=800,height=600');
    });
}

// ==================== LINKEDIN SHARE ====================
const linkedinBtn = document.getElementById("shareBtn-linkedin");
if (linkedinBtn) {
    linkedinBtn.addEventListener("click", (e) => {
        e.preventDefault();
        
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
        window.open(linkedinUrl, 'linkedin-share-dialog', 'width=800,height=600');
    });
}

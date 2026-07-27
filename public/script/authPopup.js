document.addEventListener('DOMContentLoaded', function () {
    var signButton = document.querySelector('.register .logBtn');
    var authModal = document.getElementById('authModal');
    var authClose = document.getElementById('authClose');
    var authBackdrop = authModal;
    var googleLink = document.querySelector('.google-btn');

    function closeModal() {
        if (authModal) {
            authModal.classList.add('hidden');
            authModal.setAttribute('aria-hidden', 'true');
        }
    }

    function openModal() {
        if (authModal) {
            authModal.classList.remove('hidden');
            authModal.setAttribute('aria-hidden', 'false');

            // Capture and store the current full URL
            if (googleLink) {
                // Get the full URL path with query and hash
                var fullUrl = window.location.pathname + window.location.search + window.location.hash;
                // Also store in sessionStorage as backup
                sessionStorage.setItem('authReturnTo', fullUrl);

                var returnToParam = encodeURIComponent(fullUrl);
                googleLink.href = '/auth/google?returnTo=' + returnToParam;
            }
        }
    }

    if (signButton) {
        signButton.addEventListener('click', function () {
            openModal();
        });
    }

    var triggerAuthBtns = document.querySelectorAll('.trigger-auth-modal');
    triggerAuthBtns.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            var action = btn.getAttribute('data-action');
            if (action === 'bookmark') {
                sessionStorage.setItem('autoBookmark', 'true');
            }
            openModal();
        });
    });

    var ajaxForms = document.querySelectorAll('.ajax-bookmark-form');
    ajaxForms.forEach(function (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = form.querySelector('button[type="submit"], .bookmark-btn');
            var iconSpan = form.querySelector('.book-icon');
            if (btn) btn.style.opacity = '0.5';

            fetch(form.action, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                }
            })
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    if (data.success) {
                        if (btn) {
                            btn.style.opacity = '1';
                            btn.setAttribute('aria-label', data.bookmarked ? 'Remove bookmark article' : 'Bookmark article');
                        }
                        if (iconSpan) {
                            iconSpan.innerHTML = data.bookmarked
                                ? '<img class="blog-interact-icon" src="/image/saved-icon.png" alt="saved">'
                                : '<img class="blog-interact-icon" src="/image/bookmark-icon.png" alt="bookmark">';
                        }
                    }
                })
                .catch(function (error) {
                    console.error('Error:', error);
                    if (btn) btn.style.opacity = '1';
                });
        });
    });

    if (sessionStorage.getItem('autoBookmark') === 'true') {
        var bookmarkForm = document.querySelector('.ajax-bookmark-form');
        if (bookmarkForm) {
            sessionStorage.removeItem('autoBookmark');
            bookmarkForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
    }

    if (authClose) {
        authClose.addEventListener('click', closeModal);
    }

    if (authBackdrop) {
        authBackdrop.addEventListener('click', function (event) {
            if (event.target === authBackdrop) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const userMenu = document.querySelector('.signedIn');
    const dropdown = document.querySelector('.user-dropdown');
    const logOpt = document.querySelector('.logOpt');

    if (userMenu && dropdown) {
        // Toggle dropdown on click
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent body click from firing
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
            if (logOpt) {
                logOpt.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(90deg)';
            }
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.style.display = 'none';
            if (logOpt) {
                logOpt.style.transform = 'rotate(0deg)';
            }
        });

        // Prevent closing when clicking inside dropdown
        dropdown.addEventListener('click', (e) => e.stopPropagation());
    }
});

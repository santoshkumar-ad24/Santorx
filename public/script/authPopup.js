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
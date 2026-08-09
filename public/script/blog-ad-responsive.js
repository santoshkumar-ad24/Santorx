document.addEventListener('DOMContentLoaded', function () {
    const sideAdIframes = Array.from(document.querySelectorAll('.ad-sidescroll iframe'));
    if (!sideAdIframes.length) return;

    sideAdIframes.forEach((iframe) => {
        iframe.dataset.originalSrc = iframe.src;
        iframe.dataset.originalWidth = iframe.width;
        iframe.dataset.originalHeight = iframe.height;
    });

    function updateSideAds() {
        const width = window.innerWidth || document.documentElement.clientWidth;
        const useMobileBanner = width < 771;

        sideAdIframes.forEach((iframe) => {
            if (useMobileBanner) {
                iframe.src = '/ads/banner320';
                iframe.width = 320;
                iframe.height = 50;
            } else {
                iframe.src = iframe.dataset.originalSrc || iframe.src;
                iframe.width = iframe.dataset.originalWidth || iframe.width;
                iframe.height = iframe.dataset.originalHeight || iframe.height;
            }
        });
    }

    let resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateSideAds, 150);
    });

    updateSideAds();
});

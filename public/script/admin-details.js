// Admin Details JavaScript

document.addEventListener('DOMContentLoaded', function () {
    const imageCircle = document.getElementById('image-circle');
    const imageUpload = document.getElementById('image-upload');
    const form = document.getElementById('uploadForm')

    // Image upload functionality
    if (imageCircle && imageUpload) {
        imageCircle.addEventListener('click', function () {
            imageUpload.click();
        });

        imageUpload.addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (form && file) {
                form.submit();
            } else{
                console.log("Not Found")
            }

        });
    }
});
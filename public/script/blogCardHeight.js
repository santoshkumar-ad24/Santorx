const blogImage = document.getElementsByClassName("img-blog");
    Array.from(blogImage).forEach(img => {
        const imageHeight = Math.floor(150 + Math.random() * 180);
        img.style.height = imageHeight + "px";
    });
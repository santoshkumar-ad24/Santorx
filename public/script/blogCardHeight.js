const blogImage = document.getElementsByClassName("img-blog");
    Array.from(blogImage).forEach(img => {
        const imageHeight = Math.floor(200 + Math.random() * 220);
        img.style.height = imageHeight + "px";
        console.log(imageHeight);
    });
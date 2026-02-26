
/**
 * Blog Description Truncation for Production
 * Optimizes excerpt lengths across different page layouts
 */

const blogExcerpt = document.getElementsByClassName("blog-excerpt");
const featBlogDes = document.getElementsByClassName("blogList-des");
const featuredBlogDesc = document.getElementById("featBlogDes");

/**
 * Truncate text to specified word count
 * @param {string} text - Original text
 * @param {number} wordCount - Max words to keep
 * @returns {string} - Truncated text with ellipsis
 */
function truncateText(text, wordCount) {
    const words = text.trim().split(/\s+/);
    if (words.length > wordCount) {
        return words.slice(0, wordCount).join(" ") + "...";
    }
    return text;
}

// Featured blog description (index.ejs featured section) - shorter for clean look
if (featuredBlogDesc && featuredBlogDesc.innerText) {
    featuredBlogDesc.innerText = truncateText(featuredBlogDesc.innerText, 25);
}

// Blog cards excerpts (index.ejs and my_blog.ejs main grid) - medium length for balance
Array.from(blogExcerpt).forEach(element => {
    element.innerText = truncateText(element.innerText, 18);
});

// Sidebar recommended posts (blog.ejs) - shorter for compact sidebar
Array.from(featBlogDes).forEach(element => {
    element.innerText = truncateText(element.innerText, 12);
});
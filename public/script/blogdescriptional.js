
const blogExcerpt = document.getElementsByClassName("blog-excerpt");
const featBlogDes = document.getElementById("featBlogDes");




Array.from(blogExcerpt).forEach(element => {
    const blogTextWord=  element.innerText.split(" ");
    let blogDes = "";
    if(blogTextWord.length > 20){
        for (let index = 0; index < 20; index++) {
            blogDes = blogDes + blogTextWord[index] + " ";   
        }
        element.innerText = blogDes + "...";
    }
});
const featTextWord=  featBlogDes.innerText.split(" ");
let featDes = "";
if(featTextWord.length > 25){
    for (let index = 0; index < 25; index++) {
     featDes = featDes + featTextWord[index] + " ";   
    }
    featBlogDes.innerText = featDes + "...";
}
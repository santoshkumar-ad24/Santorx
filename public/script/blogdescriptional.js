
const blogExcerpt = document.getElementsByClassName("blog-excerpt");
const featBlogDes = document.getElementsByClassName("blogList-des");




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
Array.from(featBlogDes).forEach(element => {

    const featTextWord=  element.innerText.split(" ");
    let featDes = "";
    if(featTextWord.length > 25){
        for (let index = 0; index < 25; index++) {
            featDes = featDes + featTextWord[index] + " ";   
        }
        element.innerText = featDes + "...";
    }
});
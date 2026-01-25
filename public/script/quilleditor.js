const editor = document.getElementById("editor");
const publish = document.getElementById("publish");
const output = document.getElementById("content");
const imageUrl = document.getElementById("imageUrl");


const toolbar_option = {
    container: [
        ['bold', 'italic', 'underline', 'strike'],        
        ['blockquote', 'code-block'],
        ['link', 'image'],
        [{ 'header': 1 }, { 'header': 2 }],               
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
        [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
        [{ 'direction': 'rtl' }],                         // text direction

        [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'font': [] }],
        [{ 'align': [] }],

        ['clean']                                         // remove formatting button
    ],
    handlers: {
        image: imageHandler,
    }
};
const quill = new Quill(editor, {
    theme: 'snow',
    modules: {
        toolbar: toolbar_option,
    },

});


function imageHandler() {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.setAttribute("name", "image");
    input.click();

    input.onchange = async () => {
        const file = input.files[0];
        const formData = new FormData();
        formData.append("image", file)

        const res = await fetch("/cloud/upload-image", {
            method: "POST",
            body: formData
        });
        const data = await res.json()
        if (imageUrl.value === 'null') {
            console.log("No hidden input to set image URL");
            console.log("Uploaded image URL:", data.url);
            imageUrl.value = data.url;
        }

        const range = quill.getSelection();

        quill.insertEmbed(range.index, "image", data.url);
    };

}



publish.addEventListener('click', () => {
    const content = quill.root.innerHTML;

    const contentWithoutImages = content.replace(/<img[^>]*>/, "");
    output.value = contentWithoutImages;

})
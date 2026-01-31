
const blogListDes = document.getElementsByClassName("blogList-des");

// Category Filter Functionality
    const filterBtns = document.querySelectorAll('.filter-btn');
    const blogCards = document.querySelectorAll('.blogs-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedCategory = btn.getAttribute('data-category');
            
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            // Filter blog cards
            blogCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                
                if (selectedCategory === 'all') {
                    card.style.display = 'block';
                } else if (cardCategory === selectedCategory) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });



    
Array.from(blogListDes).forEach(element => {
    const textWord=  element.innerText.split(" ");
    let newDes = "";
    if(textWord.length > 12){
        for (let index = 0; index < 12; index++) {
         newDes = newDes + textWord[index] + " ";   
        }
        element.innerText = newDes+"...";
    }
});




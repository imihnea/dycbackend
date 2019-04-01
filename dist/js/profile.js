document.addEventListener('DOMContentLoaded', () => {
    let i = 0;
    let showMore = document.querySelector('.showMore');
    showMore.addEventListener('click', () => {
        const loadThis = document.querySelectorAll('.noLoad');
        loadThis.forEach((product) => {
            product.classList.toggle('hidden');
        });
        const imgs = document.querySelectorAll('.noImg');
        imgs.forEach((img) => {
            img.src = img.dataset.src;
        });
        ++i;
        if (i % 2 == 0) {
            showMore.innerHTML = 'Show more';
        } else {
            showMore.innerHTML = "Show less";
        }
    });
});
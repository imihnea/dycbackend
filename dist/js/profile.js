document.addEventListener('DOMContentLoaded', () => {
    const maxToShow = 4;
    let showMore = document.querySelector('.showMore');
    let showLess = document.querySelector('.showLess');

    showMore.addEventListener('click', () => {
        const loadThis = document.querySelectorAll('.noLoad');
        let j = 0;
        while ((j < maxToShow) && (j < loadThis.length)) {
            loadThis[j].classList.remove('noLoad');
            loadThis[j].classList.remove('hidden');
            loadThis[j].classList.add('loaded');
            j += 1;
        }
        let img = document.querySelectorAll('.noImg');
        if (img.length > 0) {
            for (let i = 0; i < j; i += 1) {
                if (img[i].classList.contains('noImg')) {
                    img[i].classList.remove('noImg');
                    img[i].src = img[i].dataset.src;
                }
            }
        }
        const remaining = document.querySelectorAll('.noLoad');
        if (remaining.length == 0) {
            showMore.classList.add('hidden');
        }
        if (showLess.classList.contains('hidden')) {
            showLess.classList.remove('hidden');
        }
    });

    showLess.addEventListener('click', () => {
        const hideThis = document.querySelectorAll('.loaded');
        let j = 0;
        while ((j < maxToShow) && (j < hideThis.length)) {
            hideThis[(hideThis.length - j - 1)].classList.remove('loaded');
            hideThis[(hideThis.length - j - 1)].classList.add('hidden');
            hideThis[(hideThis.length - j - 1)].classList.add('noLoad');
            j += 1;
        }
        const remaining = document.querySelectorAll('.loaded');
        if (remaining.length == 0) {
            showLess.classList.add('hidden');
        }
        if (showMore.classList.contains('hidden')) {
            showMore.classList.remove('hidden');
        }
    });
});

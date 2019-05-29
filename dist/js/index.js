document.addEventListener('DOMContentLoaded', () => {
    const element = document.querySelectorAll('.dealname');
    const elementItems = [].slice.call(element);
    let truncated;
    let i = 0;
    elementItems.forEach((item) => {
        truncated = item.textContent;
        if (truncated.length > 27) {
            truncated = truncated.substr(0, 27);
            truncated += '...';
        }
        elementItems[i].textContent = truncated;
        i += 1;
    });
    
    const maxToShow = 5;
    let showMore = document.querySelector('.showMore');
    let showLess = document.querySelector('.showLess');

    if(showMore) {
        showMore.addEventListener('click', () => {
            const loadThis = document.querySelectorAll('.lazyLoad');
            let j = 0;
            while ((j < maxToShow) && (j < loadThis.length)) {
                loadThis[j].classList.remove('lazyLoad');
                loadThis[j].classList.add('lazyLoaded');
                j += 1;
            }
            let img = document.querySelectorAll('.lazyLoadImg');
            if (img.length > 0) {
                for (let i = 0; i < j; i += 1) {
                    if (img[i].classList.contains('lazyLoadImg')) {
                        img[i].classList.remove('lazyLoadImg');
                        img[i].src = img[i].dataset.src;
                    }
                }
            }
            const remaining = document.querySelectorAll('.lazyLoad');
            if (remaining.length == 0) {
                showMore.classList.add('hidden');
            }
            if (showLess.classList.contains('hidden')) {
                showLess.classList.remove('hidden');
            }
        });
    }

    if(showLess) {
        showLess.addEventListener('click', () => {
            const hideThis = document.querySelectorAll('.lazyLoaded');
            let j = 0;
            while ((j < maxToShow) && (j < hideThis.length)) {
                // TODO: Test if this works correctly (might need to use hideThis.length - j - 1)
                hideThis[j].classList.remove('lazyLoaded');
                hideThis[j].classList.add('lazyLoad');
                j += 1;
            }
            const remaining = document.querySelectorAll('.lazyLoaded');
            if (remaining.length == 0) {
                showLess.classList.add('hidden');
            }
            if (showMore.classList.contains('hidden')) {
                showMore.classList.remove('hidden');
            }
        });
    }
});

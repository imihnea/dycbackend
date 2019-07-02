document.addEventListener('DOMContentLoaded', () => {
    
    const maxToShow = 7;
    let showMore = document.querySelector('.showMore');
    let showLess = document.querySelector('.showLess');
    let lastLoaded = 0;
    
    if(showMore) {
        showMore.addEventListener('click', () => {
            const loadThis = document.querySelectorAll('.lazyLoad');
            let j = 0;
            while ((j < maxToShow) && (j < loadThis.length)) {
                loadThis[j].classList.remove('lazyLoad');
                loadThis[j].classList.add('lazyLoaded');
                j += 1;
            }
            lastLoaded = j;
            let hiddenRows = document.querySelectorAll('.hiddenRow');
            hiddenRows[0].classList.remove('hiddenRow');
            hiddenRows[0].classList.add('hideRow');
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
            if (lastLoaded < maxToShow) {
                for (let i = 0; i < lastLoaded; i += 1) {
                    hideThis[(hideThis.length - lastLoaded + i)].classList.remove('lazyLoaded');
                    hideThis[(hideThis.length - lastLoaded + i)].classList.add('lazyLoad');    
                }
                lastLoaded = maxToShow;
            } else {
                while ((j < maxToShow) && (j < hideThis.length)) {
                    hideThis[(hideThis.length - j - 1)].classList.remove('lazyLoaded');
                    hideThis[(hideThis.length - j - 1)].classList.add('lazyLoad');
                    j += 1;
                }
            }
            let hideRows = document.querySelectorAll('.hideRow');
            hideRows[hideRows.length - 1].classList.remove('hideRow');
            hideRows[hideRows.length - 1].classList.add('hiddenRow');
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

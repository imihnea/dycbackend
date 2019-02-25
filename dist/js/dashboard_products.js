document.addEventListener('DOMContentLoaded', () => {
    const currentLocation = window.location.href;
    const pageNumber = currentLocation.match(/[^=]+$/);
    const link = document.querySelectorAll('.page');
    const linkItems = [].slice.call(link);
    if ( pageNumber.toString() === window.location.href.toString() ) {
        if ( linkItems[0] ) {
            linkItems[0].classList.toggle('active');
            linkItems[linkItems.length/2].classList.toggle('active');
        }
    } else {
        linkItems.forEach((item) => {
            if (item.text == pageNumber) {
                item.classList.toggle('active');
            }
        });
    }
});
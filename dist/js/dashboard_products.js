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
    
    // const images = document.querySelectorAll('.productImage');
    // if (images) {
    //     const imageItems = [].slice.call(images);
    //     imageItems.forEach(img => {
    //       img.dataset.src = img.dataset.src.replace('/image/upload/', '/image/upload/f_auto/w_288,h_288/c_scale,w_auto,dpr_auto/');
    //       img.src = img.dataset.src;
    //     });
    // }

    // const notifImages = document.querySelectorAll('.notifImg');
    // if (notifImages) {
    //     const notifItems = [].slice.call(notifImages);
    //     notifItems.forEach(img => {
    //       img.dataset.src = img.dataset.src.replace('/image/upload/', '/image/upload/f_auto/w_64,h_64/c_scale,w_auto,dpr_auto/');
    //       img.src = img.dataset.src;
    //     });
    // }
});
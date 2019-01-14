document.addEventListener('DOMContentLoaded', () => {
    const currentLocation = window.location.href;
    const pageNumber = currentLocation.match(/[^=]+$/);
    const link = document.querySelectorAll('.page');
    const linkItems = [].slice.call(link);
    linkItems.forEach((item) => {
        if (item.text == pageNumber) {
            item.classList.toggle('active');
        }
    });
});
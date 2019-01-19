document.addEventListener('DOMContentLoaded', () => {
    const reportOpenButton = document.querySelector('.report');
    const reportCloseButton = document.querySelector('.deleteReport');
    const reportCancelButton = document.querySelector('.cancelReport');
    const reportModal = document.querySelector('.modalReport');
    reportOpenButton.addEventListener('click', (event) => {
        event.stopPropagation();
        reportModal.classList.toggle('is-active');
      });
    reportCloseButton.addEventListener('click', (event) => {
        event.stopPropagation();
        reportModal.classList.toggle('is-active');
      });
    reportCancelButton.addEventListener('click', (event) => {
        event.stopPropagation();
        reportModalItems[i].classList.toggle('is-active');
      });
});
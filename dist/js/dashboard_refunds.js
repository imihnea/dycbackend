document.addEventListener('DOMContentLoaded', () => {
    const refundDetailsOpenButtons = document.querySelectorAll('.refundDetails');
    const refundDetailsCloseButtons = document.querySelectorAll('.deleterefundDetails');
    const refundDetailsModals = document.querySelectorAll('.modalrefundDetails');
    const refundDetailsOpenButtonItems = [].slice.call(refundDetailsOpenButtons);
    const refundDetailsCloseButtonItems = [].slice.call(refundDetailsCloseButtons);
    const refundDetailsModalItems = [].slice.call(refundDetailsModals);
    refundDetailsOpenButtonItems.forEach((item, i) => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        refundDetailsModalItems[i].classList.toggle('is-active');
      });
    });
    refundDetailsCloseButtonItems.forEach((item, i) => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        refundDetailsModalItems[i].classList.toggle('is-active');
      });
    });
});

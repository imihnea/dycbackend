document.addEventListener('DOMContentLoaded', () => {
  const refundRequestOpenButton = document.querySelectorAll('.refundRequest');
  const refundRequestOpenButtonItems = [].slice.call(refundRequestOpenButton);
  const refundRequestCloseButton = document.querySelectorAll('.deleteRefundRequest');
  const refundRequestCloseButtonItems = [].slice.call(refundRequestCloseButton);
  const refundRequestModal = document.querySelectorAll('.modalRefundRequest');
  const refundRequestModalItems = [].slice.call(refundRequestModal);
  refundRequestOpenButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      refundRequestModalItems[i].classList.toggle('is-active');
    });
  });
  refundRequestCloseButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      refundRequestModalItems[i].classList.toggle('is-active');
    });
  });

  const refundOpenButton = document.querySelector('.refundDetails');
  const refundCloseButton = document.querySelector('.deleteRefundDetails');
  const refundModal = document.querySelector('.modalRefundDetails');
    refundOpenButton.addEventListener('click', (event) => {
      event.stopPropagation();
      refundModal.classList.toggle('is-active');
    });
    refundCloseButton.addEventListener('click', (event) => {
      event.stopPropagation();
      refundModal.classList.toggle('is-active');
    });
});
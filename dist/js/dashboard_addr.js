document.addEventListener('DOMContentLoaded', () => {
  const openButtons = document.querySelectorAll('.topup');
  const closeButtons = document.querySelectorAll('.delete');
  const modals = document.querySelectorAll('.modal');
  const openButtonItems = [].slice.call(openButtons);
  const closeButtonItems = [].slice.call(closeButtons);
  const modalItems = [].slice.call(modals);
  openButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      modalItems[i].classList.toggle('is-active');
    });
  });
  closeButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      modalItems[i].classList.toggle('is-active');
    });
  });
});

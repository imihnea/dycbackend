document.addEventListener('DOMContentLoaded', () => {
  // Top-up
  const topupOpenButtons = document.querySelectorAll('.topup');
  const topupCloseButtons = document.querySelectorAll('.deleteTopup');
  const topupCancelButtons = document.querySelectorAll('.cancelTopup');
  const topupModals = document.querySelectorAll('.modalTopup');
  const topupOpenButtonItems = [].slice.call(topupOpenButtons);
  const topupCloseButtonItems = [].slice.call(topupCloseButtons);
  const topupCancelButtonItems = [].slice.call(topupCancelButtons);
  const topupModalItems = [].slice.call(topupModals);
  topupOpenButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      topupModalItems[i].classList.toggle('is-active');
    });
  });
  topupCloseButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      topupModalItems[i].classList.toggle('is-active');
    });
  });
  topupCancelButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      topupModalItems[i].classList.toggle('is-active');
    });
  });

  // Withdraw
  const withdrawOpenButtons = document.querySelectorAll('.withdraw');
  const withdrawCloseButtons = document.querySelectorAll('.deleteWithdraw');
  const withdrawCancelButtons = document.querySelectorAll('.cancelWithdraw');
  const withdrawModals = document.querySelectorAll('.modalWithdraw');
  const withdrawOpenButtonItems = [].slice.call(withdrawOpenButtons);
  const withdrawCloseButtonItems = [].slice.call(withdrawCloseButtons);
  const withdrawCancelButtonItems = [].slice.call(withdrawCancelButtons);
  const withdrawModalItems = [].slice.call(withdrawModals);
  withdrawOpenButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      withdrawModalItems[i].classList.toggle('is-active');
    });
  });
  withdrawCloseButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      withdrawModalItems[i].classList.toggle('is-active');
    });
  });
  withdrawCancelButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      withdrawModalItems[i].classList.toggle('is-active');
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {

    const acceptOpenButtons = document.querySelectorAll('.accept');
    const acceptCloseButtons = document.querySelectorAll('.deleteAccept');
    const acceptCancelButtons = document.querySelectorAll('.cancelAccept');
    const acceptModals = document.querySelectorAll('.modalAccept');
    const acceptOpenButtonItems = [].slice.call(acceptOpenButtons);
    const acceptCloseButtonItems = [].slice.call(acceptCloseButtons);
    const acceptCancelButtonItems = [].slice.call(acceptCancelButtons);
    const acceptModalItems = [].slice.call(acceptModals);
    acceptOpenButtonItems.forEach((item, i) => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        acceptModalItems[i].classList.toggle('is-active');
      });
    });
    acceptCloseButtonItems.forEach((item, i) => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        acceptModalItems[i].classList.toggle('is-active');
      });
    });
    acceptCancelButtonItems.forEach((item, i) => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        acceptModalItems[i].classList.toggle('is-active');
      });
    });

    const reportOpenButtons = document.querySelectorAll('.report');
    const reportCloseButtons = document.querySelectorAll('.deleteReport');
    const reportCancelButtons = document.querySelectorAll('.cancelReport');
    const reportModals = document.querySelectorAll('.modalReport');
    const reportOpenButtonItems = [].slice.call(reportOpenButtons);
    const reportCloseButtonItems = [].slice.call(reportCloseButtons);
    const reportCancelButtonItems = [].slice.call(reportCancelButtons);
    const reportModalItems = [].slice.call(reportModals);
    reportOpenButtonItems.forEach((item, i) => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        reportModalItems[i].classList.toggle('is-active');
      });
    });
    reportCloseButtonItems.forEach((item, i) => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        reportModalItems[i].classList.toggle('is-active');
      });
    });
    reportCancelButtonItems.forEach((item, i) => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        reportModalItems[i].classList.toggle('is-active');
      });
    });

    const refundRequestOpenButtons = document.querySelectorAll('.refundRequest');
    const refundRequestCloseButtons = document.querySelectorAll('.deleterefundRequest');
    const refundRequestCancelButtons = document.querySelectorAll('.cancelrefundRequest');
    const refundRequestModals = document.querySelectorAll('.modalrefundRequest');
    const refundRequestOpenButtonItems = [].slice.call(refundRequestOpenButtons);
    const refundRequestCloseButtonItems = [].slice.call(refundRequestCloseButtons);
    const refundRequestCancelButtonItems = [].slice.call(refundRequestCancelButtons);
    const refundRequestModalItems = [].slice.call(refundRequestModals);
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
    refundRequestCancelButtonItems.forEach((item, i) => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        refundRequestModalItems[i].classList.toggle('is-active');
      });
    });

});

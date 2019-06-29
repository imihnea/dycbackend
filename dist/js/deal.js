const unescapeHTML = (safe) => {
  return safe
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&commat;/g, "@")
        .replace(/&Hat;/g, "^")
        .replace(/&colon;/g, ":")
        .replace(/&semi;/g, ";")
        .replace(/&num;/g, "#")
        .replace(/&dollar;/g, "$")
        .replace(/&percent;/g, "%")
        .replace(/&ast;/g, "*")
        .replace(/&lpar;/g, "(")
        .replace(/&rpar;/g, ")")
        .replace(/&UnderBar;/g, "_")
        .replace(/&equals;/g, "=")
        .replace(/&plus;/g, "+")
        .replace(/&grave;/g, "`")
        .replace(/&sol;/g, "/")
        .replace(/&bsol;/g, "\\")
        .replace(/&vert;/g, "|")
        .replace(/&lsqb;/g, "[")
        .replace(/&rsqb;/g, "]")
        .replace(/&lcub;/g, "{")
        .replace(/&rcub;/g, "}")
        .replace(/&#039;/g, "'");
}

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

    const proofOpenButton = document.querySelector('.checkProof');
    const proofCloseButton = document.querySelector('.deleteCheckProof');
    const proofModal = document.querySelector('.modalCheckProof');
    if (proofOpenButton) {
      proofOpenButton.addEventListener('click', (event) => {
          event.stopPropagation();
          proofModal.classList.toggle('is-active');
      });
      proofCloseButton.addEventListener('click', (event) => {
          event.stopPropagation();
          proofModal.classList.toggle('is-active');
      });
    }

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

    const message = document.querySelectorAll('.messageSpan');
    const messageItems = [].slice.call(message);
    messageItems.forEach((msg) => {
      msg.innerHTML = unescapeHTML(msg.innerHTML);
    });

});

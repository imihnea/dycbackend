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

    const messages = document.querySelectorAll('.messageSpan');
    messages.forEach(msg => {
      const newText = unescapeHTML(msg.innerText);
      msg.innerHTML = newText;
    });
});
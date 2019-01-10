document.addEventListener('DOMContentLoaded', () => {
  const inputs = document.querySelectorAll('.file-upload__input');
  const inputItems = [].slice.call(inputs);
  const squares = document.querySelectorAll('.square');
  const squareItems = [].slice.call(squares);
  const checks = document.querySelectorAll('.fa-check-square');
  const checkItems = [].slice.call(checks);
  inputItems.forEach((item, i) => {
    item.addEventListener('change', () => {
      squareItems[i].classList.toggle('hide');
      checkItems[i].classList.toggle('hide');
    });
  });
});
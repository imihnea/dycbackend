document.addEventListener('DOMContentLoaded', () => {
  const inputs = document.querySelectorAll('.file-upload__input');
  const inputItems = [].slice.call(inputs);
  const squares = document.querySelectorAll('.square');
  const squareItems = [].slice.call(squares);
  const checks = document.querySelectorAll('.fa-check-square');
  const checkItems = [].slice.call(checks);
  const delLabels = document.querySelectorAll('.file-delete__label');
  const delLabelItems = [].slice.call(delLabels);
  const labels = document.getElementsByName('u');

  inputItems.forEach((item, i) => {
    item.addEventListener('change', () => {
      if (item.value === '') {
        squareItems[i].classList.remove('hide');
        checkItems[i].classList.add('hide');
        labels[i].classList.add('file-upload__label');
        labels[i].classList.remove('file-upload__label-green');
        delLabelItems[i].classList.add('hide');  
      } else {
        squareItems[i].classList.add('hide');
        checkItems[i].classList.remove('hide');
        labels[i].classList.remove('file-upload__label');
        labels[i].classList.add('file-upload__label-green');
        delLabelItems[i].classList.remove('hide');
      }
    });
  });

  delLabelItems.forEach((item, i) => {
    item.addEventListener('click', () => {
      inputItems[i].value = '';
      item.classList.toggle('hide');
      squareItems[i].classList.toggle('hide');
      labels[i].classList.toggle('file-upload__label');
      labels[i].classList.toggle('file-upload__label-green');
    });
  });

});
  
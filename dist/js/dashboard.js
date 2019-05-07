document.addEventListener('DOMContentLoaded', () => {
  const inputs = document.querySelectorAll('.file-upload__input');
  const inputItems = [].slice.call(inputs);
  const labels = document.querySelectorAll('.file-upload__label');
  const labelItems = [].slice.call(labels);
  const squares = document.querySelectorAll('.square');
  const squareItems = [].slice.call(squares);
  const checks = document.querySelectorAll('.fa-check-square');
  const checkItems = [].slice.call(checks);
  const delLabels = document.querySelectorAll('.file-delete__label');
  const delLabelItems = [].slice.call(delLabels);
  
  inputItems.forEach((item, i) => {
    item.addEventListener('change', () => {
      if (item.value === '') {
        squareItems[i].classList.remove('hide');
        checkItems[i].classList.add('hide');
        labelItems[i].classList.add('file-upload__label');
        labelItems[i].classList.remove('file-upload__label-green');
        delLabelItems[i].classList.add('hide');  
      } else {
        squareItems[i].classList.add('hide');
        checkItems[i].classList.remove('hide');
        labelItems[i].classList.remove('file-upload__label');
        labelItems[i].classList.add('file-upload__label-green');
        delLabelItems[i].classList.remove('hide');
      }
    });
  });

  delLabelItems.forEach((item, i) => {
    item.addEventListener('click', () => {
      inputItems[i].value = '';
      item.classList.toggle('hide');
      squareItems[i].classList.toggle('hide');
      checkItems[i].classList.toggle('hide');
      labelItems[i].classList.toggle('file-upload__label');
      labelItems[i].classList.toggle('file-upload__label-green');
      inputItems[i].disabled = false;
    });
  });

  
  // Cancel Subscription Modal
  const cancelOpenButton = document.querySelector('.cancelSub');
  const cancelCloseButton = document.querySelector('.deleteCancelSub');
  const cancelModal = document.querySelector('.modalCancelSub');
  cancelOpenButton.addEventListener('click', (event) => {
    // event.stopPropagation();
      cancelModal.classList.toggle('is-active');
    });
    cancelCloseButton.addEventListener('click', (event) => {
      // event.stopPropagation();
      cancelModal.classList.toggle('is-active');
    });

    // Deactivate Modal - leave this one last, it bugs out the others if
    // the user doesn't have 2 factor enabled
    const deactivateOpenButton = document.querySelector('.deactivate');
    const deactivateCloseButton = document.querySelector('.deleteDeactivate');
    const deactivateModal = document.querySelector('.modalDeactivate');
    deactivateOpenButton.addEventListener('click', (event) => {
        event.stopPropagation();
        deactivateModal.classList.toggle('is-active');
    });
    deactivateCloseButton.addEventListener('click', (event) => {
        event.stopPropagation();
        deactivateModal.classList.toggle('is-active');
    });
    deactivateCancelButton.addEventListener('click', (event) => {
        event.stopPropagation();
        deactivateModal.classList.toggle('is-active');
    });
});

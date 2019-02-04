document.addEventListener('DOMContentLoaded', () => {
  const thumbnails = document.querySelectorAll('.thumbnail');
  const thumbnailItems = [].slice.call(thumbnails);
  const main = document.querySelectorAll('.mainImg');
  const mainItems = [].slice.call(main);
  const heightImgs = document.querySelectorAll('.mImg');
  const heightItems = [].slice.call(heightImgs);
  thumbnailItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      for (let j = 0; j < mainItems.length; j += 1) {
        if (!mainItems[j].classList.contains('hiddenImg')) {
          mainItems[j].classList.add('hiddenImg');
          heightItems[j].classList.add('noDisp');
        }
      }
      mainItems[i].classList.remove('hiddenImg');
      heightItems[i].classList.remove('noDisp');
    });
  });

  const editOpenButtons = document.querySelectorAll('.edit');
  const editCloseButtons = document.querySelectorAll('.deleteEdit');
  const editModals = document.querySelectorAll('.modalEdit');
  const editOpenButtonItems = [].slice.call(editOpenButtons);
  const editCloseButtonItems = [].slice.call(editCloseButtons);
  const editModalItems = [].slice.call(editModals);
  editOpenButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      editModalItems[i].classList.toggle('is-active');
    });
  });
  editCloseButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      editModalItems[i].classList.toggle('is-active');
    });
  });

  const deleteOpenButtons = document.querySelectorAll('.del');
  const deleteCloseButtons = document.querySelectorAll('.deleteDelete');
  const deleteModals = document.querySelectorAll('.modalDelete');
  const deleteOpenButtonItems = [].slice.call(deleteOpenButtons);
  const deleteCloseButtonItems = [].slice.call(deleteCloseButtons);
  const deleteModalItems = [].slice.call(deleteModals);
  deleteOpenButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteModalItems[i].classList.toggle('is-active');
    });
  });
  deleteCloseButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteModalItems[i].classList.toggle('is-active');
    });
  });
});

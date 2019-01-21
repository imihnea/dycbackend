document.addEventListener('DOMContentLoaded', () => {
  const thumbnails = document.querySelectorAll('.thumbnail');
  const thumbnailItems = [].slice.call(thumbnails);
  const main = document.querySelectorAll('.mainImg');
  const mainItems = [].slice.call(main);
  thumbnailItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      for (let j = 0; j < mainItems.length; j += 1) {
        if (!mainItems[j].classList.contains('hiddenImg')) {
          mainItems[j].classList.add('hiddenImg');
        }
      }
      mainItems[i].classList.remove('hiddenImg');
    });
  });

  const editOpenButtons = document.querySelectorAll('.edit');
  const editCloseButtons = document.querySelectorAll('.deleteEdit');
  const editCancelButtons = document.querySelectorAll('.cancelEdit');
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
  const deleteCancelButtons = document.querySelectorAll('.cancelDelete');
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

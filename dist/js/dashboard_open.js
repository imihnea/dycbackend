document.addEventListener('DOMContentLoaded', () => {
    const element = document.querySelectorAll('.dealname');
    const elementItems = [].slice.call(element);
    let truncated;
    let i = 0;
    elementItems.forEach((item) => {
        truncated = item.textContent;
        if (truncated.length > 200) {
            truncated = truncated.substr(0, 200);
            truncated += '...';
        }
        elementItems[i].textContent = truncated;
        i += 1;
    });
    
  // Delete
  const deleteOpenButtons = document.querySelectorAll('.deleteModal');
  const deleteCloseButtons = document.querySelectorAll('.deleteDelete');
  const deleteCancelButtons = document.querySelectorAll('.cancelDelete');
  const deleteModals = document.querySelectorAll('.modalDelete');
  const deleteOpenButtonItems = [].slice.call(deleteOpenButtons);
  const deleteCloseButtonItems = [].slice.call(deleteCloseButtons);
  const deleteCancelButtonItems = [].slice.call(deleteCancelButtons);
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
  deleteCancelButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteModalItems[i].classList.toggle('is-active');
    });
  });

  // Modify images
  const imageOpenButtons = document.querySelectorAll('.imageModal');
  const imageCloseButtons = document.querySelectorAll('.imageDelete');
  const imageModals = document.querySelectorAll('.modalImage');
  const imageOpenButtonItems = [].slice.call(imageOpenButtons);
  const imageCloseButtonItems = [].slice.call(imageCloseButtons);
  const imageModalItems = [].slice.call(imageModals);  
  const maxToShow = 5;
  imageOpenButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      // Load images when the modal opens
      const loadThis = document.querySelectorAll('.noLoad');
      let j = 0;
      while ((j < maxToShow) && (j < loadThis.length)) {
          loadThis[j].classList.remove('noLoad');
          loadThis[j].classList.remove('hidden');
          loadThis[j].classList.add('loaded');
          j += 1;
      }
      lastLoaded = j;
      let img = document.querySelectorAll('.noImg');
      if (img.length > 0) {
          for (let i = 0; i < j; i += 1) {
              if (img[i].classList.contains('noImg')) {
                  img[i].src = img[i].dataset.src;
                  img[i].classList.remove('noImg');
              }
          }
      }
      imageModalItems[i].classList.toggle('is-active');
    });
  });
  imageCloseButtonItems.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      imageModalItems[i].classList.toggle('is-active');
    });
  });
});

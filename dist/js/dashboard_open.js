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
});

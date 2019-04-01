document.addEventListener('DOMContentLoaded', () => {
    // Edit
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
    
    // Delete
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

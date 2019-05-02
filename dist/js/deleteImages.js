document.addEventListener('DOMContentLoaded', () => {
    const currentImages = document.getElementById('currentImages');
    const images = JSON.parse(currentImages.innerText);
    currentImages.remove();
    const delLabels = document.querySelectorAll('.file-delete__label');
    const delLabelItems = [].slice.call(delLabels);
    let deleteImages = document.getElementById('deleteImages');
    delLabelItems.forEach((item, i) => {
        item.addEventListener('click', () => {
            deleteImages.value += images[i].public_id + ' ';
            images[i].public_id = '';
        });
    });
});

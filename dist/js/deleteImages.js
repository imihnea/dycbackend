document.addEventListener('DOMContentLoaded', () => {
    const currentImages = document.getElementById('currentImages');
    const images = JSON.parse(currentImages.innerText);
    currentImages.remove();
    const delLabels = document.querySelectorAll('.file-delete__label');
    const delLabelItems = [].slice.call(delLabels);
    let deleteImages = document.getElementById('deleteImages');
    delLabelItems.forEach((item, i) => {
        item.addEventListener('click', () => {
            if (images[i]) {
                deleteImages.value += images[i].public_id + ' ';
                images[i].public_id = '';
            }
        });
    });

    const imageInput = document.querySelectorAll('.file-upload__input');
    const imageInputItems = [].slice.call(imageInput);
    const upImg = document.getElementById('uploadImages');
    imageInputItems.forEach(item => {
        item.addEventListener('change', () => {
            if (item.value) {
                upImg.value = Number(upImg.value) + 1;
            }
        });
    });
});

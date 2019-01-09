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
});

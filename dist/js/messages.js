document.addEventListener('DOMContentLoaded', () => {
    const element = document.querySelectorAll('.dealname');
    const elementItems = [].slice.call(element);
    let truncated;
    let i = 0;
    elementItems.forEach((item) => {
        truncated = item.textContent;
        if (truncated.length > 27) {
            truncated = truncated.substr(0, 27);
            truncated += '...';
        }
        elementItems[i].textContent = truncated;
        i += 1;
    });

    const images = document.querySelectorAll('.chatImg');
    const imageItems = [].slice.call(images);
    imageItems.forEach(img => {
      img.dataset.src = img.dataset.src.replace('/image/upload/', '/image/upload/f_auto/w_288,h_288/c_scale,w_auto,dpr_auto/');
      img.src = img.dataset.src;
    });
});

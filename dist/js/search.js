document.addEventListener('DOMContentLoaded', () => {
  const burgers = Array.prototype.slice.call(document.getElementsByClassName('.navbar-burger .filtersBurger'), 0);
  if (burgers.length > 0) {
    burgers.forEach((el) => {
      el.addEventListener('click', () => {
        const target = el.dataset.target;
        const $target = document.getElementById(target);
        el.classList.toggle('is-active');
        $target.classList.toggle('is-active');
      });
    });
  }

  const images = document.querySelectorAll('.productImage');
  const imageItems = [].slice.call(images);
  imageItems.forEach(img => {
    img.dataset.src = img.dataset.src.replace('/image/upload/', '/image/upload/f_auto/w_288,h_288/c_scale,w_auto,dpr_auto/');
    img.src = img.dataset.src;
  });
});

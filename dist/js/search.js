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
});

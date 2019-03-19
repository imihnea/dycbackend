document.addEventListener('DOMContentLoaded', () => {
  const currency = document.querySelectorAll('.cccy');
  const currencies = [].slice.call(currency);
  const buyButtons = document.querySelectorAll('.currency-input');
  const buyButtonItems = [].slice.call(buyButtons);
  currencies.forEach((item, i) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      item.classList.remove('gray');
      buyButtonItems[i].classList.remove('currency-input');
      for (let j = 0; j < currencies.length; j += 1) {
        if ((item !== currencies[j]) && (!currencies[j].classList.contains('gray'))) {
          currencies[j].classList.add('gray');
          buyButtonItems[j].classList.add('currency-input');
        }
      }
    });
  });
});

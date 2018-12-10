document.addEventListener('DOMContentLoaded', () => {
  const currency = document.querySelectorAll('.cccy');
  const currencies = [].slice.call(currency);
  currencies.forEach((item) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      item.classList.toggle('gray');
      for (let j = 0; j < currencies.length; j += 1) {
        if ((item !== currencies[j]) && (!currencies[j].classList.contains('gray'))) {
          currencies[j].classList.add('gray');
        }
      }
    });
  });

  const newCurrency = document.querySelectorAll('.new_cccy');
  const newCurrencies = [].slice.call(newCurrency);
  newCurrencies.forEach((item) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      item.classList.toggle('gray');
    });
  });
});

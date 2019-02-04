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

  const prices = document.querySelectorAll('.prices');
  const priceItems = [].slice.call(prices);
  priceItems.forEach((item) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      item.classList.add('pricesChecked');
      if (document.getElementById('buyBtn').disabled) {
        document.getElementById('buyBtn').disabled = false;
        document.getElementById('currencyWarn').classList.add('currency-input');
      }
      for (let j = 0; j < priceItems.length; j += 1) {
        if ((item !== priceItems[j]) && (priceItems[j].classList.contains('pricesChecked'))) {
          priceItems[j].classList.remove('pricesChecked');
        }
      }
    })
  })
});

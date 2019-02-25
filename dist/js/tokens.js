document.addEventListener('DOMContentLoaded', () => {
  const currency = document.querySelectorAll('.token-currency');
  const currencies = [].slice.call(currency);
  const field = document.querySelectorAll('.fields');
  const fields = [].slice.call(field);
  const input = document.querySelectorAll('.inputTokens');
  const inputs = [].slice.call(input);
  currencies.forEach((item) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      item.classList.toggle('gray');
      for (let j = 0; j < currencies.length; j += 1) {
        if ((item !== currencies[j]) && (!currencies[j].classList.contains('gray'))) {
          currencies[j].classList.add('gray');
          fields[j].classList.add('currency-input');
          inputs[j].required = false;
          inputs[j].value = '';
        }
        if (item === currencies[j]) {
          fields[j].classList.toggle('currency-input');
          inputs[j].required = true;
        }
      }
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btc-check').addEventListener('click', (event) => {
    event.stopPropagation();
    if (document.querySelector('#btc-price').classList.contains('currency-input')) {
      document.querySelector('#btc-price').required = true;
    } else {
      document.querySelector('#btc-price').required = false;
    }
    document.querySelector('#btc-price').classList.toggle('currency-input');
  });
  document.getElementById('bch-check').addEventListener('click', (event) => {
    event.stopPropagation();
    if (document.querySelector('#bch-price').classList.contains('currency-input')) {
      document.querySelector('#bch-price').required = true;
    } else {
      document.querySelector('#bch-price').required = false;
    }
    document.querySelector('#bch-price').classList.toggle('currency-input');
  });
  document.getElementById('eth-check').addEventListener('click', (event) => {
    event.stopPropagation();
    if (document.querySelector('#eth-price').classList.contains('currency-input')) {
      document.querySelector('#eth-price').required = true;
    } else {
      document.querySelector('#eth-price').required = false;
    }
    document.querySelector('#eth-price').classList.toggle('currency-input');
  });
  document.getElementById('ltc-check').addEventListener('click', (event) => {
    event.stopPropagation();
    if (document.querySelector('#ltc-price').classList.contains('currency-input')) {
      document.querySelector('#ltc-price').required = true;
    } else {
      document.querySelector('#ltc-price').required = false;
    }
    document.querySelector('#ltc-price').classList.toggle('currency-input');
  });
  document.getElementById('dash-check').addEventListener('click', (event) => {
    event.stopPropagation();
    if (document.querySelector('#dash-price').classList.contains('currency-input')) {
      document.querySelector('#dash-price').required = true;
    } else {
      document.querySelector('#dash-price').required = false;
    }
    document.querySelector('#dash-price').classList.toggle('currency-input');
  });

  const newCurrency = document.querySelectorAll('.new_cccy');
  const newCurrencies = [].slice.call(newCurrency);
  newCurrencies.forEach((item) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      item.classList.toggle('gray');
    });
  });

  const inputs = document.querySelectorAll('.file-upload__input');
  const inputItems = [].slice.call(inputs);
  const squares = document.querySelectorAll('.square');
  const squareItems = [].slice.call(squares);
  const checks = document.querySelectorAll('.fa-check-square');
  const checkItems = [].slice.call(checks);
  inputItems.forEach((item, i) => {
    item.addEventListener('change', () => {
      squareItems[i].classList.toggle('hide');
      checkItems[i].classList.toggle('hide');
    });
  });
});

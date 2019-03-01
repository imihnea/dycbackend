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
  const delLabels = document.querySelectorAll('.file-delete__label');
  const delLabelItems = [].slice.call(delLabels);
  const labels = document.getElementsByName('u');

  inputItems.forEach((item, i) => {
    item.addEventListener('change', () => {
      if (item.value === '') {
        squareItems[i].classList.remove('hide');
        checkItems[i].classList.add('hide');
        labels[i].classList.add('file-upload__label');
        labels[i].classList.remove('file-upload__label-green');
        delLabelItems[i].classList.add('hide');  
      } else {
        squareItems[i].classList.add('hide');
        checkItems[i].classList.remove('hide');
        labels[i].classList.remove('file-upload__label');
        labels[i].classList.add('file-upload__label-green');
        delLabelItems[i].classList.remove('hide');
      }
    });
  });

  delLabelItems.forEach((item, i) => {
    item.addEventListener('click', () => {
      inputItems[i].value = '';
      item.classList.toggle('hide');
      squareItems[i].classList.toggle('hide');
      labels[i].classList.toggle('file-upload__label');
      labels[i].classList.toggle('file-upload__label-green');
    });
  });

  
  let city = document.getElementById('city');
  if (city.checked) {
    document.getElementById('cityDeliv').classList.remove('hide');
  }
  let state = document.getElementById('state');
  if (state.checked) {
    document.getElementById('stateDeliv').classList.remove('hide');
  }
  let country = document.getElementById('country');
  if (country.checked) {
    document.getElementById('countryDeliv').classList.remove('hide');
  }
  let worldwide = document.getElementById('worldwide');
  if (worldwide.checked) {
    document.getElementById('worldwideDeliv').classList.remove('hide');
  } 
  let transport = document.getElementById('transport');
  if ((city.checked) || (state.checked) || (country.checked) || (worldwide.checked)) {
    transport.classList.remove('hide');
  }

});
  
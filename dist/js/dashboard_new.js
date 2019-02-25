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

  document.getElementById('city').addEventListener('click', (event) => {
    event.stopPropagation();
    document.querySelector('#cityDiv').classList.toggle('optionsUnchecked');
    document.querySelector('#cityDiv').classList.toggle('optionsChecked');
    document.querySelector('#cityDeliv').classList.toggle('hide');
    if (document.querySelector('#freeCity').required == true) {
      document.querySelector('#freeCity').required = false;
    } else {
      document.querySelector('#freeCity').required = true;
    }
  });
  document.getElementById('state').addEventListener('click', (event) => {
    event.stopPropagation();
    document.querySelector('#stateDiv').classList.toggle('optionsUnchecked');
    document.querySelector('#stateDiv').classList.toggle('optionsChecked');
    document.querySelector('#stateDeliv').classList.toggle('hide');
    if (document.querySelector('#freeState').required == true) {
      document.querySelector('#freeState').required = false;
    } else {
      document.querySelector('#freeState').required = true;
    }
  });
  document.getElementById('country').addEventListener('click', (event) => {
    event.stopPropagation();
    document.querySelector('#countryDiv').classList.toggle('optionsUnchecked');
    document.querySelector('#countryDiv').classList.toggle('optionsChecked');
    document.querySelector('#countryDeliv').classList.toggle('hide');
    if (document.querySelector('#freeCountry').required == true) {
      document.querySelector('#freeCountry').required = false;
    } else {
      document.querySelector('#freeCountry').required = true;
    }
  });
  document.getElementById('worldwide').addEventListener('click', (event) => {
    event.stopPropagation();
    document.querySelector('#worldwideDiv').classList.toggle('optionsUnchecked');
    document.querySelector('#worldwideDiv').classList.toggle('optionsChecked');
    document.querySelector('#worldwideDeliv').classList.toggle('hide');
    if (document.querySelector('#freeWorldwide').required == true) {
      document.querySelector('#freeWorldwide').required = false;
    } else {
      document.querySelector('#freeWorldwide').required = true;
    }
  });

  document.getElementsByName('product[cityTransport]').forEach((item) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      if (item.value == 'paid') {
        document.getElementById('cityTransportDiv').classList.remove('hide');
        document.getElementById('paidCityOpt').classList.remove('optionsUnchecked');
        document.getElementById('paidCityOpt').classList.add('optionsChecked');
        document.getElementById('freeCityOpt').classList.add('optionsUnchecked');
        document.getElementById('freeCityOpt').classList.remove('optionsChecked');
      } else {
        document.getElementById('cityTransportDiv').classList.add('hide');
        document.getElementById('freeCityOpt').classList.remove('optionsUnchecked');
        document.getElementById('freeCityOpt').classList.add('optionsChecked');
        document.getElementById('paidCityOpt').classList.add('optionsUnchecked');
        document.getElementById('paidCityOpt').classList.remove('optionsChecked');
      }
    });
  });
  document.getElementsByName('product[stateTransport]').forEach((item) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      if (item.value == 'paid') {
        document.getElementById('stateTransportDiv').classList.remove('hide');
        document.getElementById('paidStateOpt').classList.remove('optionsUnchecked');
        document.getElementById('paidStateOpt').classList.add('optionsChecked');
        document.getElementById('freeStateOpt').classList.add('optionsUnchecked');
        document.getElementById('freeStateOpt').classList.remove('optionsChecked');
      } else {
        document.getElementById('stateTransportDiv').classList.add('hide');
        document.getElementById('freeStateOpt').classList.remove('optionsUnchecked');
        document.getElementById('freeStateOpt').classList.add('optionsChecked');
        document.getElementById('paidStateOpt').classList.add('optionsUnchecked');
        document.getElementById('paidStateOpt').classList.remove('optionsChecked');
      }
    });
  });
  document.getElementsByName('product[countryTransport]').forEach((item) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      if (item.value == 'paid') {
        document.getElementById('countryTransportDiv').classList.remove('hide');
        document.getElementById('paidCountryOpt').classList.remove('optionsUnchecked');
        document.getElementById('paidCountryOpt').classList.add('optionsChecked');
        document.getElementById('freeCountryOpt').classList.add('optionsUnchecked');
        document.getElementById('freeCountryOpt').classList.remove('optionsChecked');
      } else {
        document.getElementById('countryTransportDiv').classList.add('hide');
        document.getElementById('freeCountryOpt').classList.remove('optionsUnchecked');
        document.getElementById('freeCountryOpt').classList.add('optionsChecked');
        document.getElementById('paidCountryOpt').classList.add('optionsUnchecked');
        document.getElementById('paidCountryOpt').classList.remove('optionsChecked');
      }
    });
  });
  document.getElementsByName('product[worldwideTransport]').forEach((item) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      if (item.value == 'paid') {
        document.getElementById('worldwideTransportDiv').classList.remove('hide');
        document.getElementById('paidWorldwideOpt').classList.remove('optionsUnchecked');
        document.getElementById('paidWorldwideOpt').classList.add('optionsChecked');
        document.getElementById('freeWorldwideOpt').classList.add('optionsUnchecked');
        document.getElementById('freeWorldwideOpt').classList.remove('optionsChecked');
      } else {
        document.getElementById('worldwideTransportDiv').classList.add('hide');
        document.getElementById('freeWorldwideOpt').classList.remove('optionsUnchecked');
        document.getElementById('freeWorldwideOpt').classList.add('optionsChecked');
        document.getElementById('paidWorldwideOpt').classList.add('optionsUnchecked');
        document.getElementById('paidWorldwideOpt').classList.remove('optionsChecked');
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

  const inputs = document.querySelectorAll('.file-upload__input');
  const inputItems = [].slice.call(inputs);
  const labels = document.querySelectorAll('.file-upload__label');
  const labelItems = [].slice.call(labels);
  const squares = document.querySelectorAll('.square');
  const squareItems = [].slice.call(squares);
  const checks = document.querySelectorAll('.fa-check-square');
  const checkItems = [].slice.call(checks);
  const delLabels = document.querySelectorAll('.file-delete__label');
  const delLabelItems = [].slice.call(delLabels);

  inputItems.forEach((item, i) => {
    item.addEventListener('change', () => {
      if (item.value === '') {
        squareItems[i].classList.remove('hide');
        checkItems[i].classList.add('hide');
        labelItems[i].classList.add('file-upload__label');
        labelItems[i].classList.remove('file-upload__label-green');
        delLabelItems[i].classList.add('hide');  
      } else {
        squareItems[i].classList.add('hide');
        checkItems[i].classList.remove('hide');
        labelItems[i].classList.remove('file-upload__label');
        labelItems[i].classList.add('file-upload__label-green');
        delLabelItems[i].classList.remove('hide');
      }
    });
  });

  delLabelItems.forEach((item, i) => {
    item.addEventListener('click', () => {
      inputItems[i].value = '';
      item.classList.toggle('hide');
      squareItems[i].classList.toggle('hide');
      checkItems[i].classList.toggle('hide');
      labelItems[i].classList.toggle('file-upload__label');
      labelItems[i].classList.toggle('file-upload__label-green');
      inputItems[i].disabled = false;
    });
  });
});

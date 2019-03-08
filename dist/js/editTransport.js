document.addEventListener('DOMContentLoaded', () => {
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
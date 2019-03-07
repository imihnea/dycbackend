function populateSelect(target, min, max, data){
    if (!target){
        return false;
    }
    else {
        var min = min || 0,
            max = max || min + 100;

        select = document.getElementById(target);

        for (var i = min; i<=max; i++){
            var opt = document.createElement('option');
            opt.value = data[i].depositCoin;
            opt.innerHTML = `${data[i].depositCoin.toUpperCase()}`;
            select.appendChild(opt);
        }
    }
}

const button = document.getElementById('myButton');
button.addEventListener('click', function(e) {
  console.log('button was clicked');
  fetch('/dashboard/addresses/altcoins/pair', {method: 'GET'})
  .then(function(response) {
    if(response.ok) {
      console.log('Click was recorded');
      return response.json();
    }
    throw new Error('Request failed.');
  })
  .then(function(data) {
    populateSelect('counter', '0', data.length-1, data)
  })
  .catch(function(error) {
    console.log(error);
  });
});
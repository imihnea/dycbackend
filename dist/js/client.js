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
  document.getElementById('altcoinsSpinner').style.display = 'inline-block';
  document.getElementById('stepsDemo').style.display = 'none';
  fetch('/dashboard/addresses/altcoins/pair', {method: 'GET'})
  .then(function(response) {
    if(response.ok) {
      return response.json();
    }
    throw new Error('Request failed.');
  })
  .then(function(data) {
    document.getElementById('altcoinsSpinner').style.display = 'none';
    document.getElementById('stepsDemo').style.display = 'flex';
    populateSelect('counter', '0', data.length-1, data)
  })
  .catch(function(error) {
    console.log(error);
  });
});

const username = document.getElementById('username').value;
const depositBtn = document.getElementById('depositBtn');
depositBtn.addEventListener('click', function(e) {
  document.getElementById('depositSpinner').style.display = 'inline-block';
  document.getElementById('depositBody').style.display = 'none';
  fetch(`/dashboard/addresses/btc`, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      Accept: 'application/json',
    },
    body: JSON.stringify({ username: username }),
  })
  .then(function(response) {
    if(response.ok) {
      return response.json();
    }
    throw new Error('Request failed.');
  })
  .then(function(data) {
    document.getElementById('transactionId').value = `Transaction ID: ${data.id}`;
    document.getElementById('depositAddressBTC').value = data.address;
    document.getElementById('depositSpinner').style.display = 'none';
    document.getElementById('depositBody').style.display = 'block';
  })
  .catch(function(error) {
    console.log(error);
  });
});

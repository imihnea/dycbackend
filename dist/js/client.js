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

function sortSelect(selElem) {
  var tmpAry = new Array();
  for (var i=0;i<selElem.options.length;i++) {
      tmpAry[i] = new Array();
      tmpAry[i][0] = selElem.options[i].text;
      tmpAry[i][1] = selElem.options[i].value;
  }
  tmpAry.sort();
  while (selElem.options.length > 0) {
      selElem.options[0] = null;
  }
  for (var i=0;i<tmpAry.length;i++) {
      var op = new Option(tmpAry[i][0], tmpAry[i][1]);
      selElem.options[i] = op;
  }
  return;
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
    sortSelect(document.getElementById('counter'))
    button.setAttribute('disabled', 'disabled');
  })
  .catch(function(error) {
    document.getElementById('altcoinsSpinner').style.display = 'none';
    document.getElementById('errorImage').style.display = 'inline-block';
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

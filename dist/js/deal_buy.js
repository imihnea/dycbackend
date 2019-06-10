document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('rateSpinner').style.display = 'none';
    const radio = document.querySelectorAll('input[type=radio][name="deliverySelect"]');
    const f2fLabel = document.getElementById('f2fLabel');
    const shipLabel = document.getElementById('shipLabel');
    radio.forEach(item => {
      item.addEventListener('change', () => {
        if(item.value == 'Shipping') {
          document.getElementById("shipping").style.display = "block";
          if (shipLabel) {
            if (!shipLabel.classList.contains('greenI')) {
              shipLabel.classList.add('greenI');
            }
            if (shipLabel.classList.contains('blueI')) {
              shipLabel.classList.remove('blueI');
            }
          }
          if (f2fLabel.classList.contains('greenI')) {
            f2fLabel.classList.remove('greenI');
          }
          if (!f2fLabel.classList.contains('blueI')) {
            f2fLabel.classList.add('blueI');
          }
          document.getElementById("facetoface").style.display = "none";
        } else if(item.value == 'Face to Face') {
          if (shipLabel) {
            if (shipLabel.classList.contains('greenI')) {
              shipLabel.classList.remove('greenI');
            }
            if (!shipLabel.classList.contains('blueI')) {
              shipLabel.classList.add('blueI');
            }
          }
          if (!f2fLabel.classList.contains('greenI')) {
            f2fLabel.classList.add('greenI');
          }
          if (f2fLabel.classList.contains('blueI')) {
            f2fLabel.classList.remove('blueI');
          }
          document.getElementById("shipping").style.display = "none";
          document.getElementById("facetoface").style.display = "block";
        } else {
          if (shipLabel) {
            if (!shipLabel.classList.contains('blueI')) {
              shipLabel.classList.add('blueI');
            }
          }
          if (!f2fLabel.classList.contains('blueI')) {
            f2fLabel.classList.add('blueI');
          }
          document.getElementById("shipping").style.display = "none";
          document.getElementById("facetoface").style.display = "none";
        }
      });
    });

    // const btcrate = document.getElementById('btcrate');
    // const shippingRate = document.querySelector('input[name="shippingRate"]:checked').value;
    // const productPrice = document.getElementById('productPrice');
    // if(shippingRate) {
    //   shippingRate.addEventListener('change', () => {
    //     totalPrice.innerHTML = `Total price: ${(productPrice + Number(1/btcrate + shippingRate))}`;
    //   })
    // }
});


const button = document.getElementById('myButton');
button.addEventListener('click', function(e) {
    // all delivery names
    var deliveryName = document.getElementById('deliveryName').value;
    var deliveryStreet1 = document.getElementById('deliveryStreet1').value;
    var deliveryCity = document.getElementById('deliveryCity').value;
    var deliveryState = document.getElementById('deliveryState').value;
    var deliveryZip = document.getElementById('deliveryZip').value;
    var deliveryCountry = document.getElementById('deliveryCountry').value;
    var deliveryPhone = document.getElementById('deliveryPhone').value;
    var deliveryEmail = document.getElementById('deliveryEmail').value;
    // show spinner while fetching
    document.getElementById('rateSpinner').style.display = 'inline-block';
    document.getElementById('myButton').style.display = 'none';
    // hide other divs
    document.getElementById('not-valid').style.display = 'none';
    document.getElementById('no-rates').style.display = 'none';
    // product id
    var productId = document.getElementById('productId').value;
  fetch(`/deals/create-address/${productId}`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        Accept: 'application/json',
    },
      body: JSON.stringify({
          deliveryName: deliveryName, 
          deliveryStreet1: deliveryStreet1,
          deliveryCity: deliveryCity,
          deliveryState: deliveryState,
          deliveryZip: deliveryZip,
          deliveryCountry: deliveryCountry,
          deliveryPhone: deliveryPhone,
          deliveryEmail: deliveryEmail,
        }),
    })
  .then(function(response) {
    if(response.ok) {
      console.log('CREATE ADDRESS');
      return response.json();
    }
    throw new Error('Request failed.');
  })
  .then(function(data) {
      console.log('CREATED ADDRESS')
      console.log(data);
      document.getElementById('rateSpinner').style.display = 'none';
      if(data.validation_results) {
        if(data.validation_results.is_valid === false) {
          document.getElementById('not-valid').style.display = 'block';
          document.getElementById('myButton').style.display = 'block';
          document.getElementById('myButton').style = 'button is-primary is-rounded';
        }
      }
      if(data.type === 'ShippoAPIError') {
        document.getElementById('not-valid').style.display = 'block';
        document.getElementById('myButton').style.display = 'block';
        document.getElementById('myButton').style = 'button is-primary is-rounded';
      }
      if(data.rates) {
        if(data.rates.length !== 0) {
          for(i = 0; i < data.rates.length; i++ ) {
              let tbody = document.getElementById('rate-table');
              const text =`
              <tr>
                <td>
                  <img src="${data.rates[i].provider_image_75}" alt="">
                </td>
                <td>${data.rates[i].provider}</td>
                <td>${data.rates[i].estimated_days} Day(s)</td>
                <td>${data.rates[i].amount} ${data.rates[i].currency}</td>
                <td>
                  <input name="shippingRate" type="radio" id="${i}" class="is-checkradio is-info is-large" value="${data.rates[i].amount}">
                  <label for="${i}"></label>
                </td>
              </tr>
              `;
              tbody.insertAdjacentHTML('beforeend', text);
              console.log(`acesta este nr ${i} de rates`)
          }
          let productPrice = document.getElementById('productPrice').value;
          let btcrate = document.getElementById('btcrate').value;
          let totalPrice = document.getElementById('totalPrice');
          for(i = 0; i < document.shippingForm.shippingRate.length; i++ ) {
            document.shippingForm.shippingRate[i].addEventListener('change', function() {
              var id = this.getAttribute('id');
              if(this.checked) {
                console.log(`${id} e checked acum`)
                document.getElementById('rate').value = data.rates[id].object_id;
                console.log(data.rates[id].object_id);
                let btcPrice = Number(productPrice) + Number((this.value*1/btcrate));
                let usdEquiv = Number(this.value) + Number(productPrice*btcrate);
                totalPrice.innerHTML = `Total Price: ${btcPrice.toFixed(7)} Bitcoin (${(usdEquiv).toFixed(2)} USD)`;
              }
            })
          }
          document.getElementById('myButton').style.display = 'none';
          document.getElementById('rates').style.display = 'block';
          document.getElementById('buyButton').style.display = 'block';
        } else {
          document.getElementById('no-rates').style.display = 'block';
          document.getElementById('myButton').style.display = 'block';
          document.getElementById('myButton').style = 'button is-primary is-rounded';
        }
      }
  })
  .catch(function(error) {
    console.log(error);
  });
});

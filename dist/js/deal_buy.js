document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('deliverySelect');
    select.addEventListener('change', () => {
        if(select.value == 'Shipping') {
            document.getElementById("shipping").style.display = "block";
            document.getElementById("facetoface").style.display = "none";
        } else if(select.value == 'Face to Face') {
            document.getElementById("shipping").style.display = "none";
            document.getElementById("facetoface").style.display = "block";
        } else {
            document.getElementById("shipping").style.display = "none";
            document.getElementById("facetoface").style.display = "none";
        }
    });
    // const getValue = document.getElementById("deliverySelect").value;
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
    // seller delivery info
    var sellerName = document.getElementById('sellerName').value;
    var sellerStreet1 = document.getElementById('sellerStreet1').value;
    var sellerCity = document.getElementById('sellerCity').value;
    var sellerState = document.getElementById('sellerState').value;
    var sellerZip = document.getElementById('sellerZip').value;
    var sellerCountry = document.getElementById('sellerCountry').value;
    var sellerPhone = document.getElementById('sellerPhone').value;
    var sellerEmail = document.getElementById('sellerEmail').value;
    // parcel info
    var parcel_length = document.getElementById('parcel_length').value;
    var parcel_width = document.getElementById('parcel_width').value;
    var parcel_height = document.getElementById('parcel_height').value;
    var parcel_distance_unit = document.getElementById('parcel_distance_unit').value;
    var parcel_weight = document.getElementById('parcel_weight').value;
    var parcel_weight_unit = document.getElementById('parcel_weight_unit').value;
    // show spinner while fetching
  document.getElementById('altcoinsSpinner').style.display = 'inline-block';
  document.getElementById('shipping').style.display = 'none';
  fetch('/deals/create-address', {
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
          sellerName: sellerName, 
          sellerStreet1: sellerStreet1,
          sellerCity: sellerCity,
          sellerState: sellerState,
          sellerZip: sellerZip,
          sellerCountry: sellerCountry,
          sellerPhone: sellerPhone,
          sellerEmail: sellerEmail,
          parcel_length: parcel_length,
          parcel_width: parcel_width,
          parcel_height: parcel_height,
          parcel_distance_unit: parcel_distance_unit,
          parcel_weight: parcel_weight,
          parcel_weight_unit: parcel_weight_unit,
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
      // delete hidden seller fields
      document.getElementById('sellerName').remove();
      document.getElementById('sellerStreet1').remove();
      document.getElementById('sellerCity').remove();
      document.getElementById('sellerState').remove();
      document.getElementById('sellerZip').remove();
      document.getElementById('sellerCountry').remove();
      document.getElementById('sellerPhone').remove();
      document.getElementById('sellerEmail').remove();
      document.getElementById('parcel_length').remove();
      document.getElementById('parcel_width').remove();
      document.getElementById('parcel_height').remove();
      document.getElementById('parcel_distance_unit').remove();
      document.getElementById('parcel_weight').remove();
      document.getElementById('parcel_weight_unit').remove();
      console.log('CREATED ADDRESS')
      console.log(data);
      document.getElementById('altcoinsSpinner').style.display = 'none';
      if(data.validation_results.is_valid === false) {
        document.getElementById('not-valid').style.display = 'block';
      } else {
        document.getElementById('is-valid').style.display = 'block';
      }
  })
  .catch(function(error) {
    console.log(error);
  });
});

document.addEventListener('DOMContentLoaded', () => {
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

  let city = document.getElementById('city');
  let state = document.getElementById('state');
  let country = document.getElementById('country');
  let worldwide = document.getElementById('worldwide'); 
  let transport = document.getElementById('transport');

  city.addEventListener('change', () => {
    if (city.checked == true) {
      transport.classList.remove('hide');
    } else {
      if ((state.checked == false) && (country.checked == false) && 
          (worldwide.checked == false)) {
            transport.classList.add('hide');
      }
    }
  });
  state.addEventListener('click', () => {
    if (state.checked == true) {
      if (transport.classList.contains('hide')){
        transport.classList.remove('hide');
      }
    } else {
      if (!transport.classList.contains('hide')){
        if ((city.checked == false) && (country.checked == false) && 
            (worldwide.checked == false)) {
              transport.classList.add('hide');
        }
      }
    }
  });
  country.addEventListener('click', () => {
    if (country.checked == true) {
      if (transport.classList.contains('hide')){
        transport.classList.remove('hide');
      }
    } else {
      if (!transport.classList.contains('hide')){
        if ((state.checked == false) && (city.checked == false) && 
            (worldwide.checked == false)) {
              transport.classList.add('hide');
        }
      }
    }
  });
  worldwide.addEventListener('click', () => {
    if (worldwide.checked == true) {
      if (transport.classList.contains('hide')){
        transport.classList.remove('hide');
      }
    } else {
      if (!transport.classList.contains('hide')){
        if ((state.checked == false) && (country.checked == false) && 
            (city.checked == false)) {
              transport.classList.add('hide');
        }
      }
    }
  });

  document.getElementsByName('product[cityTransport]').forEach((item) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      if (item.value == 'paid') {
        document.getElementById('cityTransportDiv').classList.remove('hide');
        document.getElementById('paidCityOpt').classList.remove('delivOptionsUnchecked');
        document.getElementById('paidCityOpt').classList.add('delivOptionsChecked');
        document.getElementById('freeCityOpt').classList.add('delivOptionsUnchecked');
        document.getElementById('freeCityOpt').classList.remove('delivOptionsChecked');
      } else {
        document.getElementById('cityTransportDiv').classList.add('hide');
        document.getElementById('freeCityOpt').classList.remove('delivOptionsUnchecked');
        document.getElementById('freeCityOpt').classList.add('delivOptionsChecked');
        document.getElementById('paidCityOpt').classList.add('delivOptionsUnchecked');
        document.getElementById('paidCityOpt').classList.remove('delivOptionsChecked');
      }
    });
  });
  document.getElementsByName('product[stateTransport]').forEach((item) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      if (item.value == 'paid') {
        document.getElementById('stateTransportDiv').classList.remove('hide');
        document.getElementById('paidStateOpt').classList.remove('delivOptionsUnchecked');
        document.getElementById('paidStateOpt').classList.add('delivOptionsChecked');
        document.getElementById('freeStateOpt').classList.add('delivOptionsUnchecked');
        document.getElementById('freeStateOpt').classList.remove('delivOptionsChecked');
      } else {
        document.getElementById('stateTransportDiv').classList.add('hide');
        document.getElementById('freeStateOpt').classList.remove('delivOptionsUnchecked');
        document.getElementById('freeStateOpt').classList.add('delivOptionsChecked');
        document.getElementById('paidStateOpt').classList.add('delivOptionsUnchecked');
        document.getElementById('paidStateOpt').classList.remove('delivOptionsChecked');
      }
    });
  });
  document.getElementsByName('product[countryTransport]').forEach((item) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      if (item.value == 'paid') {
        document.getElementById('countryTransportDiv').classList.remove('hide');
        document.getElementById('paidCountryOpt').classList.remove('delivOptionsUnchecked');
        document.getElementById('paidCountryOpt').classList.add('delivOptionsChecked');
        document.getElementById('freeCountryOpt').classList.add('delivOptionsUnchecked');
        document.getElementById('freeCountryOpt').classList.remove('delivOptionsChecked');
      } else {
        document.getElementById('countryTransportDiv').classList.add('hide');
        document.getElementById('freeCountryOpt').classList.remove('delivOptionsUnchecked');
        document.getElementById('freeCountryOpt').classList.add('delivOptionsChecked');
        document.getElementById('paidCountryOpt').classList.add('delivOptionsUnchecked');
        document.getElementById('paidCountryOpt').classList.remove('delivOptionsChecked');
      }
    });
  });
  document.getElementsByName('product[worldwideTransport]').forEach((item) => {
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      if (item.value == 'paid') {
        document.getElementById('worldwideTransportDiv').classList.remove('hide');
        document.getElementById('paidWorldwideOpt').classList.remove('delivOptionsUnchecked');
        document.getElementById('paidWorldwideOpt').classList.add('delivOptionsChecked');
        document.getElementById('freeWorldwideOpt').classList.add('delivOptionsUnchecked');
        document.getElementById('freeWorldwideOpt').classList.remove('delivOptionsChecked');
      } else {
        document.getElementById('worldwideTransportDiv').classList.add('hide');
        document.getElementById('freeWorldwideOpt').classList.remove('delivOptionsUnchecked');
        document.getElementById('freeWorldwideOpt').classList.add('delivOptionsChecked');
        document.getElementById('paidWorldwideOpt').classList.add('delivOptionsUnchecked');
        document.getElementById('paidWorldwideOpt').classList.remove('delivOptionsChecked');
      }
    });
  });

  const repeatable = document.querySelector('.fa-redo');
  repeatable.addEventListener('click', (event) => {
    event.stopPropagation();
    repeatable.classList.toggle('green');
    repeatable.classList.toggle('normal');
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

  let firstCat = document.getElementById('firstCat');
  let secondCat = document.getElementById('secondCat');
  let thirdCat = document.getElementById('thirdCat');

  const Categories = [
    { name: 'Collectibles & Art', opt: ['Collectibles', 'Antiques', 'Art'] },
    { name: 'Electronics', opt: ['Computers & Laptops', 'Cameras', 'TV & Audio', 'Phones & Tablets', 'Consoles & Videogames', 'Other Electronics'] },
    { name: 'Fashion & Beauty', opt: ['Female Clothes', 'Female Shoes', 'Male Clothes', 'Male Shoes', 'Accessories', 'Jewellry', 'Other Fashion']},
    { name: 'Home Improvement', opt: ['Furniture', 'Decoration', 'Garden', 'Hardware & Tools', 'Other Home Products']},
    { name: 'Leisure Time', opt: ['Books', 'Movies & Television', 'Music', 'Other Leisure Products']},
    { name: 'Mothers & Babies', opt: ['Clothes', 'Strollers', 'Baby Care', 'Safety', 'Toys', 'Other Baby Products']},
    { name: 'Pet Supplies', opt: ['Dogs', 'Cats', 'Aquatic Pets', 'Birds', 'Other Pets']},
    { name: 'Real Estate', opt: ['Apartments', 'Houses', 'Other Estates']},
    { name: 'Sports & Outdoors', opt: ['Sports & Fitness', 'Outdoor']},
    { name: 'Vehicles', opt: ['Automobiles', 'Trucks & Trailers', 'Motorcycles & ATVs', 'Boats', 'Other Vehicles']},
  ];

  const secCategories = [
    { name: 'Collectibles', opt: ['Comics', 'Militaria', 'Collectible Metalware', 'Automated Devices', 'Vending Machines', 'Brewery Collectibles', 'Advertisements', 'Other'] },
    { name: 'Antiques', opt: ['Furniture', 'Decorations', 'Maps', 'Musical Instruments', 'Rugs', 'Other'] },
    { name: 'Art', opt: ['Visual Art', 'Art Supplies', 'Other'] },
    { name: 'Computers & Laptops', opt: ['Laptops', 'PC Systems', 'Components', 'Office Electronics', 'Mice & Keyboards', 'Networking Devices', 'Accessories', 'Other'] },
    { name: 'Cameras', opt: ['Digital Cameras', 'Video Cameras', 'Video Surveillance', 'Binoculars', 'Scopes', 'Lenses', 'Flashes', 'Lighting & Studio', 'Pods', 'Accessories', 'Other'] },
    { name: 'TV & Audio', opt: ['TVs', 'Projectors', 'Audio Systems', 'Portable Players', 'Accessories', 'Other'] },
    { name: 'Phones & Tablets', opt: ['Phones', 'Tablets', 'Accessories', 'Other'] },
    { name: 'Consoles & Videogames', opt: ['Consoles', 'Videogames', 'Console Accessories', 'Other'] },
    { name: 'Other Electronics', opt: ['GPS', 'Medical Electronics', 'Other'] },
    { name: 'Female Clothes', opt: ['T-Shirts', 'Shirts', 'Blouses & Pullovers', 'Jeans & Trousers', 'Skirts', 'Dresses', 'Wedding Dresses', 'Suits', 'Jackets & Coats', 'Sport Clothes', 'Swimwear', 'Underwear', 'Other'] },
    { name: 'Female Shoes', opt: ['Sneakers', 'Boots', 'Shoes', 'Slippers', 'Sandals', 'Other'] },
    { name: 'Male Clothes', opt: ['T-Shirts', 'Shirts', 'Blouses & Pullovers', 'Jeans & Trousers', 'Suits', 'Jackets & Coats', 'Sport Clothes', 'Swimwear', 'Underwear', 'Other'] },
    { name: 'Male Shoes', opt: ['Sneakers', 'Boots', 'Shoes', 'Slippers', 'Sandals', 'Other'] },
    { name: 'Accessories', opt: ['Watches', 'Ties', 'Belts', 'Scarves', 'Bags', 'Glasses', 'Hats & Caps', 'Wallets', 'Other'] },
    { name: 'Jewellry', opt: ['Bracelets', 'Earrings', 'Necklaces', 'Rings', 'Sets', 'Other'] },
    { name: 'Other Fashion', opt: ['Cosmetics', 'Perfumes', 'Skin Care', 'Foot, Hand & Nail Care', 'Hair Care', 'Shaving', 'Personal Care', 'Oral Care', 'Other'] },
    { name: 'Furniture', opt: ['Bathroom', 'Bed Room', 'Living Room', 'Kitchen', 'Office', 'Other'] },
    { name: 'Decoration', opt: ['Decorations', 'Other'] },
    { name: 'Garden', opt: ['Garden Furniture', 'Plants', 'Tools & Accessories', 'Other'] },
    { name: 'Hardware & Tools', opt: ['Power Tools', 'Hardware', 'Tools & Parts', 'Other'] },
    { name: 'Other Home Products', opt: ['Construction Materials', 'Other'] },
    { name: 'Books', opt: ['Books', 'Magazines', 'Comics', 'Textbooks', 'Other'] },
    { name: 'Movies & Television', opt: ['Movies', 'TV Series', 'Other'] },
    { name: 'Music', opt: ['Musical Instruments', 'Accessories', 'CDs & Vinyls', 'Other'] },
    { name: 'Other Leisure Products', opt: ['Boardgames', 'Other'] },
    { name: 'Clothes', opt: ['Maternity Clothes', 'Baby Clothes', 'Baby Shoes', 'Other'] },
    { name: 'Strollers', opt: ['Strollers', 'Accessories', 'Replacement Parts', 'Other'] },
    { name: 'Baby Care', opt: ['Bathing', 'Grooming', 'Health', 'Pacifiers & Teethers', 'Diapering', 'Other'] },
    { name: 'Safety', opt: ['Cabinet Locks', 'Crib Netting', 'Edge & Corner Guards', 'Electrical Safety', 'Gates & Doorways', 'Harnesses', 'Kitchen Safety', 'Monitors', 'Other'] },
    { name: 'Toys', opt: ['Balls', 'Bath Toys', 'Blocks', 'Crib Toys', 'Structures', 'Other'] },
    { name: 'Other Baby Products', opt: ['Family Planning Tests', 'Monitoring Devices', 'Travel Gear', 'Other'] },
    { name: 'Dogs', opt: ['Food', 'Treats', 'Apparel & Accessories', 'Beds', 'Carriers & Cages', 'Collars', 'Doors & Gates', 'Bug Control', 'Grooming', 'Health Supplies', 'Litter', 'Toys', 'Other'] },
    { name: 'Cats', opt: ['Food', 'Treats', 'Apparel & Accessories', 'Beds', 'Carriers & Cages', 'Collars', 'Doors & Gates', 'Bug Control', 'Grooming', 'Health Supplies', 'Litter', 'Toys', 'Other'] },
    { name: 'Aquatic Pets', opt: ['Food', 'Aquariums', 'Aquarium Accessories', 'Breeding Tanks', 'Health Supplies', 'Other'] },
    { name: 'Birds', opt: ['Food', 'Treats', 'Carriers & Cages', 'Accessories', 'Health Supplies', 'Toys', 'Other'] },
    { name: 'Other Pets', opt: ['Food', 'Treats', 'Cages & Carriers', 'Accessories', 'Health Supplies', 'Toys', 'Other'] },
    { name: 'Apartments', opt: ['Flats', 'Apartments', 'Other'] },
    { name: 'Houses', opt: ['One Floor Houses', 'Multiple Floor Houses', 'Other'] },
    { name: 'Other Estates', opt: ['Fields', 'Farms', 'Other'] },
    { name: 'Sports & Fitness', opt: ['Clothes', 'Fitness', 'Golf', 'Hunting & Fishing', 'Airsoft & Paintball', 'Tennis', 'Fan Items', 'Other'] },
    { name: 'Outdoor', opt: ['Camping & Hiking', 'Climbing', 'Cycling', 'Skates & Skateboards', 'Water Sports', 'Winter Sports', 'Accessories', 'Other'] },
    { name: 'Automobiles', opt: ['Cars', 'Car Care', 'Accessories', 'Lights', 'Parts', 'Tires', 'Other'] },
    { name: 'Trucks & Trailers', opt: ['Semitrucks', 'Trucks', 'Trailers', 'Parts', 'Tires', 'Other'] },
    { name: 'Motorcycles & ATVs', opt: ['Motorcycles', 'Scooters', 'ATVs', 'Parts', 'Tires', 'Other'] },
    { name: 'Boats', opt: ['Leisure Boats', 'Fishing Boats', 'Parts', 'Other'] },
    { name: 'Other Vehicles', opt: ['Other'] }
  ];

  firstCat.addEventListener('change', () => {
    secondCat.innerHTML = '<option disabled selected>Secondary Category</option>';
    thirdCat.innerHTML = '<option disabled selected>Tertiary Category</option>';
    Categories.forEach((item) => {
      if (firstCat.value == item.name) {
        item.opt.forEach((option) => {
          secondCat.innerHTML += `<option value="${option}">${option}</option>`;
        }); 
      }
    });
  });

  secondCat.addEventListener('change', () => {
    thirdCat.innerHTML = 
    '<option disabled selected>Tertiary Category</option>';
    secCategories.forEach((item) => {
      if (secondCat.value == item.name) {
        item.opt.forEach((option) => {
          thirdCat.innerHTML += `<option value="${option}">${option}</option>`;
        }); 
      }
    });
  });
});

const escapeHTML = (unsafe) => {
  return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/@/g, "&commat;")
        .replace(/\^/g, "&Hat;")
        .replace(/:/g, "&colon;")
        .replace(/;/g, "&semi;")
        .replace(/#/g, "&num;")
        .replace(/\$/g, "&dollar;")
        .replace(/%/g, "&percent;")
        .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', () => {
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

  const radio1 = document.getElementById('shipping-yes');
  const radio2 = document.getElementById('shipping-no');
  radio1.addEventListener('change', () => {
      if(radio1.checked == true) {
        document.getElementById("carriers").style.display = "block";
      }
  });
  radio2.addEventListener('change', () => {
    if(radio2.checked == true) {
      document.getElementById("carriers").style.display = "none";
    }
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
    { name: 'Female Clothes', opt: ['T Shirts', 'Shirts', 'Blouses & Pullovers', 'Jeans & Trousers', 'Skirts', 'Dresses', 'Wedding Dresses', 'Suits', 'Jackets & Coats', 'Sport Clothes', 'Swimwear', 'Underwear', 'Other'] },
    { name: 'Female Shoes', opt: ['Sneakers', 'Boots', 'Shoes', 'Slippers', 'Sandals', 'Other'] },
    { name: 'Male Clothes', opt: ['T Shirts', 'Shirts', 'Blouses & Pullovers', 'Jeans & Trousers', 'Suits', 'Jackets & Coats', 'Sport Clothes', 'Swimwear', 'Underwear', 'Other'] },
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
          secondCat.innerHTML += `<option value="${escapeHTML(option)}">${escapeHTML(option)}</option>`;
        }); 
      }
    });
  });

  secondCat.addEventListener('change', () => {
    thirdCat.innerHTML = '<option disabled selected>Tertiary Category</option>';
    secCategories.forEach((item) => {
      if (secondCat.value == item.name) {
        item.opt.forEach((option) => {
          thirdCat.innerHTML += `<option value="${escapeHTML(option)}">${escapeHTML(option)}</option>`;
        }); 
      }
    });
  });

  const tagInput = document.getElementById('tagInput');
  let tags = document.getElementById('tags');
  const tagsControl = document.getElementById('tagsControl');
  let deleteTagBtns = document.querySelectorAll('.deleteTag');
  let deleteTagItems = [].slice.call(deleteTagBtns);
  // Check if the last character was the comma
  tagInput.addEventListener('keypress', () => {
    if (tagInput.value.substr(tagInput.value.length - 1) == ',') {
      if (tagInput.value.length > 1) {
        // Add the tag to tag input that gets sent
        tags.value += ' ' + tagInput.value.substring(0, tagInput.value.length - 1);
        // Create the tag element
        tagsControl.innerHTML += `<span class="tag is-link is-medium">${escapeHTML(tagInput.value.substring(0, tagInput.value.length - 1))}<button type="button" class="delete deleteTag is-small"></button></span>`;
        // Clean the input
        tagInput.value = '';
        // Remake the array of delete buttons with the new tag
        deleteTagBtns = document.querySelectorAll('.deleteTag');
        deleteTagItems = [].slice.call(deleteTagBtns);
        // Create the tag deletion event
        deleteTagItems.forEach((item) => {
          item.addEventListener('click', () => {
            const text = item.parentElement.innerText;
            const regex = new RegExp('\\b' + text + '\\b');
            // Remove the tag
            tags.value = tags.value.replace(regex, '');
            // Remove extra spaces
            tags.value = tags.value.replace(/\s+/g, ' ').trim();
            item.parentElement.remove();
          });
        });
      } else {
        tagInput.value = '';
      }
    }
  });

});

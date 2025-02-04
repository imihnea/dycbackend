const cleanHTML = (unclean) => {
  return unclean
    .replace(/</g, "")
    .replace(/>/g, "");
};

function PicturePreview(input, boxNr) {
  if (input.files && input.files[0]) {
      var reader = new FileReader();

      switch(boxNr) {
        case 0:
          reader.onload = function (e) {
            $('#Preview0')
                .attr('src', e.target.result);
          };
          break;
        case 1:
            reader.onload = function (e) {
              $('#Preview1')
                  .attr('src', e.target.result);
          };
          break;
        case 2:
            reader.onload = function (e) {
              $('#Preview2')
                  .attr('src', e.target.result);
          };
          break;
        case 3:
            reader.onload = function (e) {
              $('#Preview3')
                  .attr('src', e.target.result);
          };
          break;
        case 4:
            reader.onload = function (e) {
              $('#Preview4')
                  .attr('src', e.target.result);
          };
          break;

      }

      reader.readAsDataURL(input.files[0]);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const repeatable = document.querySelector('.fa-redo');
  repeatable.addEventListener('click', (event) => {
    event.stopPropagation();
    repeatable.classList.toggle('green');
    repeatable.classList.toggle('normal');
  });
  
  const price = document.getElementById('btc-price');
  const dollarPrice = document.getElementById('usd-price');
  const dollar = document.getElementById('oneDollar');

  if (dollarPrice.value > 0) {
    price.value = (dollarPrice.value * dollar.value).toFixed(8);
  }

  dollarPrice.addEventListener('keyup', () => {
    price.value = (dollarPrice.value * dollar.value).toFixed(8);    
  });
  
  const label1 = document.getElementById('feat1Label');
  const i1 = document.getElementById('feat1I');
  const label2 = document.getElementById('feat2Label');
  const i2 = document.getElementById('feat2I');
  const feat1 = document.getElementById('feat_1');
  const feat2 = document.getElementById('feat_2');
  
  if(label1) {
    label1.addEventListener('mouseenter', () => {
      if (feat1.checked) {
        i1.classList.add('redI');
        i1.classList.remove('greenI');
      } else {
        i1.classList.add('greenI');
        i1.classList.remove('blueI');        
      }
    });
    
    label1.addEventListener('mouseleave', () => {
      if (feat1.checked) {
        i1.classList.remove('redI');
        i1.classList.add('greenI');
      } else {
        i1.classList.remove('greenI');
        i1.classList.remove('redI');
        i1.classList.add('blueI');  
      }
    });
  }

  if(label2) {
    label2.addEventListener('mouseenter', () => {
      if (feat2.checked) {
        i2.classList.add('redI');
        i2.classList.remove('greenI');
      } else {
        i2.classList.add('greenI');
        i2.classList.remove('blueI');        
      }
    });
    
    label2.addEventListener('mouseleave', () => {
      if (feat2.checked) {
        i2.classList.remove('redI');
        i2.classList.add('greenI');
      } else {
        i2.classList.remove('greenI');
        i2.classList.remove('redI');
        i2.classList.add('blueI');  
      }
    });
  }

  const inputs = document.querySelectorAll('.file-upload__input');
  const inputItems = [].slice.call(inputs);
  const labels = document.querySelectorAll('.label');
  const labelItems = [].slice.call(labels);
  const squares = document.querySelectorAll('.square');
  const squareItems = [].slice.call(squares);
  const checks = document.querySelectorAll('.previewImage');
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
    { name: 'Collectibles and Art', opt: ['Collectibles', 'Antiques', 'Art'] },
    { name: 'Electronics', opt: ['Computers and Laptops', 'Cameras', 'TV and Audio', 'Phones and Tablets', 'Consoles and Videogames', 'Other Electronics'] },
    { name: 'Fashion and Beauty', opt: ['Female Clothes', 'Female Shoes', 'Male Clothes', 'Male Shoes', 'Accessories', 'Jewellry', 'Other Fashion']},
    { name: 'Home Improvement', opt: ['Furniture', 'Decoration', 'Garden', 'Hardware and Tools', 'Other Home Products']},
    { name: 'Leisure Time', opt: ['Books', 'Movies and Television', 'Music', 'Other Leisure Products']},
    { name: 'Mothers and Babies', opt: ['Clothes', 'Strollers', 'Baby Care', 'Safety', 'Toys', 'Other Baby Products']},
    { name: 'Pet Supplies', opt: ['Dogs', 'Cats', 'Aquatic Pets', 'Birds', 'Other Pets']},
    { name: 'Real Estate', opt: ['Apartments', 'Houses', 'Other Estates']},
    { name: 'Services', opt: ['IT', 'Design', 'Entertainment', 'Education', 'Financial', 'Sports', 'Other Services']},
    { name: 'Sports and Outdoors', opt: ['Sports and Fitness', 'Outdoor']},
    { name: 'Vehicles', opt: ['Automobiles', 'Trucks and Trailers', 'Motorcycles and ATVs', 'Boats', 'Other Vehicles']},
    { name: 'Other', opt: ['Digital Goods', 'Other']}
  ];

  const secCategories = [
    { name: 'Collectibles', opt: ['Comics', 'Militaria', 'Collectible Metalware', 'Automated Devices', 'Vending Machines', 'Brewery Collectibles', 'Advertisements', 'Other'] },
    { name: 'Antiques', opt: ['Furniture', 'Decorations', 'Maps', 'Musical Instruments', 'Rugs', 'Other'] },
    { name: 'Art', opt: ['Visual Art', 'Art Supplies', 'Other'] },
    { name: 'Computers and Laptops', opt: ['Laptops', 'PC Systems', 'Components', 'Office Electronics', 'Mice and Keyboards', 'Networking Devices', 'Accessories', 'Other'] },
    { name: 'Cameras', opt: ['Digital Cameras', 'Video Cameras', 'Video Surveillance', 'Binoculars', 'Scopes', 'Lenses', 'Flashes', 'Lighting and Studio', 'Pods', 'Accessories', 'Other'] },
    { name: 'TV and Audio', opt: ['TVs', 'Projectors', 'Audio Systems', 'Portable Players', 'Accessories', 'Other'] },
    { name: 'Phones and Tablets', opt: ['Phones', 'Tablets', 'Accessories', 'Other'] },
    { name: 'Consoles and Videogames', opt: ['Consoles', 'Videogames', 'Console Accessories', 'Other'] },
    { name: 'Other Electronics', opt: ['GPS', 'Medical Electronics', 'Other'] },
    { name: 'Female Clothes', opt: ['T Shirts', 'Shirts', 'Blouses and Pullovers', 'Jeans and Trousers', 'Skirts', 'Dresses', 'Wedding Dresses', 'Suits', 'Jackets and Coats', 'Sport Clothes', 'Swimwear', 'Underwear', 'Other'] },
    { name: 'Female Shoes', opt: ['Sneakers', 'Boots', 'Shoes', 'Slippers', 'Sandals', 'Other'] },
    { name: 'Male Clothes', opt: ['T Shirts', 'Shirts', 'Blouses and Pullovers', 'Jeans and Trousers', 'Suits', 'Jackets and Coats', 'Sport Clothes', 'Swimwear', 'Underwear', 'Other'] },
    { name: 'Male Shoes', opt: ['Sneakers', 'Boots', 'Shoes', 'Slippers', 'Sandals', 'Other'] },
    { name: 'Accessories', opt: ['Watches', 'Ties', 'Belts', 'Scarves', 'Bags', 'Glasses', 'Hats and Caps', 'Wallets', 'Other'] },
    { name: 'Jewellry', opt: ['Bracelets', 'Earrings', 'Necklaces', 'Rings', 'Sets', 'Other'] },
    { name: 'Other Fashion', opt: ['Cosmetics', 'Perfumes', 'Skin Care', 'Foot, Hand and Nail Care', 'Hair Care', 'Shaving', 'Personal Care', 'Oral Care', 'Other'] },
    { name: 'Furniture', opt: ['Bathroom', 'Bed Room', 'Living Room', 'Kitchen', 'Office', 'Other'] },
    { name: 'Decoration', opt: ['Decorations', 'Other'] },
    { name: 'Garden', opt: ['Garden Furniture', 'Plants', 'Tools and Accessories', 'Other'] },
    { name: 'Hardware and Tools', opt: ['Power Tools', 'Hardware', 'Tools and Parts', 'Other'] },
    { name: 'Other Home Products', opt: ['Construction Materials', 'Other'] },
    { name: 'Books', opt: ['Books', 'Magazines', 'Comics', 'Textbooks', 'Other'] },
    { name: 'Movies and Television', opt: ['Movies', 'TV Series', 'Other'] },
    { name: 'Music', opt: ['Musical Instruments', 'Accessories', 'CDs and Vinyls', 'Other'] },
    { name: 'Other Leisure Products', opt: ['Boardgames', 'Other'] },
    { name: 'Clothes', opt: ['Maternity Clothes', 'Baby Clothes', 'Baby Shoes', 'Other'] },
    { name: 'Strollers', opt: ['Strollers', 'Accessories', 'Replacement Parts', 'Other'] },
    { name: 'Baby Care', opt: ['Bathing', 'Grooming', 'Health', 'Pacifiers and Teethers', 'Diapering', 'Other'] },
    { name: 'Safety', opt: ['Cabinet Locks', 'Crib Netting', 'Edge and Corner Guards', 'Electrical Safety', 'Gates and Doorways', 'Harnesses', 'Kitchen Safety', 'Monitors', 'Other'] },
    { name: 'Toys', opt: ['Balls', 'Bath Toys', 'Blocks', 'Crib Toys', 'Structures', 'Other'] },
    { name: 'Other Baby Products', opt: ['Family Planning Tests', 'Monitoring Devices', 'Travel Gear', 'Other'] },
    { name: 'Dogs', opt: ['Food', 'Treats', 'Apparel and Accessories', 'Beds', 'Carriers and Cages', 'Collars', 'Doors and Gates', 'Bug Control', 'Grooming', 'Health Supplies', 'Litter', 'Toys', 'Other'] },
    { name: 'Cats', opt: ['Food', 'Treats', 'Apparel and Accessories', 'Beds', 'Carriers and Cages', 'Collars', 'Doors and Gates', 'Bug Control', 'Grooming', 'Health Supplies', 'Litter', 'Toys', 'Other'] },
    { name: 'Aquatic Pets', opt: ['Food', 'Aquariums', 'Aquarium Accessories', 'Breeding Tanks', 'Health Supplies', 'Other'] },
    { name: 'Birds', opt: ['Food', 'Treats', 'Carriers and Cages', 'Accessories', 'Health Supplies', 'Toys', 'Other'] },
    { name: 'Other Pets', opt: ['Food', 'Treats', 'Cages and Carriers', 'Accessories', 'Health Supplies', 'Toys', 'Other'] },
    { name: 'Apartments', opt: ['Flats', 'Apartments', 'Other'] },
    { name: 'Houses', opt: ['One Floor Houses', 'Multiple Floor Houses', 'Other'] },
    { name: 'Other Estates', opt: ['Fields', 'Farms', 'Other'] },
    { name: 'Sports and Fitness', opt: ['Clothes', 'Fitness', 'Golf', 'Hunting and Fishing', 'Airsoft and Paintball', 'Tennis', 'Fan Items', 'Other'] },
    { name: 'Outdoor', opt: ['Camping and Hiking', 'Climbing', 'Cycling', 'Skates and Skateboards', 'Water Sports', 'Winter Sports', 'Accessories', 'Other'] },
    { name: 'Automobiles', opt: ['Cars', 'Car Care', 'Accessories', 'Lights', 'Parts', 'Tires', 'Other'] },
    { name: 'Trucks and Trailers', opt: ['Semitrucks', 'Trucks', 'Trailers', 'Parts', 'Tires', 'Other'] },
    { name: 'Motorcycles and ATVs', opt: ['Motorcycles', 'Scooters', 'ATVs', 'Parts', 'Tires', 'Other'] },
    { name: 'Boats', opt: ['Leisure Boats', 'Fishing Boats', 'Parts', 'Other'] },
    { name: 'Other Vehicles', opt: ['Other'] },
    { name: 'Digital Goods', opt: ['Digital Art', 'Software license', 'Video Game Accounts', 'Cryptocurrencies', 'Other']},
    { name: 'Other', opt: ['Gift Cards', 'Services', 'Other']},
    { name: 'IT', opt: ['Web', 'Security', 'Databases', 'Software', 'Computer Repairs', 'Other']},
    { name: 'Design', opt: ['Logo', 'Video', 'Photography', 'Advertising', 'Clothing', 'Art', 'Other']},
    { name: 'Entertainment', opt: ['Movies', 'Concerts', 'Festivals', 'Tickets', 'Other']},
    { name: 'Education', opt: ['Tutoring', 'Homework', 'Notes', 'Books', 'Other']},
    { name: 'Financial', opt: ['Tutoring', 'Advice', 'Predictions', 'Managing', 'Accounting', 'Other']},
    { name: 'Sports', opt: ['Coaching', 'Training', 'Diets', 'Other']},
    { name: 'Other Services', opt: ['Other']}
  ];

  if (firstCat.value) {
    Categories.forEach((item) => {
      if (firstCat.value == item.name) {
        item.opt.forEach((option) => {
          secondCat.innerHTML += `<option value="${option}">${option}</option>`;
        }); 
      }
    });
  }

  if (secondCat.value) {
    secCategories.forEach((item) => {
      if (secondCat.value == item.name) {
        item.opt.forEach((option) => {
          thirdCat.innerHTML += `<option value="${option}">${option}</option>`;
        }); 
      }
    });
  }

  const condition = document.getElementById('conditionSelect');
  firstCat.addEventListener('change', () => {
    if (firstCat.value == 'Services') {
      if (!condition.classList.contains('hidden')) {
        condition.classList.add('hidden');
      }
    } else {
      if (condition.classList.contains('hidden')) {
        condition.classList.remove('hidden');
      }
    }
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
    thirdCat.innerHTML = '<option disabled selected>Tertiary Category</option>';
    secCategories.forEach((item) => {
      if (secondCat.value == item.name) {
        item.opt.forEach((option) => {
          thirdCat.innerHTML += `<option value="${option}">${option}</option>`;
        }); 
      }
    });
  });

  const tagInput = document.getElementById('tagInput');
  let tags = document.getElementById('tags');
  const tagsControl = document.getElementById('tagsControl');
  let deleteTagBtns = document.querySelectorAll('.deleteTag');
  let deleteTagItems = [].slice.call(deleteTagBtns);
  const addButton = document.getElementById('addTag');
  let times = tagsControl.children.length;
  const KEY_ENTER = 13;
  tagInput.addEventListener('keydown', (e) => {
    let key = e.charCode || e.keyCode || e.which;
    if ((key == KEY_ENTER) && (tagInput.value.length > 1) && (times < 10)) {
      e.preventDefault();
      times += 1;
      if (times == 10) {
        tagInput.placeholder = 'You have reached the tag limit';
        tagInput.disabled = true;
        tagInput.classList.add('parsley-error');
      }
      // Add the tag to tag input that gets sent
      tags.value += ' ' + cleanHTML(String(tagInput.value));
      // Create the tag element
      tagsControl.innerHTML += `<span class="tag is-link is-medium">${cleanHTML(String(tagInput.value))}<button type="button" class="delete deleteTag is-small"></button></span>`;
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
          times -= 1;
          if (tagInput.classList.contains('parsley-error')) {
            tagInput.classList.remove('parsley-error');
            tagInput.disabled = false;
            tagInput.placeholder = 'Tags';
          }
        });
      });
    }
  });

  addButton.addEventListener('click', () => {
    if ((tagInput.value.length > 1) && (times < 10)) {
      times += 1;
      if (times == 10) {
          tagInput.placeholder = 'You have reached the tag limit';
          tagInput.disabled = true;
          tagInput.classList.add('parsley-error');
      }
      // Add the tag to tag input that gets sent
      tags.value += ' ' + cleanHTML(String(tagInput.value));
      // Create the tag element
      tagsControl.innerHTML += `<span class="tag is-link is-medium">${cleanHTML(String(tagInput.value))}<button type="button" class="delete deleteTag is-small"></button></span>`;
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
          times -= 1;
          if (tagInput.classList.contains('parsley-error')) {
            tagInput.classList.remove('parsley-error');
            tagInput.disabled = false;
            tagInput.placeholder = 'Tags';
          }
        });
      });
      tagInput.focus(); 
      }
  });

});

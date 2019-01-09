document.addEventListener('DOMContentLoaded', () => {
  const currentLocation = window.location.pathname;
  const categoryName = document.getElementById('maincateg');
  switch (currentLocation.split('/')[2]) {
    case ('Collectibles-Art'): {
      categoryName.innerHTML = '<a class="sub_name menu-label" href="/dashboard/Collectibles-Art">Collectibles & Art</a>';
      break;
    }
    case ('Home-Garden'): {
      categoryName.innerHTML = '<a class="sub_name menu-label" href="/dashboard/Home-Garden">Home & Garden</a>';
      break;
    }
    case ('Sporting-Goods'): {
      categoryName.innerHTML = '<a class="sub_name menu-label" href="/dashboard/Sporting-Goods">Sporting Goods</a>';
      break;
    }
    case ('Electronics'): {
      categoryName.innerHTML = '<a class="sub_name menu-label" href="/dashboard/Electronics">Electronics</a>';
      break;
    }
    case ('AutoParts-Accessories'): {
      categoryName.innerHTML = '<a class="sub_name menu-label" href="/dashboard/AutoParts-Accessories">Auto Parts & Accessories</a>';
      break;
    }
    case ('Toys-Hobbies'): {
      categoryName.innerHTML = '<a class="sub_name menu-label" href="/dashboard/Toys-Hobbies">Toys & Hobbies</a>';
      break;
    }
    case ('Fashion'): {
      categoryName.innerHTML = '<a class="sub_name menu-label" href="/dashboard/Fashion">Fashion</a>';
      break;
    }
    case ('MusicalInstruments-Gear'): {
      categoryName.innerHTML = '<a class="sub_name menu-label" href="/dashboard/MusicalInstruments-Gear">Musical Instruments & Gear</a>';
      break;
    }
    case ('Other'): {
      categoryName.innerHTML = '<a class="sub_name menu-label" href="/dashboard/Other">Other</a>';
      break;
    }
    default: {
      break;
    }
  }
});

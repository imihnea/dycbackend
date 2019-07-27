document.addEventListener('DOMContentLoaded', () => {
  // const images = document.querySelectorAll('.featimgs');
  // const imageItems = [].slice.call(images);
  // imageItems.forEach(img => {
  //   if (img.dataset.src) {
  //     img.dataset.src = img.dataset.src.replace('/image/upload/', '/image/upload/f_auto/w_288,h_288/c_scale,w_auto,dpr_auto/');
  //     if (img.classList.contains('loadFirst')) {
  //       img.src = img.dataset.src;
  //     }
  //   }
  // });

  const element = document.querySelectorAll('.dealname');
  const elementItems = [].slice.call(element);
  let truncated;
  let i = 0;
  elementItems.forEach((item) => {
      truncated = item.textContent;
      if (truncated.length > 27) {
          truncated = truncated.substr(0, 27);
          truncated += '...';
      }
      elementItems[i].textContent = truncated;
      i += 1;
  });

  // Get all dropdown elements
  const dropdown = document.querySelectorAll('.dropdown');
  // Create an array with them
  const dropdownItems = [].slice.call(dropdown);
  dropdownItems.forEach((item) => {
  // Iterate through each element, toggling the class
    item.addEventListener('click', (event) => {
      event.stopPropagation();
      item.classList.toggle('is-active');
    });
  });


  // Get all "navbar-burger" elements
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  // Check if there are any navbar burgers
  if ($navbarBurgers.length > 0) {
    // Add a click event on each of them
    $navbarBurgers.forEach((el) => {
      el.addEventListener('click', () => {
      // Get the target from the "data-target" attribute
        const target = el.dataset.target;
        const $target = document.getElementById(target);
        // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
        el.classList.toggle('is-active');
        $target.classList.toggle('is-active');
      });
    });
  }

  const mainCateg = document.querySelectorAll('.main-categ');
  const secCateg = document.querySelectorAll('.sec-categ');
  const mainCategItems = [].slice.call(mainCateg);
  const secCategItems = [].slice.call(secCateg);
  mainCategItems.forEach((item, i) => {
    item.addEventListener('mouseover', (event) => {
      event.stopPropagation();
      secCategItems[i].style.display = 'block';
      secCategItems.forEach((item, j) => {
        if (j != i) {
          item.style.display = 'none';
        }
      });
    });
    // item.addEventListener('mouseout', (event) => {
    //   event.stopPropagation();
    //   secCategItems[i].style.display = 'none';
    // });
  });
  secCategItems.forEach((item, i) => {
    item.addEventListener('mouseover', (event) => {
      event.stopPropagation();
      secCategItems[i].style.display = 'block';
      mainCategItems[i].classList.add('active');
      secCategItems.forEach((item, j) => {
        if (j != i) {
          item.style.display = 'none';
          mainCategItems[j].classList.remove('active');
        }
      });
    });
    // item.addEventListener('mouseout', (event) => {
    //   event.stopPropagation();
    //   secCategItems[i].style.display = 'none';
    //   mainCategItems[i].classList.remove('active');
    // });
  });

  let user = document.getElementById('hiddenUsername');
  if(user) {
    if (user.textContent.length > 20) {
        user.textContent = user.textContent.substr(0, 20);
        user.textContent += '...';
    }
  const userName = document.querySelectorAll('.username');
  const userNameItems = [].slice.call(userName);
  userNameItems.forEach((item) => {
      item.textContent = user.textContent;
  });
  user.remove();
  }
});

// On ready
document.addEventListener("DOMContentLoaded", function() {
  
  // Create cookie function
  function createCookie(name, value, days) {
      var expires;
      if (days) {
          var date = new Date();
          date.setTime(date.getTime()+(days*24*60*60*1000));
          expires = "; expires="+date.toGMTString();
      }
      else {
          expires = "";
      }
      document.cookie = name+"="+value+expires+"; path=/";
  }

  // Reading cookies function
  function readCookie(name) {
      var nameEQ = name + "=";
      var ca = document.cookie.split(';');
      for(var i = 0; i < ca.length; i += 1) {
          var c = ca[i];
          while (c.charAt(0) === ' ') {
              c = c.substring(1,c.length);
          }
          if (c.indexOf(nameEQ) === 0) {
              return c.substring(nameEQ.length,c.length);
          }
      }
      return null;
  }
  
  // Selectors
  var cookiePolicy      = document.querySelector('.cookiePolicy');
  var closeCookiePolicy = cookiePolicy.querySelector('.cookiePolicy__close');
  var closeCookiePolicyAccept = cookiePolicy.querySelector('.cookiePolicy__close__button');
  var hasCookie         = readCookie("visited"); 
  
  // If the 'visited' cookie isn't set, show the popunder after 2 seconds
  if (!hasCookie) { 
    setTimeout(function(){
      cookiePolicy.classList.add('is-active');
    }, 2000);
  } else {
    cookiePolicy.parentNode.removeChild(cookiePolicy);
  }
  
  // On clicking the popunder, hide it and set the cookie so we don't show it until 365 days
  closeCookiePolicy.addEventListener('click', function(e){
    e.preventDefault();
    cookiePolicy.classList.remove('is-active');
    cookiePolicy.parentNode.removeChild(cookiePolicy);
    createCookie("visited", true, 365);
  });

  closeCookiePolicyAccept.addEventListener('click', function(e){
    e.preventDefault();
    cookiePolicy.classList.remove('is-active');
    cookiePolicy.parentNode.removeChild(cookiePolicy);
    createCookie("visited", true, 365);
  });
});

// Truncating - unused yet, going to use it for product names
// document.addEventListener('DOMContentLoaded', () => {
//   const element = document.querySelectorAll('.slidetext');
//   const elementItems = [].slice.call(element);
//   let truncated;
//   let i = 0;
//   elementItems.forEach((item) => {
//     truncated = item.textContent;
//     if (truncated.length > 97) {
//       truncated = truncated.substr(0, 97);
//       truncated += '...';
//     }
//     elementItems[i].textContent = truncated;
//     i += 1;
//   });
// });

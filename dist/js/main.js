document.addEventListener('DOMContentLoaded', () => {
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
    });
    item.addEventListener('mouseout', (event) => {
      event.stopPropagation();
      secCategItems[i].style.display = 'none';
    });
  });
  secCategItems.forEach((item, i) => {
    item.addEventListener('mouseover', (event) => {
      event.stopPropagation();
      secCategItems[i].style.display = 'block';
    });
    item.addEventListener('mouseout', (event) => {
      event.stopPropagation();
      secCategItems[i].style.display = 'none';
    });
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

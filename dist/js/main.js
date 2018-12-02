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


});

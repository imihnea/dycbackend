document.addEventListener("DOMContentLoaded", function() {

    var dropdown = document.querySelector('.dropdown');
    dropdown.addEventListener('click', function(event) {
    event.stopPropagation();
    dropdown.classList.toggle('is-active');
    });

    var burger = document.querySelector('.navbar-burger');
    burger.addEventListener('click', function(event) {
    event.stopPropagation();
    burger.classList.toggle('is-active');
    });

});

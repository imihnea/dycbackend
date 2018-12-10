function truncateText(selector, maxLength) {
  const element = document.querySelector(selector);
  let truncated = element.innerText;

  if (truncated.length > maxLength) {
    truncated = truncated.substr(0, maxLength);
    truncated += '...';
  }
  return truncated;
}

// Non-automated slider; will use on product page
// document.querySelector('p').innerText = truncateText('p', 500);
// let slideIndex = 1;
// function showSlides(n) {
//   let i;
//   const slides = document.getElementsByClassName("mySlides");
//   const dots = document.getElementsByClassName("dot");
//   if (n > slides.length) { slideIndex = 1; }
//   if (n < 1) { slideIndex = slides.length; }
//   for (i = 0; i < slides.length; i += 1) {
//     slides[i].style.display = 'none';
//   }
//   for (i = 0; i < dots.length; i += 1) {
//     dots[i].className = dots[i].className.replace(' active', '');
//   }
//   slides[slideIndex - 1].style.display = 'block';
//   dots[slideIndex - 1].className += ' active';
// }
// function plusSlides(n) {
//   showSlides(slideIndex += n);
// }

// function currentSlide(n) {
//   showSlides(slideIndex = n);
// }

// showSlides(slideIndex);

let slideIndex = 0;

function plusSlides(n) {
  slideIndex += n;
  showSlides();
}

function currentSlide(n) {
  slideIndex = n;
  showSlides();
}

function showSlides() {
  let i;
  const slides = document.getElementsByClassName('mySlides');
  const dots = document.getElementsByClassName('dot');
  for (i = 0; i < slides.length; i += 1) {
    slides[i].style.display = 'none';
  }
  slideIndex += 1;
  if (slideIndex > slides.length) { slideIndex = 1; }
  for (i = 0; i < dots.length; i += 1) {
    dots[i].className = dots[i].className.replace(' active', '');
  }
  slides[slideIndex - 1].style.display = 'block';
  dots[slideIndex - 1].className += ' active';
  setTimeout(showSlides, 2000); // Change image every 2 seconds
}

showSlides();

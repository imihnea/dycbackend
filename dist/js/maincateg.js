document.addEventListener('DOMContentLoaded', () => {
  // Get subcategory elements as an array of elements
  const paragraph = document.querySelectorAll('.sub_name');
  const paragraphItems = [].slice.call(paragraph);
  // Split words
  let i = 0;
  paragraphItems.forEach((item) => {
    const words = item.textContent.split(/(?=[A-Z])/);
    paragraphItems[i].textContent = words.join(' ');
    i += 1;
  });
  // Return modified elements
  return paragraph;
});

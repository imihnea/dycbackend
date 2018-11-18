document.addEventListener("DOMContentLoaded", function() {

    // Get subcategory elements as an array of elements
    var paragraph = document.querySelectorAll('.sub_name');
    paragraphItems = [].slice.call(paragraph);
    // Split words
    var i = 0;
    paragraphItems.forEach(function(item){
        var words = item.textContent.split(/(?=[A-Z])/);
        paragraphItems[i].textContent = words.join(' ');
        i++;        
    });
    // Return modified elements
    return paragraph;
});
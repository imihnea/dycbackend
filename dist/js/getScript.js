$(function() {
    // Use geodata script only when needed
    let k = 0;
    $("#countryId").hover(function(){
        if (k == 0) {
            k = 1;
            $.getScript("//geodata.solutions/includes/countrystatecity.js");
        }
    });   
});
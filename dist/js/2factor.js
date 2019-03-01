document.addEventListener('DOMContentLoaded', () => {
    let input = document.querySelector("#telephone");
    let iti = window.intlTelInput(input, {
        utilsScript: "../../dist/js/utils.js"
    });
    input.addEventListener('countrychange', () => {
        input.value = iti.getSelectedCountryData().dialCode;
    });
});
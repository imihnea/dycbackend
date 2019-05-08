document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('deliverySelect');
    select.addEventListener('change', () => {
        if(select.value == 'Shipping') {
            document.getElementById("shipping").style.display = "block";
            document.getElementById("facetoface").style.display = "none";
        } else if(select.value == 'Face to Face') {
            document.getElementById("shipping").style.display = "none";
            document.getElementById("facetoface").style.display = "block";
        } else {
            document.getElementById("shipping").style.display = "none";
            document.getElementById("facetoface").style.display = "none";
        }
    });
    // const getValue = document.getElementById("deliverySelect").value;
});

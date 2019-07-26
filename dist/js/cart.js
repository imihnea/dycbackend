document.addEventListener('DOMContentLoaded', () => {
    const qty = document.querySelectorAll('.qty');
    const qtyItems = [].slice.call(qty);
    let formQty = [];
    qtyItems.forEach((item, i) => {
        formQty.push(document.getElementById(`qty${i}`));
    });
    const prices = document.querySelectorAll('.priceVal');
    const priceItems = [].slice.call(prices);
    const totalPrice = document.getElementById('totalPrice');
    qtyItems.forEach((item, index) => {
        item.addEventListener('change', () => {
            formQty[index].value = item.value;
            totalPrice.value = 0;
            for (let i = 0; i < qtyItems.length; i += 1) {
                totalPrice.value = Number(totalPrice.value) + Number((priceItems[i].value * qtyItems[i].value).toFixed(8));
                totalPrice.value = Number(parseFloat(totalPrice.value).toFixed(8));
            }
        });
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const qty = document.querySelectorAll('.qty');
    const qtyItems = [].slice.call(qty);
    let formQty = [];
    qtyItems.forEach((item, i) => {
        formQty.push(document.getElementById(`qty${i}`));
    });
    const prices = document.querySelectorAll('.priceVal');
    const priceItems = [].slice.call(prices);
    const usdPrices = document.querySelectorAll('.usdPriceVal');
    const usdPriceItems = [].slice.call(usdPrices);
    const totalPrice = document.getElementById('totalPrice');
    const totalUsdPrice = document.getElementById('totalPriceUSD');
    qtyItems.forEach((item, index) => {
        item.addEventListener('change', () => {
            formQty[index].value = item.value;
            totalPrice.value = 0;
            totalUsdPrice.value = 0;
            for (let i = 0; i < qtyItems.length; i += 1) {
                totalPrice.value = Number(totalPrice.value) + Number((priceItems[i].value * qtyItems[i].value).toFixed(8));
                totalPrice.value = Number(parseFloat(totalPrice.value).toFixed(8));
                totalUsdPrice.value = Number(totalUsdPrice.value) + Number((usdPriceItems[i].value * qtyItems[i].value).toFixed(8));
                totalUsdPrice.value = Number(parseFloat(totalUsdPrice.value).toFixed(8));
            }
        });
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const prices = [
        Number(document.getElementById('btcTokenPrice').innerHTML),
    ];
    const inputTokens = document.querySelectorAll('.inputTokens');
    const inputTokenItems = [].slice.call(inputTokens);
    const tPrice = document.querySelectorAll('.tPrice');
    const tPriceItems = [].slice.call(tPrice);
    inputTokenItems.forEach((item, i) => {
        item.addEventListener('change', () => {
            tPriceItems[i].innerHTML = prices[i] * Number(item.value);
        });
    });
});
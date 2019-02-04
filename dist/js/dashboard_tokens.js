document.addEventListener('DOMContentLoaded', () => {
    const prices = [
        Number(document.getElementById('btcTokenPrice').innerHTML),
        Number(document.getElementById('bchTokenPrice').innerHTML),
        Number(document.getElementById('ethTokenPrice').innerHTML),
        Number(document.getElementById('ltcTokenPrice').innerHTML),
        Number(document.getElementById('dashTokenPrice').innerHTML)
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
document.addEventListener('DOMContentLoaded', () => {
    const price = Number(document.getElementById('btcTokenPrice').innerHTML);
    const inputTokens = document.querySelector('.inputTokens');
    const tPrice = document.querySelector('.tPrice');
    inputTokens.addEventListener('change', () => {
        tPrice.innerHTML = (price * Number(inputTokens.value)).toFixed(8);
    });
});

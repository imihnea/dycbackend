document.addEventListener('DOMContentLoaded', () => {
    const element = document.querySelectorAll('.dealname');
    const elementItems = [].slice.call(element);
    let truncated;
    let i = 0;
    elementItems.forEach((item) => {
        truncated = item.textContent;
        if (truncated.length > 200) {
            truncated = truncated.substr(0, 200);
            truncated += '...';
        }
        elementItems[i].textContent = truncated;
        i += 1;
    });
});

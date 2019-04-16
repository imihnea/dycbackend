document.addEventListener('DOMContentLoaded', () => {
    let firstCat = document.getElementById('firstCategory');
    let secondCat = document.getElementById('secondCategory');
    let timeframe = document.getElementById('timeframe');
    let csrfToken = document.getElementById('csrfToken');
    let csrfSecret = document.getElementById('csrfSecret');
    const chart = document.getElementById('chart');

    firstCat.addEventListener('change', () => {
      secondCat.innerHTML = '<option disabled selected>Secondary Category</option> <option value="All">All Categories</option>';
      Categories.forEach((item) => {
        if (firstCat.value == item.name) {
          item.opt.forEach((option) => {
            secondCat.innerHTML += `<option value="${option}">${option}</option>`;
          }); 
        }
      });
    });

    const searchBtn = document.getElementById('search');
    searchBtn.addEventListener('click', () => {
        fetch(`http://localhost:8080/dashboard/premium/getData/${csrfToken.value}/${csrfSecret.value}/${firstCat.value}/${secondCat.value}/${timeframe.value}`, {
            method: "GET",
        })
        .then(async (response) => {
            if(response.ok) {
                const res = await response.clone().json();  
                const labels = Object.keys(res);
                const series = Object.values(res);
                if (chart.classList.contains('hide')) {
                    chart.classList.remove('hide');
                }
                new Chartist.Bar('.ct-chart', {
                    labels,
                    series
                  }, {
                    distributeSeries: true
                });
            }
            throw new Error('Request failed.');
        });
    });
});

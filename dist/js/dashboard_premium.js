 document.addEventListener('DOMContentLoaded', () => {
   let csrfToken = document.getElementById('csrfToken');
   let csrfSecret = document.getElementById('csrfSecret');
   let ctx = document.getElementById('categChart');
   let ctxProd = document.getElementById('prodChart');
   let ctxProdSold = document.getElementById('prodSoldChart');
   let categChart = null;
   let prodChart = null;
   let prodSoldChart = null;
   
    const triggers = document.querySelectorAll('.tabTrigger');
    const triggerItems = [].slice.call(triggers);
    const analytics = document.querySelectorAll('.analytics');
    const analyticsItems = [].slice.call(analytics);

    triggerItems.forEach((item, i) => {
      item.addEventListener('click', () => {
        for (let j = 0; j < triggerItems.length; j += 1) {
          if ((j != i) && (triggerItems[j].classList.contains('is-active'))) {
            triggerItems[j].classList.remove('is-active');
            analyticsItems[j].classList.add('hide');
          }
        }
        if (!item.classList.contains('is-active')) {
          item.classList.add('is-active');
          analyticsItems[i].classList.remove('hide');
        }
      });
    })

    const randomColors = () => {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      return `rgb(${r}, ${g}, ${b})`;
    }

    const searchCategBtn = document.getElementById('searchCateg');
    searchCategBtn.addEventListener('click', () => {
      let firstCat = document.getElementById('firstCategory');
      let timeframe = document.getElementById('timeframe');
      fetch(`http://localhost:8080/dashboard/premium/getData/${csrfToken.value}/${csrfSecret.value}/${firstCat.value}/${timeframe.value}`, {
          method: "GET",
      })
      .then(async (response) => {
          if(response.ok) {
              const res = await response.clone().json();  
              const labels = Object.keys(res);
              const series = Object.values(res);
              let colors = [];
              series.forEach(() => {
                colors.push(randomColors());
              });
              if (categChart == null) {
                categChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            data: series,
                            backgroundColor: colors,
                            borderColor: 'rgba(200, 200, 200, 0.75)',
                            hoverBorderColor: 'rgba(200, 200, 200, 1)',
                        }]
                    },
                    options: {
                        legend: {
                          display: false
                        },
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true,
                                    stepSize: 10
                                }
                            }]
                        }
                    }
                });
              } else {
                document.getElementById('categChart').remove();
                document.getElementById('canvasContainer').innerHTML = '<canvas id="categChart" width="400" height="200" style="width: 90%; margin-top: 2vh; padding-left: 2vw; padding-right: 2vw;"></canvas>';
                ctx = document.getElementById('categChart');
                categChart = new Chart(ctx, {
                  type: 'bar',
                  data: {
                      labels,
                      datasets: [{
                          data: series,
                          backgroundColor: colors,
                          borderColor: 'rgba(200, 200, 200, 0.75)',
                          hoverBorderColor: 'rgba(200, 200, 200, 1)',
                      }]
                  },
                  options: {
                      legend: {
                        display: false
                      },
                      scales: {
                          yAxes: [{
                              ticks: {
                                  beginAtZero: true,
                                  stepSize: 10
                              }
                          }]
                      }
                  }
                });
              }
              if (ctx.classList.contains('hide')) {
                ctx.classList.remove('hide');
              }
              return
          }
          throw new Error('Request failed.');
      });
    });

    const searchProdBtn = document.getElementById('searchProd');
    searchProdBtn.addEventListener('click', () => {
      let firstCat = document.getElementById('firstCategoryProd');
      let timeframe = document.getElementById('timeframeProd');
      fetch(`http://localhost:8080/dashboard/premium/getProductData/${csrfToken.value}/${csrfSecret.value}/${firstCat.value}/${timeframe.value}`, {
            method: "GET",
        })
        .then(async (response) => {
            if(response.ok) {
                const res = await response.clone().json();  
                const labels = Object.keys(res);
                const series = Object.values(res);
                let colors = [];
                series.forEach(() => {
                  colors.push(randomColors());
                })
                if (prodChart == null) {
                  prodChart = new Chart(ctxProd, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            data: series,
                            backgroundColor: colors,
                            borderColor: 'rgba(200, 200, 200, 0.75)',
                            hoverBorderColor: 'rgba(200, 200, 200, 1)',
                        }]
                    },
                    options: {
                        legend: {
                          display: false
                        },
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true,
                                    stepSize: 10
                                }
                            }]
                        }
                    }
                });
                } else {
                  document.getElementById('prodChart').remove();
                  document.getElementById('prodCanvasContainer').innerHTML = '<canvas id="prodChart" width="400" height="200" style="width: 90%; margin-top: 2vh; padding-left: 2vw; padding-right: 2vw;"></canvas>';
                  ctxProd = document.getElementById('prodChart');
                  prodChart = new Chart(ctxProd, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            data: series,
                            backgroundColor: colors,
                            borderColor: 'rgba(200, 200, 200, 0.75)',
                            hoverBorderColor: 'rgba(200, 200, 200, 1)',
                        }]
                    },
                    options: {
                        legend: {
                          display: false
                        },
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true,
                                    stepSize: 10
                                }
                            }]
                        }
                    }
                  });
                }
                if (ctxProd.classList.contains('hide')) {
                  ctxProd.classList.remove('hide');
                  document.getElementById('prodText').classList.remove('hide');
                }
                return
            }
            throw new Error('Request failed.');
        });

      fetch(`http://localhost:8080/dashboard/premium/getProductSoldData/${csrfToken.value}/${csrfSecret.value}/${firstCat.value}/${timeframe.value}`, {
          method: "GET",
      })
      .then(async (response) => {
          if(response.ok) {
              const res = await response.clone().json();  
              const labels = Object.keys(res);
              const series = Object.values(res);
              let colors = [];
              series.forEach(() => {
                colors.push(randomColors());
              })
              if (prodSoldChart == null) {
                  prodSoldChart = new Chart(ctxProdSold, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            data: series,
                            backgroundColor: colors,
                            borderColor: 'rgba(200, 200, 200, 0.75)',
                            hoverBorderColor: 'rgba(200, 200, 200, 1)',
                        }]
                    },
                    options: {
                        legend: {
                          display: false
                        },
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true,
                                    stepSize: 1
                                }
                            }]
                        }
                    }
                });
                if (ctxProdSold.classList.contains('hide')) {
                  ctxProdSold.classList.remove('hide');
                  document.getElementById('prodSoldText').classList.remove('hide');
                }
              } else {
                document.getElementById('prodSoldChart').remove();
                document.getElementById('prodSoldCanvasContainer').innerHTML = '<canvas id="prodSoldChart" width="400" height="200" style="width: 90%; margin-top: 2vh; padding-left: 2vw; padding-right: 2vw;"></canvas>';
                ctxProdSold = document.getElementById('prodSoldChart');
                prodSoldChart = new Chart(ctxProdSold, {
                  type: 'bar',
                  data: {
                      labels,
                      datasets: [{
                          data: series,
                          backgroundColor: colors,
                          borderColor: 'rgba(200, 200, 200, 0.75)',
                          hoverBorderColor: 'rgba(200, 200, 200, 1)',
                      }]
                  },
                  options: {
                      legend: {
                        display: false
                      },
                      scales: {
                          yAxes: [{
                              ticks: {
                                  beginAtZero: true,
                                  stepSize: 1
                              }
                          }]
                      }
                  }
                });
              }
              return
          }
          throw new Error('Request failed.');
      });
    });
});

document.addEventListener('DOMContentLoaded', () => {
  const currentLocation = window.location.pathname;
  switch (currentLocation) {
    case ('/dashboard'): {
      document.querySelector('#settings').classList.add('active-page');
      break;
    }
    case ('/dashboard/addresses'): {
      document.querySelector('#addresses').classList.add('active-page');
      break;
    }
    case ('/dashboard/addresses/btc'): {
      document.querySelector('#addresses').classList.add('active-page');
      break;
    }
    case ('/messages/'): {
      document.querySelector('#messages').classList.add('active-page');
      break;
    }
    case ('/dashboard/tokens'): {
      document.querySelector('#tokens').classList.add('active-page');
      break;
    }
    case ('/dashboard/new'): {
      document.querySelector('#new').classList.add('active-page');
      break;
    }
    case ('/dashboard/closed'): {
      document.querySelector('#closed').classList.add('active-page');
      break;
    }
    case ('/dashboard/purchases'): {
      document.querySelector('#purchases').classList.add('active-page');
      break;
    }
    case ('/dashboard/open'): {
      document.querySelector('#open').classList.add('active-page');
      break;
    }
    case ('/dashboard/ongoing'): {
      document.querySelector('#ongoing').classList.add('active-page');
      break;
    }
    case ('/dashboard/premium'): {
      document.querySelector('#premium').classList.add('active-page');
      break;
    }
    default: {
      break;
    }
  }

  const burgers = Array.prototype.slice.call(document.getElementsByClassName('.navbar-burger .dashboardBurger'), 0);
  if (burgers.length > 0) {
    burgers.forEach((el) => {
      el.addEventListener('click', () => {
        const target = el.dataset.target;
        const $target = document.getElementById(target);
        el.classList.toggle('is-active');
        $target.classList.toggle('is-active');
      });
    });
  }
});

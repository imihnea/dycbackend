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
    default: {
      break;
    }
  }
});

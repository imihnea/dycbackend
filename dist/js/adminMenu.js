document.addEventListener('DOMContentLoaded', () => {
    const currentLocation = window.location.pathname;
    switch (currentLocation) {
      case ('/admin'): {
        document.querySelector('#currency').classList.add('is-active');
        break;
      }
      case ('/admin/users'): {
        document.querySelector('#users').classList.add('is-active');
        break;
      }
      case ('/admin/reports'): {
        document.querySelector('#reports').classList.add('is-active');
        break;
      }
      case ('/admin/disputes'): {
        document.querySelector('#disputes').classList.add('is-active');
        break;
      }
      case ('/admin/blog'): {
        document.querySelector('#blog').classList.add('is-active');
        break;
      }
      case ('/admin/bulkAdd'): {
        document.querySelector('#bulkadd').classList.add('is-active');
        break;
      }
      default: {
        break;
      }
    }
});
  
(function() {
  const email = localStorage.getItem('stackly-email');
  const role = localStorage.getItem('stackly-role');
  
  // Extract file name from url path
  const path = window.location.pathname;
  const page = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

  const isDashboardPage = page.startsWith('dashboard-');
  const isAdminPage = page.startsWith('dashboard-admin-');
  const isUserPage = isDashboardPage && !isAdminPage;
  
  if (isDashboardPage) {
    if (!email) {
      // Not logged in: redirect to login
      window.location.href = 'index.html';
      return;
    }

    // Role-based page security verification
    if (isAdminPage && role !== 'admin') {
      // Normal user trying to access admin dashboard page
      window.location.href = 'dashboard-overview.html';
    } else if (isUserPage && role === 'admin') {
      // Admin trying to access user page
      window.location.href = 'dashboard-admin-overview.html';
    }
  } else {
    // No redirect on auth pages to allow direct access (e.g. from dashboard links)
  }
})();

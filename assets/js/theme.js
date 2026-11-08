try { document.documentElement.dataset.theme = localStorage.getItem('smart-support-hub:theme') === 'dark' ? 'dark' : 'light'; }
catch { document.documentElement.dataset.theme = 'light'; }

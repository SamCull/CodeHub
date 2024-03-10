document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Failed to log in');
    }
  })
  .then(data => {
    if (data.message === "Logged in successfully") {
      localStorage.setItem('user', data.username); // Store username
      window.location.href = '/homepage.html'; // Redirect to homepage
    } else {
      alert('Login failed: ' + data.message);
    }
  })
  .catch(error => {
    console.error('Error during login:', error);
    alert('Login failed: ' + error.message);
  });
});

/**
 * @brief Handles the user login process.
 *
 * This function captures the user's email and password from the login form,
 * sends these credentials to the server for validation, and handles the server's response.
 * If the login is successful, the user is redirected to the homepage. Otherwise,
 * an error message is displayed.
 *
 * @param None
 * @return None
 */
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
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
  .then(response => response.json())
  .then(data => {
    if (data.message === "Logged in successfully") {
      alert('Login successful');
      // Redirect to homepage or other actions
    } else {
      alert('Login failed');
    }
  })
  .catch(error => {
    console.error('Error during login:', error);
  });
});

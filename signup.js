document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
  
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    fetch('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === "User created successfully") {
        // Redirect to login page or homepage
        window.location.href = '/login.html'; // Adjust the path as needed
      } else {
        // Handle errors, show messages to the user
        console.error('Signup failed:', data.message);
        alert('Signup failed: ' + data.message);
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  });
  
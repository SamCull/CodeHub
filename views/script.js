document.addEventListener('DOMContentLoaded', function() {
    var a = document.getElementById("loginBtn");
    var b = document.getElementById("registerBtn");
    var x = document.getElementById("login");
    var y = document.getElementById("register");

    function login() {
        x.style.left = "4px";
        y.style.right = "-520px";
        a.classList.add("white-btn");
        b.classList.remove("white-btn");
        x.style.opacity = 1;
        y.style.opacity = 0;
    }

    function register() {
        x.style.left = "-510px";
        y.style.right = "5px";
        a.classList.remove("white-btn");
        b.classList.add("white-btn");
        x.style.opacity = 0;
        y.style.opacity = 1;
    }

    async function registerUser(event) {
        event.preventDefault();

        const firstname = document.querySelector('[name="firstname"]').value;
        const lastname = document.querySelector('[name="lastname"]').value;
        const email = document.querySelector('[name="email"]').value;
        const password = document.querySelector('[name="password"]').value;

        // Send registration data to the server
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ firstname, lastname, email, password }),
        });

        // Check if registration was successful
        if (response.ok) {
            // Redirect to the success page or handle as needed
            window.location.href = 'success.html';
        } else {
            // Handle registration error
            window.location.href = 'error.html';
        }
    }

    function myMenuFunction() {
        var i = document.getElementById("navMenu");

        if (i.className === "nav-menu") {
            i.classList.add("responsive");
        } else {
            i.classList.remove("responsive");
        }
    }

    // Attach event listeners
    a.addEventListener("click", login);
    b.addEventListener("click", register);
    document.getElementById("navMenu").addEventListener("click", myMenuFunction);
    document.querySelector('[name="register-form"]').addEventListener("submit", registerUser);
});

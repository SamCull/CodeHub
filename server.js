const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// MongoDB connection setup
mongoose.connect("mongodb://localhost:27017/accounts", { useNewUrlParser: true, useUnifiedTopology: true });

const tutSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
});

const User = mongoose.model('User', tutSchema);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (if needed)
app.use(express.static('public'));

// Handle registration endpoint for both GET and POST requests
app.route('/register')
    .get((req, res) => {
        // Handle GET request (if needed)
        // For example, you can send a registration form page
        res.send('Registration form page');
    })
    .post(async (req, res) => {
        try {
            const { firstname, lastname, email, password } = req.body;

            // Create a new user in MongoDB
            const newUser = new User({ firstname, lastname, email, password });
            await newUser.save();

            // Send success response
            res.status(200).send('Registration successful');
        } catch (error) {
            console.error('Registration failed', error);
            // Send error response
            res.status(500).send('Internal Server Error');
        }
    });

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const fs = require("fs");
const { JSDOM } = require('jsdom');
const path = require("path");
const mongoose = require('mongoose');
const session = require('express-session');

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/CodeHub');
var db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error"));
db.once('open', () => {
    console.log("connection succeeded");
});

// Models
const questionSchema = new mongoose.Schema({
    name: String,
    file_name: String,
    last_updated: { type: Date, default: Date.now }
});

const Question = mongoose.model('Question', questionSchema);

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    score: Number,
    lastUpdated: { type: Date, default: Date.now },
    completedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }] // Adding this array to track completed questions
});

const User = mongoose.model('User', userSchema, 'details');

// Express App Setup
const app = express();
app.use(session({
    secret: 'your_secret_key', // You should replace this with an actual secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Should be true in production with HTTPS
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/codemirror-5.65.16", express.static(path.join(__dirname, "codemirror-5.65.16")));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'static')));
app.use('/challenges', express.static(path.join(__dirname, 'challenges')));

// // Serve static files
// app.use("/codemirror-5.65.16", express.static("C:/del/Impact/codemirror-5.65.16"));
// app.use(express.static('public'));
// // Serve static files from 'static' directory
// app.use(express.static('static'));

// // Additionally serve 'java1.html' and other files from 'challenges' directory
// app.use('/challenges', express.static('challenges'));



/**
 * @file app.js
 * @brief Handles user registration.
 *
 * This route handles user sign-up requests. It receives the user's name, email, and password
 * from the request body, formats the name to capitalize the first letter, and inserts the new user
 * record into the 'details' database collection. Upon successful insertion, the client is redirected
 * to the login page.
 *
 * @param req The request object, containing the user's name, email, and password.
 * @param res The response object used to reply to the client.
 * 
 * @return None. Directly interacts with the database and redirects upon completion:
 *         - Redirects to 'login.html' after successful user registration.
 *         - Throws an error and logs it if there is a problem with the database insertion.
 */
app.post('/sign_up', function(req,res){
	var name = req.body.name;
	var email = req.body.email;
	var pass = req.body.password;

        // Capitalize the first letter of the name
        name = name.charAt(0).toUpperCase() + name.slice(1);

	var data = {
		"name": name,
		"email":email,
		"password":pass,
		 "score": 0,
         "lastUpdated": "",
         "completedQuestions": [],

	}
db.collection('details').insertOne(data,function(err, collection){
		if (err) throw err;
		console.log("Record inserted Successfully");
			
	});
		
	return res.redirect('login.html');
})


/**
 * @file app.js
 * @brief Handles user login.
 *
 * This function processes user login requests by checking the credentials against the database.
 * If the credentials are valid, it stores user information in the session and returns a success message.
 * If the credentials are invalid, it redirects to an error page.
 *
 * @param req The request object, containing the user's email and password.
 * @param res The response object used to reply to the client.
 * 
 * @return None. Responses are sent via the res object:
 *         - Sends a JSON response with a success message and the username if login is successful.
 *         - Redirects to '/invalidCredentials.html' if credentials are invalid.
 *         - Returns a 500 status with an 'Internal Server Error' message on server error.
 */
app.post('/login', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;

    db.collection('details').findOne({ email: email, password: password }, function(err, user) {
        if (err) {
            console.log(err);
            return res.status(500).send('Internal Server Error');
        }
        if (!user) {
            return res.redirect('/invalidCredentials.html');
        }

        // Store user information in session
        console.log(req.session.user); // Add this to log the user info in the session
        req.session.user = user;
        res.send({ message: "Logged in successfully", username: user.name });
    });
});


// Ensure the 'users' directory exists
const usersDir = path.join(__dirname, 'users');
if (!fs.existsSync(usersDir)){
    fs.mkdirSync(usersDir);
}



/**
 * @brief Handles the creation of the 'multiples.py' file and runs its unit tests.
 * 
 * This route captures code submitted via POST request, writes it to 'multiples.py',
 * and executes unit tests on it. If tests pass, it checks if the user has previously
 * completed this question and updates their score accordingly.
 *
 * @param req The request object, containing the submitted code and user session data.
 * @param res The response object used to reply to the client with test results or errors.
 * 
 * @return Returns a JSON object with the result message and, if successful, the updated lastUpdated timestamp.
 */
app.post('/create-multiples-file', async (req, res) => {
    const functionCode = req.body.code || '';
    const userEmail = req.session.user.email; // Ensure the user is logged in and get their email.

    // Save the submitted code into the users directory
    fs.writeFileSync(path.join(usersDir, 'multiples.py'), functionCode);

    // Run the tests and capture output
    exec('python -m unittest tests.test_multiples', { cwd: __dirname }, async (error, stdout, stderr) => {
        let message;
        if (error) {
            message = "Error executing tests";
            console.error(`exec error: ${error}`);
            return res.status(500).json({ message });
        } 

        // Attempt to parse the output
        const passedMatch = stdout.match(/Ran (\d+) tests? in .*\n\nOK/);
        const failedMatch = stdout.match(/Ran (\d+) tests? in .*\n\nFAILED \(failures=(\d+)\)/);
        let passed, failed, total;

        if (passedMatch) {
            total = parseInt(passedMatch[1], 10);
            passed = total;
            failed = 0;
        } else if (failedMatch) {
            total = parseInt(failedMatch[1], 10);
            failed = parseInt(failedMatch[2], 10);
            passed = total - failed;
        }

        // Format the response message
        if (passed === total) {
            // Check if the quiz has already been completed by the user
            const user = await User.findOne({ email: userEmail });
            const question = await Question.findOne({ file_name: 'py_multiples.html' });
            
            if (user.completedQuestions.includes(question._id)) {
                // User has already completed this quiz
                message = 'You have already completed this quiz.';
                return res.status(409).json({ message }); // Send a conflict status
            }

            // If the user hasn't completed the quiz, increment score and add quiz to completedQuestions
            const updateResult = await User.findOneAndUpdate(
                { email: userEmail },
                { 
                    $inc: { score: 1 },
                    $push: { completedQuestions: question._id },
                    $set: { lastUpdated: new Date() } // Update the lastUpdated date here
                },
                { new: true }
            );
            
            
            message = 'Score incremented successfully and quiz marked as completed.';
            return res.json({ 
                message,
            lastUpdated: updateResult.lastUpdated.toISOString() });
        } else {
            message = `${passed}/${total}: ${passed} test(s) passed, ${failed} failed`;
            res.json({ message });
        }
    });
}); //END MULTIPLES



/**
 * @brief Creates a 'fibonacci.py' file and executes its associated tests.
 *
 * This endpoint receives a block of code for the Fibonacci challenge through a POST request,
 * writes it to a file, and runs the provided unit tests. It evaluates the test results, updates
 * the user's score if all tests pass, and ensures that the question isn't marked as completed
 * more than once. It responds with the test outcomes or any errors encountered during execution.
 *
 * @param req The HTTP request object that carries the client's submitted code in the body 
 *            and the user's session data, including their email.
 * @param res The HTTP response object for sending back the test results or error messages.
 *
 * @return Sends a JSON response with the outcome message. If tests pass and the quiz is not
 *         already completed by the user, it updates the user's score and last updated timestamp
 *         and marks the quiz as completed.
 */
app.post('/create-fibonacci-file', async (req, res) => {
    const functionCode = req.body.code || '';
    const userEmail = req.session.user.email; // Ensure the user is logged in and get their email.

    // Save the submitted code into the users directory
    fs.writeFileSync(path.join(usersDir, 'fibonacci.py'), functionCode);

    // Run the tests and capture output
    exec('python -m unittest tests.test_fibonacci', { cwd: __dirname }, async (error, stdout, stderr) => {
        let message;
        if (error) {
            message = "Error executing tests";
            console.error(`exec error: ${error}`);
            return res.status(500).json({ message });
        } 

        // Attempt to parse the output
        const passedMatch = stdout.match(/Ran (\d+) tests? in .*\n\nOK/);
        const failedMatch = stdout.match(/Ran (\d+) tests? in .*\n\nFAILED \(failures=(\d+)\)/);
        let passed, failed, total;

        if (passedMatch) {
            total = parseInt(passedMatch[1], 10);
            passed = total;
            failed = 0;
        } else if (failedMatch) {
            total = parseInt(failedMatch[1], 10);
            failed = parseInt(failedMatch[2], 10);
            passed = total - failed;
        }

        // Format the response message
        if (passed === total) {
            // Check if the quiz has already been completed by the user
            const user = await User.findOne({ email: userEmail });
            const question = await Question.findOne({ file_name: 'py_fibonacci.html' });
            
            if (user.completedQuestions.includes(question._id)) {
                // User has already completed this quiz
                message = 'You have already completed this quiz.';
                return res.status(409).json({ message }); // Send a conflict status
            }

            // If the user hasn't completed the quiz, increment score and add quiz to completedQuestions
            const updateResult = await User.findOneAndUpdate(
                { email: userEmail },
                { 
                    $inc: { score: 1 },
                    $push: { completedQuestions: question._id },
                    $set: { lastUpdated: new Date() } // Update the lastUpdated date here
                },
                { new: true }
            );
            
            
            message = 'Score incremented successfully and quiz marked as completed.';
            return res.json({ 
                message,
            lastUpdated: updateResult.lastUpdated.toISOString() });
        } else {
            message = `${passed}/${total}: ${passed} test(s) passed, ${failed} failed`;
            res.json({ message });
        }
    });
}); //END FIBONACCI


/**
 * @brief Handles the creation and testing of 'smallestMultiple.py'.
 *
 * This endpoint processes a POST request containing Python code aimed at solving the smallest multiple problem. 
 * It saves the code into a user-specific file and runs predefined unit tests against it. Based on the results of 
 * the tests, it constructs a message indicating success or failure and updates the user's score if all tests pass.
 * It also ensures that the quiz is not marked completed more than once per user.
 *
 * @param req The HTTP request object containing the user's code and their session information.
 * @param res The HTTP response object for sending back the test outcomes and any additional messages.
 *
 * @return It returns a JSON object containing the result of the test execution, which includes a message detailing
 *         the number of tests passed and failed, or if all tests are passed, it increments the user's score and marks
 *         the question as completed along with the timestamp of the last update.
 */
app.post('/create-smallestMultiple-file', async (req, res) => {
    const functionCode = req.body.code || '';
    const userEmail = req.session.user.email; // Ensure the user is logged in and get their email.

    // Save the submitted code into the users directory
    fs.writeFileSync(path.join(usersDir, 'smallestMultiple.py'), functionCode);

    // Run the tests and capture output
    exec('python -m unittest tests.test_smallestMultiple', { cwd: __dirname }, async (error, stdout, stderr) => {
        let message;
        if (error) {
            message = "Error executing tests";
            console.error(`exec error: ${error}`);
            return res.status(500).json({ message });
        } 

        // Attempt to parse the output
        const passedMatch = stdout.match(/Ran (\d+) tests? in .*\n\nOK/);
        const failedMatch = stdout.match(/Ran (\d+) tests? in .*\n\nFAILED \(failures=(\d+)\)/);
        let passed, failed, total;

        if (passedMatch) {
            total = parseInt(passedMatch[1], 10);
            passed = total;
            failed = 0;
        } else if (failedMatch) {
            total = parseInt(failedMatch[1], 10);
            failed = parseInt(failedMatch[2], 10);
            passed = total - failed;
        }

        // Format the response message
        if (passed === total) {
            // Check if the quiz has already been completed by the user
            const user = await User.findOne({ email: userEmail });
            const question = await Question.findOne({ file_name: 'py_smallestMultiple.html' });
            
            if (user.completedQuestions.includes(question._id)) {
                // User has already completed this quiz
                message = 'You have already completed this quiz.';
                return res.status(409).json({ message }); // Send a conflict status
            }

            // If the user hasn't completed the quiz, increment score and add quiz to completedQuestions
            const updateResult = await User.findOneAndUpdate(
                { email: userEmail },
                { 
                    $inc: { score: 1 },
                    $push: { completedQuestions: question._id },
                    $set: { lastUpdated: new Date() } // Update the lastUpdated date here
                },
                { new: true }
            );
            
            const formattedDate = updateResult.lastUpdated.toISOString().substring(0, 10);
            
            message = 'Score incremented successfully and quiz marked as completed.';
            return res.json({ 
                message,
            lastUpdated: formattedDate });
        } else {
            message = `${passed}/${total}: ${passed} test(s) passed, ${failed} failed`;
            res.json({ message });
        }
    });
}); // END SMALLEST MULTIPLE




/**
 * @brief Endpoint to create a 'prime.py' file from submitted code and execute its tests.
 *
 * This POST endpoint takes Python code aimed at solving prime number related challenges from the request body.
 * It writes the code to a 'prime.py' file within the user's directory and initiates the test suite specific to prime numbers.
 * Should all tests pass and the challenge has not been previously completed by the user, the user's score is incremented.
 * It also ensures that a quiz cannot be completed more than once by the same user by checking against completedQuestions.
 *
 * @param req The HTTP request object, including the user's session for email and submitted code.
 * @param res The HTTP response object used for replying with the status of test execution and user score updates.
 *
 * @return On success, a JSON response is sent with a success message and last updated timestamp. On failure, it sends an
 *         error message with details of the failed tests or any server errors that occurred during test execution.
 */
app.post('/create-prime-file', async (req, res) => {
    const functionCode = req.body.code || '';
    const userEmail = req.session.user.email; // Ensure the user is logged in and get their email.

    // Save the submitted code into the users directory
    fs.writeFileSync(path.join(usersDir, 'prime.py'), functionCode);

    // Run the tests and capture output
    exec('python -m unittest tests.test_prime', { cwd: __dirname }, async (error, stdout, stderr) => {
        let message;
        if (error) {
            message = "Error executing tests";
            console.error(`exec error: ${error}`);
            return res.status(500).json({ message });
        } 

        // Attempt to parse the output
        const passedMatch = stdout.match(/Ran (\d+) tests? in .*\n\nOK/);
        const failedMatch = stdout.match(/Ran (\d+) tests? in .*\n\nFAILED \(failures=(\d+)\)/);
        let passed, failed, total;

        if (passedMatch) {
            total = parseInt(passedMatch[1], 10);
            passed = total;
            failed = 0;
        } else if (failedMatch) {
            total = parseInt(failedMatch[1], 10);
            failed = parseInt(failedMatch[2], 10);
            passed = total - failed;
        }

        // Format the response message
        if (passed === total) {
            // Check if the quiz has already been completed by the user
            const user = await User.findOne({ email: userEmail });
            const question = await Question.findOne({ file_name: 'py_prime.html' });
            
            if (user.completedQuestions.includes(question._id)) {
                // User has already completed this quiz
                message = 'You have already completed this quiz.';
                return res.status(409).json({ message }); // Send a conflict status
            }

            // If the user hasn't completed the quiz, increment score and add quiz to completedQuestions
            const updateResult = await User.findOneAndUpdate(
                { email: userEmail },
                { 
                    $inc: { score: 1 },
                    $push: { completedQuestions: question._id },
                    $set: { lastUpdated: new Date() } // Update the lastUpdated date here
                },
                { new: true }
            );
            
            
            message = 'Score incremented successfully and quiz marked as completed.';
            return res.json({ 
                message,
            lastUpdated: updateResult.lastUpdated.toISOString() });
        } else {
            message = `${passed}/${total}: ${passed} test(s) passed, ${failed} failed`;
            res.json({ message });
        }
    });
}); // END 10,0001ST PRIME



/**
 * @brief POST endpoint to evaluate palindrome code submissions.
 *
 * Receives code from the client intended to solve a palindrome-related challenge and 
 * writes it to a Python file. It runs a test suite for palindrome validation and 
 * provides feedback based on the test results. If the tests are passed and the challenge 
 * hasn't been previously solved by the user, it updates the user's score and records 
 * the challenge as completed. The route ensures each challenge is only completed once 
 * per user to maintain integrity of the scoring system.
 *
 * @param req The HTTP request object containing the user's code and session data.
 * @param res The HTTP response object for sending back the test results to the client.
 *
 * @return Responds with a JSON object detailing the outcome of the test execution.
 *         If all tests pass and the challenge has not been completed, it updates the 
 *         user's score and sets the challenge as completed with the current timestamp.
 */

app.post('/create-palindrome-file', async (req, res) => {
    const functionCode = req.body.code || '';
    const userEmail = req.session.user.email; // Ensure the user is logged in and get their email.

    // Save the submitted code into the users directory
    fs.writeFileSync(path.join(usersDir, 'palindrome.py'), functionCode);

    // Run the tests and capture output
    exec('python -m unittest tests.test_palindrome', { cwd: __dirname }, async (error, stdout, stderr) => {
        let message;
        if (error) {
            message = "Error executing tests";
            console.error(`exec error: ${error}`);
            return res.status(500).json({ message });
        } 

        // Attempt to parse the output
        const passedMatch = stdout.match(/Ran (\d+) tests? in .*\n\nOK/);
        const failedMatch = stdout.match(/Ran (\d+) tests? in .*\n\nFAILED \(failures=(\d+)\)/);
        let passed, failed, total;

        if (passedMatch) {
            total = parseInt(passedMatch[1], 10);
            passed = total;
            failed = 0;
        } else if (failedMatch) {
            total = parseInt(failedMatch[1], 10);
            failed = parseInt(failedMatch[2], 10);
            passed = total - failed;
        }

        // Format the response message
        if (passed === total) {
            // Check if the quiz has already been completed by the user
            const user = await User.findOne({ email: userEmail });
            const question = await Question.findOne({ file_name: 'py_palindrome.html' });
            
            if (user.completedQuestions.includes(question._id)) {
                // User has already completed this quiz
                message = 'You have already completed this quiz.';
                return res.status(409).json({ message }); // Send a conflict status
            }

            // If the user hasn't completed the quiz, increment score and add quiz to completedQuestions
            const updateResult = await User.findOneAndUpdate(
                { email: userEmail },
                { 
                    $inc: { score: 1 },
                    $push: { completedQuestions: question._id },
                    $set: { lastUpdated: new Date() } // Update the lastUpdated date here
                },
                { new: true }
            );

            
            if (updateResult && updateResult.lastUpdated) {
                // Ensure lastUpdated is a Date object
                const d = updateResult.lastUpdated;
                const formattedDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

                
                return res.json({
                  message: 'Score incremented successfully and quiz marked as completed.',
                  lastUpdated: formattedDate // Sending the formatted date string
                });
            }
        } else {
            message = `${passed}/${total}: ${passed} test(s) passed, ${failed} failed`;
            res.json({ message });
        }
    });
}); //END PALINDRONE



/**
 * @file app.js
 * @brief Handles score incrementation for authenticated users.
 *
 * This endpoint increments the score of an authenticated user by one. It checks if the user is 
 * currently logged in (i.e., present in the session). If not logged in, it responds with an 
 * unauthorized status. Otherwise, it updates the user's score in the database and sets the 
 * last updated date to today's date. It handles database errors and the condition where the 
 * specified user does not exist.
 *
 * @param req The request object, expecting a user session to be present.
 * @param res The response object used to send back the status and messages.
 * 
 * @return None. Responses are provided through the res object:
 *         - Returns a JSON response with a success message and the last updated date on successful score update.
 *         - Returns a 401 status with 'Unauthorized' if the user is not logged in.
 *         - Returns a 500 status with an error message if there's a server-side error during the database operation.
 *         - Returns a 404 status with 'User not found' if no record is updated in the database.
 */
app.post('/increment-score', function(req, res) {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const userEmail = req.session.user.email;
    const dateString = new Date().toISOString().substring(0, 10); // 'YYYY-MM-DD'

    db.collection('details').updateOne(
        { email: userEmail },
        { 
            $inc: { score: 1 },
            $set: { lastUpdated: dateString } // Set the last updated date as a string
        },
        function(err, result) {
            if (err) {
                console.error(err);
                res.status(500).json({ message: 'Error incrementing score' });
            } else if (result.modifiedCount === 0) {
                res.status(404).json({ message: 'User not found' });
            } else {
                res.json({
                    message: 'All tests passed. Score incremented successfully!',
                    lastUpdated: dateString // Send the date back in the response
                });
            }
        }
    );
});













/**
 * @file app.js
 * @brief Handles the compilation of code snippets.
 *
 * This route provides an API endpoint for compiling code snippets in C++, Java, and Python. 
 * It expects code, input (optional), and language from the request body. The route uses different 
 * compiler configurations based on the specified language and whether input is provided. It returns 
 * the compilation output or an error message if the compilation fails.
 *
 * @param req The request object, containing the code, optional input data, and language specification.
 * @param res The response object used to send back the compilation result or error messages.
 * 
 * @return None. Compilation results or errors are sent back through the res object:
 *         - On successful compilation, sends a JSON object containing the output.
 *         - On failure, sends a JSON object with "error" as the output.
 *         - Catches and logs any server-side exceptions that occur during the process.
 */
app.post("/compile", function (req, res) {
    // Extracting code, input, and language from the request body
    var code = req.body.code
    var input = req.body.input
    var lang = req.body.lang
    try {
        // Handling compilation for C++
        if (lang == "Cpp") {
            if (!input) {
                // Compiling C++ code without input
                var envData = { OS: "windows", cmd: "g++", options: { timeout: 10000 } };
                compiler.compileCPP(envData, code, function (data) {
                    if (data.output) {
                        res.send(data);
                    }
                    else {
                        res.send({ output: "error" })
                    }
                });
            }
            else {
                // Compiling C++ code with input
                var envData = { OS: "windows", cmd: "g++", options: { timeout: 10000 } };
                compiler.compileCPPWithInput(envData, code, input, function (data) {
                    if (data.output) {
                        res.send(data);
                    }
                    else {
                        res.send({ output: "error" })
                    }
                });
            }
        }
        // Handling compilation for Java
        else if (lang == "Java") {
            if (!input) {
                // Compiling Java code without input
                var envData = { OS: "windows" };
                compiler.compileJava(envData, code, function (data) {
                    if (data.output) {
                        res.send(data);
                    }
                    else {
                        res.send({ output: "error" })
                    }
                })
            }
            else {
                // Compiling Java code with input
                var envData = { OS: "windows" };
                compiler.compileJavaWithInput(envData, code, input, function (data) {
                    if (data.output) {
                        res.send(data);
                    }
                    else {
                        res.send({ output: "error" })
                    }
                })
            }
        }
        // Handling compilation for Python
        else if (lang == "Python") {

            // fs.writeFile("users/multiples.py", code, function(err) {
            //     if (err) {
            //         return console.log(err);
            //     }
            //     console.log("The file was saved!");
            // });
            
            if (!input) {
                // Compiling Python code without input
                var envData = { OS: "windows" };
                compiler.compilePython(envData, code, function (data) {
                    if (data.output) {
                        res.send(data);
                    }
                    else {
                        res.send({ output: "error" })
                    }
                });
            }
            else {
                // Compiling Python code with input
                var envData = { OS: "windows" };
                compiler.compilePythonWithInput(envData, code, input, function (data) {
                    if (data.output) {
                        res.send(data);
                    }
                    else {
                        res.send({ output: "error" })
                    }
                });
            }
        }
    }
    // Handling any potential errors
    catch (e) {
        console.log("error")
    }
})
// When adding new files
// db.once('open', async function () {
//     console.log("connection succeeded");
//     // The function can now be called since it's defined at the top level.
//     try {
//         await insertQuestionsFromHTML();
//         console.log("Questions inserted successfully");
//     } catch (error) {
//         console.error("Error inserting questions: ", error);
//     }
// });
db.once('open', function () {
    // Inside db.once('open', ...)
if (process.env.RUN_SETUP) {
    insertQuestionsFromHTML();
}

    console.log("Database connection successfully opened.");
});


// async function insertQuestionsFromHTML() {
//     const htmlFilePaths = ['challenges/./py_multiples.html', 'challenges/./py_prime.html' /* ... other file paths ... */];
//     for (const filePath of htmlFilePaths) {
//         const htmlContent = fs.readFileSync(filePath, 'utf8');
//         const dom = new JSDOM(htmlContent);
//         const title = dom.window.document.title; // Placeholder for actual title extraction logic
//         const newQuestion = new Question({
//             name: title,
//             file_name: path.basename(filePath),
//             last_updated: new Date()
//         });
//         await newQuestion.save();
//     }
//     console.log("Questions inserted successfully");
// }



async function insertQuestionsFromHTML() {
    // Assuming the 'challenges' folder is at the same level as your app.js in the project directory
    const baseDir = path.join(__dirname, 'challenges');  // __dirname is the directory of the current module, i.e., app.js
    const htmlFilePaths = [
        path.join(baseDir, 'py_multiples.html'),
        path.join(baseDir, 'py_prime.html'),
        path.join(baseDir, 'py_palindrome.html'),
        path.join(baseDir, 'py_smallestMultiple.html'),
        path.join(baseDir, 'py_fibonacci.html'),
        // Add other files as needed
    ];

    for (const filePath of htmlFilePaths) {
        try {
            const htmlContent = fs.readFileSync(filePath, 'utf8');
            const dom = new JSDOM(htmlContent);
            const title = dom.window.document.title; // Assuming title is stored in the <title> tag

            const filter = { file_name: path.basename(filePath) };
            const update = {
                name: title,  // Or modify as needed for your friendly title logic
                last_updated: new Date()
            };
            const options = { upsert: true, new: true, setDefaultsOnInsert: true };

            // Find the document and update it if it exists, insert it if it doesn't
            const result = await Question.findOneAndUpdate(filter, update, options);
            console.log(`Processed question from ${path.basename(filePath)}: ${result}`);
        } catch (err) {
            console.error(`Failed to process ${filePath}: ${err.message}`);
        }
    }
}

/**
 * @brief Handles quiz submission by updating the user's completed questions.
 *
 * This endpoint processes quiz submissions. It ensures that the user is logged in
 * and has provided the filename of the quiz being submitted. It looks up the quiz by filename
 * to find its unique identifier, and then it updates the user's record to include this quiz
 * in their list of completed questions.
 *
 * @param req The HTTP request object, containing the user's session data and the quiz file name.
 * @param res The HTTP response object used to send back the result of the submission attempt.
 *
 * @return On success, sends a confirmation message that the quiz was completed and recorded.
 *         On failure, due to either a missing quiz or a server error, sends an appropriate 
 *         HTTP status code and error message.
 */

app.post('/quiz-submission', async (req, res) => {
    const userEmail = req.session.user.email; // Ensure the user is logged in and get their email
    const quizFileName = req.body.quizFileName; // You need to pass this from the frontend

    try {
        // Find the quiz in the `questions` collection to get its ID
        const quiz = await Question.findOne({ file_name: quizFileName });

        if (!quiz) {
            return res.status(404).send('Quiz not found');
        }

        // Add the quiz ID to the user's `completedQuestions`
        await User.updateOne(
            { email: userEmail },
            { $push: { completedQuestions: quiz._id } }
        );

        res.send('Quiz completed and recorded successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while recording the quiz completion');
    }
});

/**
 * @file app.js
 * @brief Serves the main index page.
 *
 * This endpoint serves the main index HTML file to clients. When a GET request is made to the 
 * root of the server, this function responds by sending the 'index.html' file located in the 
 * 'public' directory of the server. This is typically the entry point into the web application.
 *
 * @param req The request object. Not used directly in the function but necessary for route handling.
 * @param res The response object used to send the 'index.html' file to the client.
 * 
 * @return None. Sends the 'index.html' file from the 'public' directory to the client.
 */
app.get("/", function (req, res){
    res.sendFile(__dirname + '/public/index.html');
});




/**
 * @file app.js
 * @brief Serves the homepage HTML file.
 *
 * This endpoint serves the 'homepage.html' file located in the 'public' directory to clients.
 * When a GET request is made to '/homepage.html', this function responds by sending the
 * specific HTML file. This allows the client to access the homepage of the web application
 * directly via a dedicated URL.
 *
 * @param req The request object. Not used directly in the function but necessary for route handling.
 * @param res The response object used to send the 'homepage.html' file to the client.
 * 
 * @return None. Sends the 'homepage.html' file from the 'public' directory to the client.
 */
app.get('/homepage.html', function(req, res) {
    res.sendFile(__dirname + '/public/homepage.html');
});


/**
 * @file app.js
 * @brief Fetches and sends leaderboard data.
 *
 * This endpoint retrieves leaderboard data from the database, sorted by a specified field
 * and order, which can be passed as query parameters. If no parameters are provided,
 * it defaults to sorting by 'score' in descending order. The function handles database
 * access asynchronously and sends the fetched data as a JSON response to the client.
 * In case of database access errors, it logs the error and sends a server error response.
 *
 * @param req The request object, which may contain query parameters 'sort' and 'order' to customize the sorting of the leaderboard.
 * @param res The response object used to send the sorted leaderboard data or an error message.
 * 
 * @return None. On success, sends a JSON array of leaderboard entries. On failure, sends a server error message.
 */
app.get('/leaderboard', async (req, res) => {
    const sortField = req.query.sort || 'score'; // Default sort field
    const sortOrder = req.query.order === 'asc' ? 1 : -1; // Default order
    try {
        // Fetch top scores from the database and sort them in descending order
        const leaderboardData = await User.find().sort({ [sortField]: sortOrder });        res.json(leaderboardData); // Send the data as JSON
    } catch (error) {
        console.error('Failed to fetch leaderboard data:', error);
        res.status(500).send('Error fetching leaderboard data');
    }
});


/**
 * @brief Terminates the user session to log out the user.
 *
 * This route handles user logout requests. It destroys the current user session, effectively
 * logging the user out of the application. If an error occurs during this process, it logs the
 * error and returns an appropriate message to the client. Otherwise, it confirms successful
 * logout.
 *
 * @param req The HTTP request object that provides access to the user's session.
 * @param res The HTTP response object used to send back the logout status.
 *
 * @return Sends a success message if the logout is successful, otherwise sends an error message.
 */
app.post('/logout', function(req, res) {
    req.session.destroy(function(err) {
      if (err) {
        console.log(err);
        res.status(500).send('Could not log out, please try again.');
      } else {
        // Destroy the session and send a response back to the client
        res.send('Logged out successfully.');
      }
    });
  });
  
// Additional routes go here

// Listening on port 5500
app.listen(5500, () => console.log("Server listening at port 5500"));


module.exports = app;
const express = require("express");
var bodyParser = require("body-parser");
const { exec } = require("child_process")
const fs = require("fs")
const path = require("path")
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/CodeHub');
// const WebSocket = require('ws');
// const wss = new WebSocket.Server({ noServer: true });

var db=mongoose.connection;
db.on('error', console.log.bind(console, "connection error"));
db.once('open', function(callback){
	console.log("connection succeeded");
})


const compiler = require("compilex");
const options = { stats: true };
compiler.init(options);

var app = express();
const session = require('express-session');


app.use(session({
  secret: 'your_secret_key', // Replace 'your_secret_key' with a real secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: !true } // Set secure to true if you are using https
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

// Serve static files
app.use("/codemirror-5.65.16", express.static("C:/del/Impact/codemirror-5.65.16"));
app.use(express.static('public'));
// Serve static files from 'static' directory
app.use(express.static('static'));

// Additionally serve 'java1.html' and other files from 'challenges' directory
app.use('/challenges', express.static('challenges'));


var userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    score: Number,
    lastUpdated: String
});
var User = mongoose.model('User', userSchema, 'details');

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
		 "score": 0

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
        req.session.user = user;
        res.send({ message: "Logged in successfully", username: user.name });
    });
});


// Ensure the 'users' directory exists
const usersDir = path.join(__dirname, 'users');
if (!fs.existsSync(usersDir)){
    fs.mkdirSync(usersDir);
}
// ***********************************************************//
app.post('/create-multiples-file', (req, res) => {
    const functionCode = req.body.code || '';
    
    // Save the submitted code into the users directory
    fs.writeFileSync(path.join(usersDir, 'multiples.py'), functionCode);

    // Run the tests and capture output
    exec('python -m unittest tests.test_multiples', { cwd: __dirname }, (error, stdout, stderr) => {
        let message;
        if (error) {
            message = "Error executing tests";
            console.error(`exec error: ${error}`);
        } else {
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
                message = `5/5: All tests passed, well done!`;
            } else {
                message = `${passed}/${total}: ${passed} test${passed !== 1 ? 's' : ''} passed, ${failed} failed`;
            }
        }
        
        res.json({ message });
    });
}); //END MULTIPLES

app.post('/create-fibonacci-file', (req, res) => {
    const functionCode = req.body.code || '';
    
    // Save the submitted code into the users directory
    fs.writeFileSync(path.join(usersDir, 'fibonacci.py'), functionCode);

    // Run the tests and capture output
    exec('python -m unittest tests.test_fibonacci', { cwd: __dirname }, (error, stdout, stderr) => {
        let message;
        if (error) {
            message = "Error executing tests";
            console.error(`exec error: ${error}`);
        } else {
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
                message = `All tests passed, well done!`;
            } else {
                message = `${passed}/${total}: ${passed} test${passed !== 1 ? 's' : ''} passed, ${failed} failed`;
            }
        }
        
        res.json({ message });
    });
}); //END FIBONACCI

app.post('/create-smallestMultiple-file', (req, res) => {
    const functionCode = req.body.code || '';
    
    // Save the submitted code into the users directory as 'smallestMultiple.py'
    fs.writeFileSync(path.join(usersDir, 'smallestMultiple.py'), functionCode);

    // Run the tests and capture output
    exec('python -m unittest tests.test_smallestMultiple', { cwd: __dirname }, (error, stdout, stderr) => {
        let message;
        if (error) {
            message = "Error executing tests";
            console.error(`exec error: ${error}`);
        } else {
            // Parse the output for test results
            const passedMatch = stdout.match(/Ran (\d+) tests? in .*\n\nOK/);
            const failedMatch = stdout.match(/Ran (\d+) tests? in .*\n\nFAILED \(failures=(\d+)\)/);
            let passed, failed, total;

            if (passedMatch) {
                total = parseInt(passedMatch[1], 10);
                passed = total;
                failed = 0;
                // If all tests passed, optionally increment the user's score
                // Increment score logic here (similar to previous challenges)
            } else if (failedMatch) {
                total = parseInt(failedMatch[1], 10);
                failed = parseInt(failedMatch[2], 10);
                passed = total - failed;
            }

            // Format the response message
            if (passed === total) {
                message = `All tests passed, well done!`;
            } else {
                message = `${passed}/${total}: ${passed} test${passed !== 1 ? 's' : ''} passed, ${failed} failed`;
            }
        }
        
        res.json({ message });
    });
}); // END SMALLEST MULTIPLE

app.post('/create-prime-file', (req, res) => {
    const functionCode = req.body.code || '';
    
    // Save the submitted code into the users directory as 'prime.py'
    fs.writeFileSync(path.join(usersDir, 'prime.py'), functionCode);

    // Run the tests and capture output
    exec('python -m unittest tests.test_prime', { cwd: __dirname }, (error, stdout, stderr) => {
        let message;
        if (error) {
            message = "Error executing tests";
            console.error(`exec error: ${error}`);
        } else {
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
                message = `All tests passed, well done!`;
            } else {
                message = `${passed}/${total}: ${passed} test${passed !== 1 ? 's' : ''} passed, ${failed} failed`;
            }
        }
        
        res.json({ message });
    });
}); // END 10,0001ST PRIME

app.post('/create-palindrome-file', (req, res) => {
    const functionCode = req.body.code || '';
    
    // Save the submitted code into the users directory
    fs.writeFileSync(path.join(usersDir, 'palindrome.py'), functionCode);

    // Run the tests and capture output
    exec('python -m unittest tests.test_palindrome', { cwd: __dirname }, (error, stdout, stderr) => {
        let message;
        if (error) {
            message = "Error executing tests";
            console.error(`exec error: ${error}`);
        } else {
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
                message = `5/5: All tests passed, well done!`;
            } else {
                message = `${passed}/${total}: ${passed} test${passed !== 1 ? 's' : ''} passed, ${failed} failed`;
            }
        }
        
        res.json({ message });
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
    const now = new Date();
    const dateString = now.toISOString().substring(0, 10); // Format as 'YYYY-MM-DD'

    db.collection('details').updateOne(
        { email: userEmail },
        { 
            $inc: { score: 1 },
            $set: { lastUpdated: dateString } // Set the last updated date
        },
        function(err, result) {
            if (err) {
                console.error(err);
                res.status(500).json({ message: 'Error incrementing score' });
            } else if (result.modifiedCount === 0) {
                res.status(404).json({ message: 'User not found' });
            } else {
                // Send the date back in the response
                res.json({ message: 'All tests passed. Score incremented successfully!', date: dateString });
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


// Additional routes go here

// Listening on port 5500
app.listen(5500, () => console.log("Server listening at port 5500"));

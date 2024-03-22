const express = require("express");
var bodyParser = require("body-parser");
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/CodeHub');

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
// Serve static files from the 'challenges' directory
app.use('/challenges', express.static('challenges'));

var userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    score: Number
});
var User = mongoose.model('User', userSchema);

// API routes from Api.js and app.js
app.post('/sign_up', function(req,res){
	var name = req.body.name;
	var email = req.body.email;
	var pass = req.body.password;

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


// POST /increment-score from Api.js
app.post('/increment-score', function(req, res) {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const userEmail = req.session.user.email;

    db.collection('details').updateOne(
        { email: userEmail },
        { $inc: { score: 1 } },
        function(err, result) {
            if (err) {
                console.error(err);
                res.status(500).json({ message: 'Error incrementing score' });
            } else if (result.modifiedCount === 0) {
                res.status(404).json({ message: 'User not found' });
            } else {
                res.json({ message: 'Score incremented successfully!' });
            }
        }
    );
});


// POST /compile from Api.js
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



// GET / from Api.js
app.get("/", function (req, res){
    res.sendFile(__dirname + '/public/index.html');
});




// GET /homepage.html from app.js
app.get('/homepage.html', function(req, res) {
    res.sendFile(__dirname + '/public/homepage.html');
});

// Additional routes go here

// Listening on port 5500
app.listen(5500, () => console.log("Server listening at port 5500"));

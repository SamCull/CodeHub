// Importing the Express.js framework and other features
const express = require("express")
const app = express()
const bodyP = require("body-parser")
const { MongoClient } = require('mongodb');
const compiler = require("compilex")
const options = {stats:true}
compiler.init(options)
app.use(bodyP.json())
const port = 5500;

const uri = "mongodb://localhost:27017/CodeHub"; // Your MongoDB URI
const client = new MongoClient(uri, { useUnifiedTopology: true });




// Serving static files (CodeMirror library) at the specified route
app.use("/codemirror-5.65.16", express.static("C:/del/Impact/codemirror-5.65.16"))


app.post('/increment-score', async (req, res) => {
    try {
        await client.connect();
        const database = client.db('CodeHub');
        const collection = database.collection('details');

        // Assuming the user "testme" is unique and we want to increment score for this user
        const result = await collection.updateOne(
            { name: "testme" }, // Filter the document by the "name" field
            { $inc: { score: 1 } } // Increment the "score" field by 1
        );

        if (result.modifiedCount === 1) {
            res.json({ message: 'Score incremented for testme' });
        } else {
            res.json({ message: 'User testme not found or score already incremented' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error incrementing score');
    } finally {
        await client.close();
    }
});





// Handling GET requests to the root route and sending an HTML file
app.get("/", function (req, res){
    res.sendFile("C:/del/Impact/challenges/java1.html")
})



// Handling POST requests to the "/compile" route
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



// Listening on port 5500
app.listen(5500)

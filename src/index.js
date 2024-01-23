const express = require('express');
const path = require("path");
const bcrypt = require("bcrypt");
const collection = require("./config"); //connect to db

const app = express();

//conver data to json format
app.use(express.json());
app.use(express.urlencoded({extended: false}));

// use EJS as view engine
app.set('view engine', 'ejs');
// a static file
app.use(express.static("public"));
app.use('/images', express.static('images'));

// First page
app.get("/", (req, res) => {
    res.render("login");
});

// Define a route handler for the login page
app.get('/login', (req, res) => {
    res.render('login');
  });

app.get("/signup", (req, res)=> {
    res.render("signup");
});

// Register user
app.post("/signup", async (req, res) => {

    const data = {
        name: req.body.username,
        password: req.body.password
    }

    //check if user already exists
    const existingUser = await collection.findOne({name: data.name});
    if(existingUser){
        res.send("User already exists, use different name");
    }
    else{
        //hash password
        const saltRounds = 10; 
        const hashPassword = await bcrypt.hash(data.password, saltRounds);

        data.password = hashPassword; // replace password with hash password

    const userdata = await collection.insertMany(data);
    console.log(userdata);
    }
});


//Log in user
app.post("/login", async (req, res) => {
    try{
        const check = await collection.findOne({name: req.body.username});
        if (!check){
            res.send("User name not found");
        }

        //compare hash password with plain text
        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
        if(isPasswordMatch){
            res.render("home");
        }
        else{
            req.send("Wrong password");
        }
    } catch {
        res.send("Wrong details added");
    }
})

const port = 7000; 
app.listen(port, () => { 
    console.log(`Server running on Port: ${port}`);
})
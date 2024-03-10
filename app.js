var express=require("express");
var bodyParser=require("body-parser");

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/CodeHub');
var db=mongoose.connection;
db.on('error', console.log.bind(console, "connection error"));
db.once('open', function(callback){
	console.log("connection succeeded");
})

var app=express()


app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
	extended: true
}));

app.post('/sign_up', function(req,res){
	var name = req.body.name;
	var email =req.body.email;
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

        // If the user is found and password matches, redirect to homepage.html
		res.send({ message: "Logged in successfully", username: user.name });
       // return res.redirect('/homepage.html');
    });
});


app.post('/increment-score', async (req, res) => {
    try {
        const userEmail = req.body.email; // Use the email from the request body

        await client.connect();
        const database = client.db('CodeHub');
        const collection = database.collection('details');

        const result = await collection.updateOne(
            { email: userEmail }, // Filter the document by the "email" field
            { $inc: { score: 1 } } // Increment the "score" field by 1
        );

        if (result.modifiedCount === 1) {
            res.json({ message: 'Score incremented for user' });
        } else {
            res.json({ message: 'User not found or score already incremented' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error incrementing score');
    } finally {
        await client.close();
    }
});

app.get('/homepage.html', function(req, res) {
    res.sendFile(__dirname + '/public/homepage.html');
});



app.get('/',function(req,res){
res.set({
	'Access-control-Allow-Origin': '*'
	});
return res.redirect('index.html');
}).listen(3000)



console.log("server listening at port 3000");

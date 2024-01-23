
const mongoose = require("mongoose");
const connect = mongoose.connect("mongodb://localhost:27017/AllUsers-users");

//check if connected
connect.then(() => {
    console.log("Database connected successfully");
})
.catch(() => {
    console.log("No connection");
});

// Create a scheme
const LoginSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

//collection part
const collection = new mongoose.model("users", LoginSchema)

module.exports = collection;
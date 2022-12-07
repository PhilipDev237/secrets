//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const url = "mongodb://127.0.0.1:27017/userDB";

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const port = 3000;

//connect to DB
mongoose.connect(url, {useNewUrlParser: true});

mongoose.set('strictQuery', true);

// user Schema
const userSchema = new mongoose.Schema(
    {
        email: String,
        password: String
    }
);

// encrypt password
userSchema.plugin(encrypt, { secret: process.env.SECRET_KEY, encryptedFields: ['password'] });

// user model
const User = mongoose.model("User", userSchema);

app.get("/", function(req, res){
    res.render("home");
});

// LOGIN
app.route("/login")
.get(function(req, res){
    res.render("login");
})

.post(function(req, res){
    const userName = req.body.username;
    const userPassword = req.body.password;

    User.findOne(
        {email: userName},
        function(err, foundUser){
            if(err){
                console.log(err);
            }else{
                if(foundUser){
                    if(foundUser.password === userPassword){
                        res.render("secrets");
                    }                    
                }else{
                    console.log("No user found");
                }
            }            
        });
});

// Register 
app.route("/register")

.get(function(req, res){
    res.render("register");
})

.post(function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    newUser.save(function(err){
        if(!err){
            res.render("secrets");
        }else{
            console.log(err);
        }
    });
});


app.listen(port, function(){
    console.log("Server started on port 3000");
})
//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const url = "mongodb://127.0.0.1:27017/userDB";

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const port = 3000;

// create a session
app.use(session({
    secret: 'Our little secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));

// passport init
app.use(passport.initialize());
app.use(passport.session());

//connect to DB
mongoose.connect(url, {useNewUrlParser: true});

mongoose.set('strictQuery', true);

// user Schema
const userSchema = new mongoose.Schema(
    {
        email: String,
        password: String,
        googleId: String,
        secret: String
    }
);

// passport mongoose
userSchema.plugin(passportLocalMongoose);

// findorcreate
userSchema.plugin(findOrCreate);

// user model
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

mongoose.set('strictQuery', true);

app.get("/", function(req, res){
    res.render("home");
});

// google reg
app.route("/auth/google")
.get(function(req,res){
    passport.authenticate('google', { scope: ["profile"] });
});

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

// Register 
app.route("/register")

.get(function(req, res){
    res.render("register");
})

.post(function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate('local')(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

// LOGIN
app.route("/login")
.get(function(req, res){
    res.render("login");
})

.post(function(req, res){
    const userName = req.body.username;
    const userPassword = req.body.password;

    const user = new User({
        username: userName,
        password: userPassword
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate('local')(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

// LOGOUT
app.route("/logout")
.get(function(req, res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    });    
});

// SUBMIT
app.route("/submit")
.get(function(req, res){
    if(req.isAuthenticated){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
})
.post(function(req, res){
    const submittedSecret = req.body.secret;

    // User.findById(req.user.id, function(err,foundUser){
    //     if(err){
    //         console.log(err);
    //     }else{
    //         if(foundUser){
    //             foundUser.secret = submittedSecret;
    //             foundUser.save(function(){
    //                 res.redirect("/secrets");
    //             });                
    //         }
    //     }
    // })
});

// SECRETS ROUTE
app.route("/secrets")
.get(function(req, res){
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
        if(err){
            console.log(err);
        }else{
            if(foundUsers){
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        }
    })
});


app.listen(port, function(){
    console.log("Server started on port 3000");
})
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const FindorCreate = require("mongoose-findorcreate");
const bcrypt = require("bcrypt");
const Passport = require("passport");
const flash = require("express-flash")

const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;

const app = express();

app.use(express.static("public"));
app.set("view-engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb://localhost:27017/OnlineStoreDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const UserSchema = new mongoose.Schema({
    googleId: String,
    firstName: {
        type: String,
        require: true
    },
    secondName: String,
    username: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    }
});
UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(FindorCreate);

const User = mongoose.model("User", UserSchema);

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/home/",
        userProfileURL: "httls://www.google.com/oauth2/v3/userinfo",
        passReqToCallback: true
    },
    function(request, accessToken, refreshToken, profile, done) {
        User.findOrCreate({
            googleId: profile.id,
            firstName: profile.name.givenName,
            secondName: profile.name.familyName
        }, function(err, user) {
            return done(err, user);
        });
    }
));

const authenticateUser = (username, password, done) => {
    User.findOne({ username: username }, async function(err, user) {
        if (err) { return done(err); }
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }
        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Incorrect password.' });
            }
        } catch (e) { return done(e) }
    });
};

passport.use(new LocalStrategy({ usernameField: "username", passwordField: "password" }, authenticateUser));

passport.serializeUser(function(user, done) {
    done(null, user.id);
    // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

app.get("/", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("index.ejs", {
            name: req.user.firstName + " " + req.user.secondName
        });
    } else {
        res.redirect("/signin");
    }
});

app.get("/auth/google/",
    passport.authenticate('google', {
        scope: ['email', 'profile']
    }));

app.get("/auth/google/home/",
    passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/signin'
    }));

app.get("/signin", function(req, res) {
    res.render("signin.ejs");
});

app.get("/signup", function(req, res) {
    res.render("signup.ejs");
});

app.post('/signin', passport.authenticate('local', {
    failureRedirect: '/signin',
    successRedirect: '/',
    failureFlash: true
}));

app.post('/signup', async(req, res) => {
    hashedPass = await bcrypt.hash(req.body.pass, 10);
    try {
        const newUser = new User({
            username: req.body.username,
            firstName: req.body.firstName,
            secondName: req.body.secondName,
            password: hashedPass
        });

        newUser.save()
            .then((user) => {
                console.log(user);
            });
        res.redirect('/signin');
    } catch {
        res.redirect("/")
    }
});



app.listen(3000, function() {
    console.log("Server started on port 3000.")
});
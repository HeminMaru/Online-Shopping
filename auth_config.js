const User = require("./models/usersModel");
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const bcrypt = require("bcrypt");
const Passport = require("passport");

function initialize(passport) {

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

}

module.exports = initialize;
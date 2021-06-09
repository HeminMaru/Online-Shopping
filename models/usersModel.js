const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const FindorCreate = require("mongoose-findorcreate");

mongoose.connect('mongodb+srv://developer-Hemin:' + process.env.DB_PASS + '@the-shop-sisters-db.2tgck.mongodb.net/the-shop-sisters-db', { useNewUrlParser: true, useUnifiedTopology: true });
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

module.exports = mongoose.model("User", UserSchema);
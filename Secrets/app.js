const express = require("express");

const ejs = require("ejs");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


const userSchema = new mongoose.Schema({
    email: String,
    password: String
})
const secret = "mylittlesecret";
userSchema.plugin(encrypt, {
    secret: secret,
    encryptedFields: ['password']
})
const user = mongoose.model('user', userSchema);









const app = express();


app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}))



app.route("/")
    .get((req, res) => {
        res.render("home");
    })



app.route("/login")
    .get((req, res) => {
        res.render("login");
    })

    .post((req, res) => {
        user.findOne({
            email: req.body.username
        }, (err, docs) => {
            if (!err) {
                if (docs) {
                    if (docs.password === req.body.password){
                        res.render("secrets");
                        }
                    else {
                        console.log("wrong password");
                        res.redirect("/");
                    }
                } else {
                    console.log("Not found!");
                    res.redirect("/");
                }
            } else {
                console.log(err);
                res.redirect("/");
            }

        })

    })


app.route("/register")
    .get((req, res) => {

        res.render("register");
    })

    .post((req, res) => {
        const userx = new user({
            email: req.body.username,
            password: req.body.password
        })

        userx.save();
        console.log("registered sucessfully");
        res.render("secrets");
    })






app.listen(3000, () => {
    console.log("server started sucessfully")
});
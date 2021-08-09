require('dotenv').config()

const express = require("express");

const ejs = require("ejs");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;



mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

// userSchema.plugin(encrypt, {
//     secret: process.env.SECRET,
//     encryptedFields: ['password']
// })
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
                    bcrypt.compare(req.body.password, docs.password, function (err, result) {
                        if (result === true) {
                            res.render("secrets")
                            console.log("logged in");
                        } else {
                            console.log("wrong password");
                            res.redirect("/");
                        }
                    });

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
        bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
            if (!err) {
                const userx = new user({
                    email: req.body.username,
                    password: hash
                })
                userx.save();
                console.log("registered sucessfully");
                res.render("secrets");

            } else
                console.log(err);

        });




    })






app.listen(3000, () => {
    console.log("server started sucessfully")
});
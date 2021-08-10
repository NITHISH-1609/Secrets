//env variable 
require('dotenv').config()

//importing
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

//import these 3 for passport authentication
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose');



const app = express();


//step-1 session initialize
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }))

//step-2 passport initialize(before connecting to database)
  app.use(passport.initialize());
  app.use(passport.session());



//connecting to DB and initialize Schema
mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})


//PLM plugin
userSchema.plugin(passportLocalMongoose);


//Schema Model initialize
const user = mongoose.model('user', userSchema);


//PLM setup
passport.use(user.createStrategy());

//optional (used only for cookies)
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());



//ejs and bodyparser
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}))


//Routing...



//HOME ROUTE
app.route("/")
    .get((req, res) => {
        res.render("home");
    })






//LOGIN ROUTE
app.route("/login")
    .get((req, res) => {
        res.render("login");
    })

    .post((req, res) => {
        const userx= new user({
            username:req.body.username,
            password:req.body.password

        })

        req.login(userx, function(err) {
            if (err) { 
                console.log(err) }
            else
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets")
            })
           
          });
        
        
    })

//ROUTE SECRET
app.route("/secrets")
    .get((req,res)=>{
        if(req.isAuthenticated()){
            res.render("secrets");

        }
        else
        res.redirect("/login");
    })

//ROUTE LOGOUT
app.route("/logout")
    .get((req,res)=>{
        req.logOut
        res.redirect("/");
    })

//REGISTER ROUTE
app.route("/register")
    .get((req, res) => {
        res.render("register");
    })

    .post((req,res)=>{
        user.register({username:req.body.username},req.body.password,(err,docs)=>{
            if(err){
                console.log(err);
                res.redirect("/");
            }
            else{
                passport.authenticate("local")(req,res,()=>{
                    res.redirect("/secrets");
                })
            }
        })
    })




//port
app.listen(3000, () => {
    console.log("server started sucessfully")
});
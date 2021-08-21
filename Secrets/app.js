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

//new packages
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const findOrCreate = require('mongoose-findorcreate');



const app = express();
//ejs and bodyparser
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}))



//step-1 session initialize
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false
  }
}))

//step-2 passport initialize(before connecting to database)
app.use(passport.initialize());
app.use(passport.session());



//connecting to DB and initialize Schema

mongoose.connect("mongodb+srv://Admin-Spark:"+process.env.MPASS+"@cluster01.ckyib.mongodb.net/secretDB?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  githubId: String,
  mysecret: String
})


//PLM plugin
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


//Schema Model initialize
const user = mongoose.model('user', userSchema);


//PLM setup
passport.use(user.createStrategy());

//optional (used only for cookies)
passport.serializeUser(function (userx, done) {
  done(null, userx.id);
});

passport.deserializeUser(function (id, done) {
  user.findById(id, function (err, userx) {
    done(err, userx);
  });
});


//Google-auth
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfile: "https://www.googleapis.com/oauth2/userinfo"
  },
  function (accessToken, refreshToken, profile, cb) {
    user.findOrCreate({
      googleId: profile.id
    }, function (err, user) {
      return cb(err, user);
    });
  }
));

//Facebook-auth 
passport.use(new FacebookStrategy({
    clientID: process.env.CLIENT_ID_FB,
    clientSecret: process.env.CLIENT_SECRET_FB,
    callbackURL: "http://localhost:3000/auth/facebook/secrets",
    proxy: true
  },
  function (accessToken, refreshToken, profile, cb) {
    user.findOrCreate({
      facebookId: profile.id
    }, function (err, user) {
      return cb(err, user);
    });
  }
));

//Github-auth
passport.use(new GitHubStrategy({
    clientID: process.env.CLIENT_ID_GH,
    clientSecret: process.env.CLIENT_SECRET_GH,
    callbackURL: "http://localhost:3000/auth/github/secrets"
  },
  function (accessToken, refreshToken, profile, done) {
    user.findOrCreate({
      githubId: profile.id
    }, function (err, user) {
      return done(err, user);
    });
  }
));







//Routing...

//Google
app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile']
  }));


app.get('/auth/google/secrets',
  passport.authenticate('google', {
    failureRedirect: "/register"
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

//Facebook
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', {
    failureRedirect: '/register'
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

//Github
app.get('/auth/github',
  passport.authenticate('github', {
    scope: ['profile', "email"]
  }));

app.get('/auth/github/secrets',
  passport.authenticate('github', {
    failureRedirect: '/register'
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });




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
    const userx = new user({
      username: req.body.username,
      password: req.body.password

    })

    req.login(userx, function (err) {
      if (err) {
        console.log(err)
      } else
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets")
        })

    });


  })

//ROUTE SECRET
app.route("/secrets")
  .get((req, res) => {
    if (req.isAuthenticated()) {
      user.find({mysecret:{ $ne: null }},(err,docs)=>{
        if(!err)
        {
          res.render("secrets",{
            list:docs
          })
        }
        else
        console.log(err);
      })
      

    } else
      res.redirect("/login");
  })

//ROUTE LOGOUT
app.route("/logout")
  .get((req, res) => {
    req.logOut
    res.redirect("/");
  })

//REGISTER ROUTE
app.route("/register")
  .get((req, res) => {
    res.render("register");
  })

  .post((req, res) => {
    user.register({
      username: req.body.username
    }, req.body.password, (err, docs) => {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        })
      }
    })
  })
app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");

  } else
    res.redirect("/login");
})

app.post("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    const ksecret = req.body.secret;
    user.findOneAndUpdate({
      _id: req.user.id
    }, {
      mysecret: ksecret
    }, (err, docs) => {
      if (err)
        console.log(err)
      else {
        res.redirect("/secrets");
      }
    })
  } else
    res.redirect("/login");

})





//port
app.listen(3000, () => {
  console.log("server started sucessfully")
});
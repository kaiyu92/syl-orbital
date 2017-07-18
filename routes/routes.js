var express = require('express');
var fs = require('fs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
//var chrono = require('chrono-node');

var Event = require('../models/Event'); //database
var User = require('../models/User');
var UserData = require('../models/UserData');

var router = express.Router();


passport.use(new LocalStrategy(
  function(username, password, done) {

   User.getUserByUsername(username, function(err, user){
    if(err) throw err;
    if(!user){
      return done(null, false, {message: 'Unknown User'});
    }


    User.comparePassword(password, user.password, function(err, isMatch){
      if(err) throw err;
      if(isMatch){
        return done(null, user);
      } else {
        return done(null, false, {message: 'Invalid password'});
      }
    });
   });
  }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

//====================Home==========================
// Get homepage
router.get('/', function(req, res){
  res.render('home');
});
//==================================================

//=====================Index========================

router.get('/index', isLoggedIn, function(req, res) {
  res.render('index');
});

//Get the user submit request
router.get('/get-request', function(req, res, next) {
 UserData.find()
     .then(function(doc) {
       res.render('index', {items: doc});
     });
});

//User can submit request
router.post('/new-request', function(req, res, next) {
  var item = {
    name: req.body.name,
    org: req.body.org,
    content: req.body.eventDetails,
    date: req.body.date
  };

  var data = new UserData(item);
  data.save();

  req.flash('success_msg', 'Successfully request for \"' + req.body.name + '\"');

  res.redirect('/index');
});
//=======================================================

//=====================Login/Logout========================
// Login
router.get('/login', function(req, res){
  res.render('login');
});

// router.post('/checklogin',
//   passport.authenticate('local', {successRedirect:'/index', failureRedirect:'/login',failureFlash: true}),
//   function(req, res) {
//     res.render('index');
// });

router.post('/checklogin',
  passport.authenticate('local', {successRedirect:'/index', failureRedirect:'/login', failureFlash: true}),
  function(req, res) {
    //console.log(res);

    res.redirect('/index');
});


router.get('/logout', function(req, res) {
  req.logout();

  req.flash('success_msg', 'You are logged out');

  res.redirect('/');
})

//=======================================================

//=====================Register========================
// Render Register page
router.get('/register', function(req, res){
  res.render('register');
});

// Register User
router.post('/registerUser', function(req, res){

  User.find({ username: req.body.username }).exec(function (err, results) {
  
  var count = results.length;

  var name = req.body.name;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  var password2 = req.body.password2;

  // Validation
  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();

  if(errors){
    res.render('register',{
      errors:errors
    });
  } else if(count >= 1) {
    req.flash('error_msg', 'Username has been taken');
    res.redirect('/register');
  }
  else {
        
    var newUser = new User({
      name: name,
      email:email,
      username: username,
      password: password
    });

    User.createUser(newUser, function(err, user){
      if(err) throw err;
      console.log(user);
    });


    req.flash('success_msg', 'You are registered and can now login');

    res.redirect('/login');
  }

  });
});
//=======================================================

//=====================Event========================
var event_data;

fs.readFile('../syl-orbital/events_data.out', 'utf8', function(err, data) {
  if(err) throw err;
  event_data = JSON.parse(data);
})

router.get('/event', isLoggedIn, function(req, res){
  res.render('event', { data: event_data });
});

//Insert new marked event
router.post('/addMarkEvent', isLoggedIn, function(req, res, next) {
  Event.find({ username: req.user.username, title: req.body.title }).exec(function (err, results) {
    var count = results.length;
    if(count >= 1) {
      req.flash('error_msg', 'Event already added');
    }
    else {
    //console.log("Test 123")
      var markedEvent = new Event();
      markedEvent.title = req.body.title;
      markedEvent.date = req.body.date;
      markedEvent.venue = req.body.venue;
      markedEvent.category = req.body.category;
      markedEvent.username = req.user.username;

      markedEvent.save();
      req.flash('success_msg', 'Successfully marked \"' + req.body.title + '\"');
      //console.log(chrono.parse(req.body.date));
    }
  res.redirect('/event');  
    
  });
});

//=======================================================

//=====================Profile========================
//Get all the marked event by the user
router.get('/markedEvent', isLoggedIn, function(req, res){
   Event.find({ username: req.user.username })
      .then(function(doc) {
        res.render('profile', {events: doc});
      })
});



//Delete the marked event by the user based on event_id
router.post('/deleteEvent', isLoggedIn, function (req, res) {
  Event.remove({ _id: req.body.event_id },
              function (err) {
                  req.flash('success_msg', 'Successfully remove event');
                  res.redirect('/markedEvent');
              })
});
//=======================================================

module.exports = router;

//ensureAuthenticated and isLoggedIn the same thing??
//Check for user authentication
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } else {
    //req.flash('error_msg','You are not logged in');
    res.redirect('/login');
  }
}

function isLoggedIn(req, res, next){
  if (req.isAuthenticated())
    return next();

  res.redirect('/login');
}

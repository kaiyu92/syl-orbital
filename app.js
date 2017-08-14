var express = require('express');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var session = require('express-session');

var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var flash = require('connect-flash');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var mongoose = require('mongoose');
var routes = require('./routes/routes');

var PythonShell = require('python-shell');
var schedule = require('node-schedule');

mongoose.connect('mongodb://localhost/sylorbitaldb');
var db = mongoose.connection;

// Init App
var app = express();

// View Engine
app.set('views', path.join(__dirname, 'views'));

app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');


// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Connect Flash
app.use(flash());

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

//Run the python script on every wednesday 2.30pm/1430
var j = schedule.scheduleJob({hour: 12, minute: 30, dayOfWeek: 1}, function() {
  console.log('running scraper');
  PythonShell.run('scraper.py', function (err) {
    if(err) throw err;
    console.log('finished');
  });
});

app.use('/', routes);

// Set Port
app.set('port', (process.env.PORT || 3000));

app.listen(app.get('port'), function(){
	console.log('Server started on port '+app.get('port'));
});
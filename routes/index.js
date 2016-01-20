var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , crypto = require('crypto')
  , RedditStrategy = require('passport-reddit').Strategy;
var router = express.Router();
var monk = require('monk');

var db = monk('127.0.0.1:27017/rewatch');

var REDDIT_CONSUMER_KEY = "hR9fXJLR4f-O6w";
var REDDIT_CONSUMER_SECRET = "ouURHl2Fggqs5vhJRTvRC0O-tF4";

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new RedditStrategy({
    clientID: REDDIT_CONSUMER_KEY,
    clientSecret: REDDIT_CONSUMER_SECRET,
    callbackURL: "http://203.75.245.16/auth/reddit/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // To keep the example simple, the user's Reddit profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Reddit account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

/* GET home page. */
router.get('/', function(req, res, next) {
    if (typeof req.user != 'undefined') {
          
        var users = db.get('users');
        users.insert({
            name: req.user.name,
            provider: req.user.provider
        });
        
        res.render('index', { 
            title: 'Rewatcher',
            user: req.user
        });
    } else {
        res.render('index', { 
            title: 'Rewatcher',
            user: false
        });
    }
    
});

router.get('/login', function(req, res, next) {

    res.render('login', { 
        title: 'Login',
        user: (typeof req.user != 'undefined')?req.user:false
    });
});

router.post('/search', function(req, res, next) {
    
    var search_text = "";
    if (req.body.is_big_search) {
        search_text = (req.body.big_search_text)?req.body.big_search_text:"";
    } else {
        search_text = (req.body.search_text)?req.body.search_text:"";
    }
    
    var search_split = search_text.split(" ");
    var regex_text = '';
    
    for (var i=0; typeof search_split[i] != 'undefined'; i++) {
        if (search_split[i]) {
            regex_text += '.*?[' + search_split[i].charAt(0).toUpperCase() + search_split[i].charAt(0).toLowerCase() + ']' + search_split[i].slice(1);
        }
    }
    if (regex_text) regex_text += '.*?';
        
    var series = db.get('series');
    series.find({title: { $regex: regex_text, $options: 'i' }}, function (err, series_result) {
        if (!err) {
	        res.render('search', { 
                title: 'Search - ' + search_text,
                search_text: search_text,
	            series: series_result,
                result_count: series_result.count
	        });
        }
    });
    /*
	client.execute("SELECT * FROM series WHERE lucene='{filter: {type: \"regexp\", field : \"title\", value: \""+regex_text+"\"}}'", function (series_err, series_result) {
        if (!series_err){
	        res.render('search', { 
                title: 'Search - ' + search_text,
                search_text: search_text,
	            series: series_result.rows,
                result_count: series_result.rowLength
	        });
	    }		
	});*/
});

router.get('/auth/reddit', function(req, res, next){
    req.session.state = crypto.randomBytes(32).toString('hex');
    passport.authenticate('reddit', {
        state: req.session.state,
        duration: 'permanent',
    })(req, res, next);
});
 
router.get('/auth/reddit/callback', function(req, res, next){
    // Check for origin via state token 
    if (req.query.state == req.session.state){
        
        var redirect = (typeof req.session.login_redirect != 'undefined' && req.session.login_redirect)?req.session.login_redirect:'/';
        passport.authenticate('reddit', {
            successRedirect: redirect,
            failureRedirect: redirect
        })(req, res, next);
    } else {
        //next( new Error 403 );
        err.status = 403;
    
        res.render('error', {
            message: err.message,
            error: err
        });
    }
});

router.get('/logout', function(req, res, next){
    req.logout();
    res.redirect('/');
});

module.exports = router;

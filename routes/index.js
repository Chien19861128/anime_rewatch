var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , crypto = require('crypto')
  , RedditStrategy = require('passport-reddit').Strategy;
var router = express.Router();
var cassandra = require('cassandra-driver');

var client = new cassandra.Client({contactPoints: ['127.0.0.1'], keyspace: 'rewatch'});

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
    
	var users_insert = "INSERT INTO users(name, provider) VALUES(?, ?) IF NOT EXISTS ";
	var users_params = [req.user.name, req.user.provider];
				
	client.execute(users_insert, users_params, {prepare: true}, function (err, result) {
		if (err) console.log(err);
	});
    
    res.render('index', { title: '[user]' + req.user.id + '[name]' + req.user.name + '[over_18]' + req.user.over_18 });
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
        passport.authenticate('reddit', {
            successRedirect: '/',
            failureRedirect: '/'
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

module.exports = router;

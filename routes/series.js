var express = require('express');
var router = express.Router();
var monk = require('monk');

var db = monk('127.0.0.1:27017/rewatch');

router.get('/:slug', function(req, res, next) {
    
	req.session.login_redirect = req.originalUrl;
    
    var series = db.get('series');
    series.findOne({slug: req.params.slug}, function (err, series_result) {
        if (!err) {
            var episodes = db.get('episodes');
            
            episodes.find({series_slug: req.params.slug}, {number: 1}, function (episodes_err, episodes_result) {
                if (!episodes_err) {
	    	        res.render('series/index', {
                        title: series_result.title,
		                series: series_result,
                        episodes: episodes_result
		            });
		        }
            });
        }
    });
    
    /*
    client.execute("SELECT * FROM series WHERE slug='" + req.params.slug + "'", function (err, result) {
        if (!err){
			var series = result.rows[0];
	
	        client.execute("SELECT * FROM episodes WHERE series_slug='" + req.params.slug + "'", function (episodes_err, episodes_result) {
                if (!episodes_err){
	    	        res.render('series/index', { 
                        title: series.title,
		                series: series,
                        episodes: episodes_result.rows
		            });
		        }		
	        });
        }
    });*/
});

router.get('/:slug/start_group', function(req, res, next) {
    
    if (typeof req.user != 'undefined') {
        
        var series = db.get('series');
        series.findOne({slug: req.params.slug}, function (err, series_result) {
            if (!err) {
                res.render('series/start_group', {
                    title: 'Starting group for - ' + series.title,
                    series: series
                });
            }
        });
        
        /*client.execute("SELECT * FROM series WHERE slug='" + req.params.slug + "'", function (err, result) {
            if (!err) {
                var series = result.rows[0];
                res.render('series/start_group', { 
                    title: 'Starting group for - ' + series.title,
                    series: series
                });
            }
        });*/
    } else {
        req.session.login_redirect = req.originalUrl;
        res.redirect('/login');
    }
});

module.exports = router;

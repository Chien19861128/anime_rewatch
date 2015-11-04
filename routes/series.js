var express = require('express');
var router = express.Router();
var cassandra = require('cassandra-driver');

var client = new cassandra.Client({contactPoints: ['127.0.0.1'], keyspace: 'rewatch'});

router.get('/:slug', function(req, res, next) {
	//res.render('index', { title: req.params.slug });
    client.execute("SELECT * FROM series WHERE slug='" + req.params.slug + "'", function (err, result) {
        if (!err){
			var series = result.rows[0];
	
	        client.execute("SELECT * FROM episodes WHERE series_slug='" + req.params.slug + "'", function (episodes_err, episodes_result) {
                if (!episodes_err){
	    	        res.render('series', { 
                        title: series.title,
		                series: series,
                        episodes: episodes_result.rows
		            });
		        }		
	        });
        }
    });
});

module.exports = router;

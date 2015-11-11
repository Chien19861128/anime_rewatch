var express = require('express');
var router = express.Router();
var cassandra = require('cassandra-driver');
var slug = require('slug');

var client = new cassandra.Client({contactPoints: ['127.0.0.1'], keyspace: 'rewatch'});

router.post('/create', function(req, res, next) {
    res.render('index', { title: req.user });
});

module.exports = router;

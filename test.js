var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

var server = app.listen(80, function () {
  //var host = server.address().address;
  var host = 'http://203.75.245.16';
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
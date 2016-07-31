var monk = require('monk'),
    fs = require('fs'),
    xml2js = require('xml2js'),
	util = require("util"),
	http = require('http'),
	slug = require('slug'),
	async = require('async');
	
var db = monk('127.0.0.1:27017/rewatch');

var i = 1;

async.whilst(
    function () { return i < 17999; },
    function (cb) {
		var id_str = "";
		for(var ii=i; ii<i+50; ii++) {
			if (id_str=="") {
				id_str = ii;
			} else {
				id_str = id_str + "/" + ii;
			}
		}
		
        i+=50;
		
		var options = {
			host: 'cdn.animenewsnetwork.com',
			path: '/encyclopedia/api.xml?anime=' + id_str
		};

		callback = function(response) {
			var str = '';

			//another chunk of data has been recieved, so append it to `str`
			response.on('data', function (chunk) {
				str += chunk;
			});
	
			//the whole response has been recieved, so we just print it out here
			response.on('end', function () {
				
				var parseString = require('xml2js').parseString;
				
				parseString(str, function (err, result) {
					
					if (result['ann']['anime']) {
						result['ann']['anime'].forEach(function(element, index, arr) {
							
							var id = element['$']['id'];
							var title = element['$']['name'];
							var title2 = '';
							var title3 = '';
							var slug_value;
							var type = element['$']['type'];
							var image;
							var description;
							var episode_count=1;
							var length=0;
							var vintage='';
							
							var official_tags = [];
							
							if (element['info']) {
								element['info'].forEach(function(element2, index2, arr2) {
									switch(element2['$']['type']) {
										case 'Genres':
											official_tags.push('genre:' + element2['_']);
											break;
										case 'Themes':
											official_tags.push('theme:' + element2['_']);
											break;
										case 'Alternative title':
											if (element2['$']['lang'] && 'ja'==element2['$']['lang'].toLowerCase()) {
												if (typeof title2 == 'undefined') {
													title2=element2['_'];
												} else {
													title3=element2['_'];
												}
											}
											break;
										case 'Plot Summary':
											description=element2['_'];
											break;
										case 'Number of episodes':
											episode_count=parseInt(element2['_']);
											break;
										case 'Running time':
											if (element2['_'] && 'half hour'==element2['_'].toLowerCase()) {
												length=30;
											} else if (element2['_'] &&'one hour'==element2['_'].toLowerCase()) {
												length=60;
											} else {
												length=parseInt(element2['_']);
											}
											break;
										case 'Vintage':
											vintage=element2['_'];
											break;
									}
								});
							}
                            
                            slug_value=slug(element['$']['name'] + '-' + vintage.substring(0, 10));
				
                            var series = db.get('series');
                            series.insert({ 
                                slug: slug_value,
                                title: title, 
                                title2: title2, 
                                title3: title3, 
                                type: type, 
                                description: description, 
                                episode_count: episode_count, 
                                length: length, 
                                vintage: vintage, 
                                official_tags: official_tags 
                            });
                            
							if (element['episode']) {
								element['episode'].forEach(function(element2, index2, arr2) {
                                    var episodes = db.get('episodes');
									var episode_number = parseFloat(element2['$']['num']);
									var episode_title = element2['title'][0]['_'];
                                    
                                    var episodes = db.get('episodes');
                                    episodes.insert({
                                        series_slug: slug_value,
                                        number: episode_number,
                                        title: episode_title
                                    });
								});
							}
						});
					}
				});
			});
		}

		http.request(options, callback).end();
		
        setTimeout(cb, 2000);
    },
    function (err) {
		if (err) console.log('[err]' + err);
    }
);
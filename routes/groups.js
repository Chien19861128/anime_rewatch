var express = require('express');
var router = express.Router();
var monk = require('monk');
var slug = require('slug');

var db = monk('127.0.0.1:27017/rewatch');

router.post('/create', function(req, res, next) {
    console.log(req.body);
    console.log(req.user);

	var name = req.body.name;
	var slug_value=slug(req.body.name);
	var description = (req.body.description)?req.body.description:"";
    var discussion_link = (req.body.discussion_link)?req.body.discussion_link:"";
    var admins = [];
    if (req.user.name) admins[0] = req.user.name;
    var links = [];
    if (req.body.ref_link) links[0] = req.body.ref_link;
    var is_active = false;
    var is_private = false;
    
	var group_insert = "INSERT INTO groups(name, slug, description, discussion_link, admins, links, is_active, is_private) VALUES(?, ?, ?, ?, ?, ?, ?, ?)";
	var group_params = [name, slug_value, description, discussion_link, admins, links, is_active, is_private];
				
	client.execute(group_insert, group_params, {prepare: true}, function (err, result) {
		if (!err) {
            var series_slug = req.body.series_slug;
            //var first_time = Date.parse(req.body.first_time);
            var first_time = req.body.first_time;
            var cycle = parseInt(req.body.cycle);
            var episodes = parseInt(req.body.episodes);
            var discussion_time = first_time;
            var e = 0;
            
	        client.execute("SELECT * FROM episodes WHERE series_slug='" + series_slug + "'", function (episodes_err, episodes_result) {
                if (!episodes_err) {
                    
                    for (var i = 0; i<episodes_result.rowLength; i++) {
                        console.log('[discussion_time]'+discussion_time);
						var episode_number = episodes_result.rows[i].number;
							
						var group_schedule_insert = "INSERT INTO group_schedules(group_slug, series_slug, episode_number, discussion_time) VALUES(?, ?, ?, ?)";
						var group_schedule_params = [slug_value, series_slug, episode_number, discussion_time];
                        
                        var ii=0;
						client.execute(group_schedule_insert, group_schedule_params, {prepare: true}, function (err, result) {
							if (err) console.log('[err]' + err);
							//console.log(episode_params);
                            
                            ii++;
                            if (ii==episodes_result.rowLength) {
                                res.redirect('/group/' + slug_value + '/edit');   
                            }
						});
                        
                        e++;
                        if (e==episodes) {
                            e = 0;
                            var d = new Date(discussion_time);
                            d.setDate(d.getDate() + cycle);
                            discussion_time = d;
                        }
                    }
		        }		
	        });
            
        } else {
            console.log('[err]' + err);
        }
	});
});

router.get('/:slug/edit', function(req, res, next) {
    
    if (typeof req.user != 'undefined') {
        
        client.execute("SELECT * FROM groups WHERE slug='" + req.params.slug + "'", function (err, result) {
            if (!err){
                var group = result.rows[0];
                
                if (group.admins==req.user.name || group.admins.indexOf(req.user.name)) {
                    client.execute("SELECT * FROM group_schedules WHERE group_slug='" + req.params.slug + "'", function (group_schedules_err, group_schedules_result) {
                        if (!group_schedules_err){
                            res.render('groups/edit', { 
                                title: group.name,
                                group: group,
                                group_schedules: group_schedules_result.rows
                            });
                        }		
                    });
                } else {
                    res.redirect('/group/'+req.params.slug);
                }
            }
        });
    } else {
        req.session.login_redirect = req.originalUrl;
        res.redirect('/login');
    }
});

router.post('/:slug/edit', function(req, res, next) {
    
	//req.session.login_redirect = req.originalUrl;

	var slug_value=req.body.group_slug;
	var description = (req.body.description)?req.body.description:"";
    var discussion_link = (req.body.discussion_link)?req.body.discussion_link:"";
    var links = [];
    if (req.body.ref_link) links[0] = req.body.ref_link;
    var is_active = (req.body.is_active=="true")?true:false;
    var is_private = false;
    var episode_number_array = req.body.episode_number;
    var discussion_time_array = req.body.discussion_time;
    var discussion_link_array = req.body.schedule_discussion_link;
    
	var group_update = "UPDATE groups SET description=?, discussion_link=?, links=?, is_active=? WHERE slug='"+slug_value+"'";
	var group_params = [description, discussion_link, links, is_active];
				
	client.execute(group_update, group_params, {prepare: true}, function (err, result) {
        
        var ii=0;
        for(var key1 in episode_number_array){ 
            var jj=0;
            for(var key2 in episode_number_array[key1]){ 
                var discussion_time = discussion_time_array[key1][key2];
                var discussion_link = discussion_link_array[key1][key2];
        
                var group_schedule_update = "UPDATE group_schedules SET discussion_time=?, discussion_link=? WHERE group_slug='"+slug_value+"' AND series_slug='"+key1+"' AND episode_number="+episode_number_array[key1][key2];
                var group_schedule_params = [discussion_time, discussion_link];
				
                client.execute(group_schedule_update, group_schedule_params, {prepare: true}, function (err, result) {
                
                    if (err) console.log('[err]' + err);
                    ii++;
                    jj++;
                    if (ii == Object.keys(episode_number_array).length && typeof episode_number_array[key1][key2+1] == 'undefined') {
                        res.redirect('/group/' + slug_value + '/edit');   
                    }
                });
            }
        }
    });
});

module.exports = router;

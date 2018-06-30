// modules
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var ToneAnalyzer = require('watson-developer-cloud/tone-analyzer/v3');
var Crawler = require("crawler");
var config = require("./config");
var favicon = require('serve-favicon');
var path = require('path');

// favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))

// setup
var toneAnalyzer = new ToneAnalyzer(config.ibm);
var crawler = new Crawler({
	maxConnections : 10,
	// This will be called for each crawled page
	callback : function (error, res, done) {
		if(error){
			console.log(error);
		}else{
			var $ = res.$; // cheerio
			var pars = [];
			$("p").each(function(i, element) {
				var content = element.children[0].data;
				pars.push(content)
			});
		}
		done();
	}
});

// json / url support
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
	extended: true
}));

/*
 * To connect to a front end app (i.e. AngularJS) store all your files you will *
 * statically store in declared below (i.e. ./public) *
*/
app.use(express.static('public'));

//post to retrieve tone
app.post('/tone', function (req, res) {
	
	var toneInput = req.body.toneInput;
	var params = {
		"tone_input": toneInput,
		"content_type": "text/plain"
	}

	toneAnalyzer.tone(params,
		function(err, tone) {
			if (err) {
				res.send({
					"error" : error
				});
				console.log(err);
			} 
			else {
				res.send({
					result : {
						"tone" : tone
					}
				});
			}
		}
	);

});

//post to retrieve array of headlines from url
app.post('/crawl', function (req, res) {
	
	var url = req.body.url;

	crawler.queue([{
		uri: url,
	 
		// The global callback won't be called
		callback: function (error, response, done) {
			if(error){
				console.log(error);
				res.send({
					"error" : error
				});
			} 
			else {
				var $ = response.$; // cheerio
				var contents = [];
				
				// grab p contents
				// $("p").each(function(i, element) {
				// 	if(element.children[0]) {
				// 		var content = element.children[0].data;
				// 		contents.push(content);
				// 	}
				// });
				// //also grab a contents? this may make tone less accurate
				// $("a").each(function(i, element) {
				// 	if(element.children[0]) {
				// 		var link = element.children[0].data;
				// 		contents.push(link);
				// 	}
				// });

				// breitbart top stories
				$("h2.title").each(function(i, element) {
					if(element.children[0] && element.children[0].children && element.children[0].children[0]) {
						var headline = element.children[0].children[0].data;
						console.log(headline);
						contents.push(headline);
					}
				});

				// other breitbart?
				// $("em").each(function(i, element) {

				// 	if(element.firstChild && element.firstChild.data) {
				// 		var headline = element.firstChild.data;
				// 		console.log(headline);
				// 		contents.push(headline);
				// 	}
				// });

				// washpo headlines
				$("div.headline").each(function(i, element) {
					if(element.children[0] && element.children[0].children && element.children[0].children[0]) {
						var headline = element.children[0].children[0].data;
						console.log(headline);
						contents.push(headline);
					}
				});

				// nytimes headlines
				$("h2.story-heading").each(function(i, element) {
					if(element.children[0] && element.children[0].children && element.children[0].children[0]) {
						var headline = element.children[0].children[0].data;
						contents.push(headline);
					}
				});

				// grab p contents
				// $("p").each(function(i, element) {
				// 	if(element.children[0]) {
				// 		var content = element.children[0].data;
				// 		contents.push(content);
				// 	}
				// });


				res.send({
					result : {
						"contents" : contents
					}
				});
			}
			done();
		}
	}]);

});

var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;
});

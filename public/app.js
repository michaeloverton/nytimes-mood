var app = angular.module('myApp', []);

app.controller('myCtrl', function($scope, CrawlService, ToneService){

	$scope.toneDescriptions = {
		'sadness' : 'sad',
		'joy' : 'happy',
		'fear' : 'afraid',
		'tentative' : 'tentative',
		'analytical' : 'analytical',
		'confident' : 'confident'
	}

	$scope.getUrlTones = function(url) {

		CrawlService.getContents(url)
			.then(function(data) {
				// useless relic error handling
				if(data.error){
					var errorData = JSON.parse(data.error.data);
					$scope.twitterErrors = errorData.errors[0].message;
				} 
				else if (data.result) {
					// grab crawled headlines and join them with periods
					$scope.contents = data.result.contents;
					$scope.contents = $scope.contents.join('. ');

					// send to tone service
					var toneInput = {"toneInput": $scope.contents};
					return ToneService.getTone(toneInput);
				}

			}).then(function(data) {
				$scope.currentTone = data.result;

				// get the list of overall tones
				var overallTones = [];
				angular.forEach(data.result.tone.document_tone.tones, function (tone) {
					overallTones.push(tone.tone_id);
				});

				// get the list of tones per sentence
				var tones = [];
				angular.forEach(data.result.tone.sentences_tone, function (sentenceTones) {
					angular.forEach(sentenceTones.tones, function (tone) {
						tones.push(tone.tone_id);
					});		        
				});
			});

	}

	$scope.getDominantTone = function(tones) {
		var tone = undefined;
		for(var i=0; i<tones.length; i++ ) {
			var currentTone = tones[i];
			// favor these tones, as joy tends to be a false positive with nytimes
			if(currentTone.tone_id === 'sadness' || currentTone.tone_id === 'fear' || currentTone.tone_id === 'tentative') {
				tone = currentTone.tone_id;
			}
		}
		if(tone == undefined) {
			tone = tones[0].tone_id;
		}
		return tone;
	}

	// just grab from nytimes
	$scope.getUrlTones('http://nytimes.com');
  
});

app.factory('ToneService', function($http, $q){
  
	var getTone = function(toneInput){
		var d = $q.defer();
		$http.post('/tone', toneInput)
		.success(function(tone){
			return d.resolve(tone);
		})
		.error(function(error){
			return d.reject(error);
		});
		
		return d.promise;
	};

	return {
		getTone : getTone
	}
});

app.factory('CrawlService', function($http, $q){
  
	var getContents = function(url){
		var d = $q.defer();
		$http.post('/crawl', {"url": url})
		.success(function(contents){
			return d.resolve(contents);
		})
		.error(function(error){
			return d.reject(error);
		});
		
		return d.promise;
	};

	return {
		getContents : getContents
	}
});

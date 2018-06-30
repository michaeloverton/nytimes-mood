var app = angular.module('myApp', []);

app.controller('myCtrl', function($scope, $http, $interval, CrawlService, MusicService, ToneService){

	$scope.getUrlTones = function(url) {

		CrawlService.getContents(url)
			.then(function(data) {
				
				if(data.error){

					var errorData = JSON.parse(data.error.data);
					$scope.twitterErrors = errorData.errors[0].message;

				} 
				else if (data.result) {

					$scope.contents = data.result.contents;

					console.log($scope.contents);

					$scope.contents = $scope.contents.join('. ');

					//console.log($scope.contents)

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
				console.log(overallTones);

				// get the list of tones per sentence
				var tones = [];
				angular.forEach(data.result.tone.sentences_tone, function (sentenceTones) {

					console.log(sentenceTones);

					angular.forEach(sentenceTones.tones, function (tone) {
						tones.push(tone.tone_id);
					});		        
				});
				console.log(tones);

				// play chords based on the tones
				$scope.newTone = undefined;
				var toneIndex = 0;
				var play = $interval(function() {
					
					$scope.newTone = tones[toneIndex];
					MusicService.playChordProgression($scope.newTone);
					toneIndex++;

					// when we are at the end of the list, stop playing
					if(tones[toneIndex] == undefined) {
						$interval.cancel(play);
					}


				}, 10000);

				//var prog = $interval(MusicService.playChord, 4000, 9);

				//currentTone.result.tone.sentences_tone

			});

	}

  
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
			console.log(contents);
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

app.factory('MusicService', function($interval) {

	var currentChord = 0;

	var playChordProgression = function(tone) {

		// c major
		var majorChords = {
			"I": ["C3", "E3", "G3"],
			"IV": ["F3", "A3", "C4"],
			"V": ["G3", "B3", "D4"]
		}

		// a minor
		// 1, 6, 7
		var minorChords = {
			"1": ["A3", "C4", "E4", "G4"],
			"2": ["B3", "D4", "F4"],
			"3": ["C3", "E4", "G4"],
			"4": ["D3", "F4", "A4", "C5"],
			"5": ["E3", "G4", "B4", "D5"],
			"6": ["F3", "A3", "C4", "E4"],
			"7": ["G3", "B3", "D4"]
		}

		var chords = {};
		var progression = [];
		switch(tone) {
		    // case "anger":
		    case "sadness":
		    case "fear":
		    case "tentative":
		        chords = minorChords;
		        // instead of having corresponding numbers, could just direclty use arrays --
		        // progression = [["A3", "C3", "E4"], 0, 0, ["A3", "C3", "E4"], ...] etc
		        progression = ["1", 0, 0, 0, "6", 0, "5", "6", "7", 0, "3", 0, "1", "3", 0, 0];
		        break;
		    case "confident":
		    case "joy":
		    case "analytical":
		    	chords = minorChords;
		    	progression = ["1", 0, 0, "3", "4", 0, 0, 0, "3", 0, 0, 0, "6", "7", 0, 0];
		    	break;
		    default:
		        chords = minorChords;
		        progression = ["1", 0, "3", "5", "4", 0, 0, 0, "3", 0, "5", 0, "6", 0, 0, 0];
		        break;
		}

		console.log("playing for tone: " + tone);
		console.log("progression: " + progression);

		var step = 0;
		$interval(function() {
			console.log("step: " + step);
			playChord(chords[progression[step]]);
			step++;
		}, 625, 16); // 625 is 1/16 of 10000 - the length of a 16th note

	}

	var playChord = function(notes) {

		console.log("notes: " + notes);
		
		var chordNote = effectedNote('sine', 0.25, 0.5, 0.5);
		chordNote.setVolume(.5);

		if(notes != undefined) {
			// play each note in the chord
			angular.forEach(notes, function(note) {
				chordNote.play({pitch : note });
			});
		}
	}

	function effectedNote(_wave, _attack, _hold, _release) {

		var effectedNote = new Wad({
			source : _wave,
			//pitch : _pitch,
			env     : {
			  attack: _attack,//3.2,
			  hold : _hold,//1,
			  release: _release//2
			}
		});
		return effectedNote;
	}

	return {
		playChordProgression : playChordProgression
	}

});

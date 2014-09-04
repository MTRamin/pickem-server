// test.js

// Shows all the test-names as output
/*
afterEach(function(){
	console.log(this.currentTest.title)
});
*/

var chai = require("chai");

var expect = chai.expect;
var assert = chai.assert;

var parseXML = require('xml2js').parseString;
var moment = require('moment-timezone');

var data = require("../data.js");
var nfldata = require("../nfldata.js");
var passport = require("../passport.js");
var updating = require("../updating.js");

function User (email, password, token) {
	this.email = email;
	this.password = password;
	this.token = token;
}

function Pick(game, user, pick) {
	this.gamekey = game;
	this.user = user;
	this.pick = pick;
}

function Game(home, away, schedule) {
	this.homeScore = home;
	this.awayScore = away;
	this.schedule = schedule;
}

function Schedule() {
	this.week;
	this.gamekey;
	this.season_type;
	this.away;
	this.year;
	this.month;
	this.eid;
	this.time;
	this.home;
	this.wday;
	this.day;
}

function NFLGame(gamekey) {
	this.homeTeam;
	this.awayTeam;

	this.homeScore;
	this.awayScore;

	this.gamekey = gamekey;
	this.season;
	this.week;
	this.type;

	this.kickoff;

	this.quarter;
	this.gameclock;

	this.analyzed = false;
}

describe('testing the pickem server', function() {	
	/*
	before(function (done) {
		database.init(function (error) {
			if (!error) {
				database.games.remove({}, function() {});
				database.picks.remove({}, function() {});
				database.users.remove({}, function() {});
				database.scores.remove({}, function() {});
				database.highscores.remove({}, function() {});

				done();
			}
		});
	});
	*/
	/*
	describe('testing date/time parsing', function () {
		it('parsing NFL date', function() {
			var lastGames = [];
			lastGames.push(new NFLGame("1"));
			lastGames.push(new NFLGame("2"));
			lastGames.push(new NFLGame("3"));
			lastGames.push(new NFLGame("4"));
			lastGames.push(new NFLGame("5"));
			lastGames.push(new NFLGame("6"));

			var currentGames = [];
			currentGames.push(new NFLGame("2"));
			currentGames.push(new NFLGame("4"));
			currentGames.push(new NFLGame("6"));
			currentGames.push(new NFLGame("5"));

			updating.checkForEndedGames(lastGames, currentGames);
		});
	});
	*/
	/*
	describe('testing date/time parsing', function () {
		it('parsing NFL date', function() {
			var game1 = new NFLGame();			
			var game2 = new NFLGame();			
			var game3 = new NFLGame();			
			var game4 = new NFLGame();			
			var game5 = new NFLGame();			


			nfldata.parseNFLDate("2014072100", "11:30", game1);
			nfldata.parseNFLDate("2014072100", "7:30", game2);
			nfldata.parseNFLDate("2014072100", "7:00", game3);
			nfldata.parseNFLDate("2014072100", "10:15", game4);
			nfldata.parseNFLDate("2014072100", "1:59", game5);

			expect(game2.kickoff).to.equal(moment.tz("201407211930", "YYYYMMDDHHmm", "America/New_York").format());
			expect(game3.kickoff).to.equal(moment.tz("201407211900", "YYYYMMDDHHmm", "America/New_York").format());
			expect(game1.kickoff).to.equal(moment.tz("201407212330", "YYYYMMDDHHmm", "America/New_York").format());
			expect(game4.kickoff).to.equal(moment.tz("201407212215", "YYYYMMDDHHmm", "America/New_York").format());
			expect(game5.kickoff).to.equal(moment.tz("201407211359", "YYYYMMDDHHmm", "America/New_York").format());
		});
	});
	*/
	/*
	describe('testing date/time parsing', function () {
		it('parsing NFL date', function() {
			var nfldate = updating.parseNFLDate("2014072100", "6:10");
			var now = moment();

			console.log(nfldate.format());
			console.log(now.format());

			if (now < nfldate) {
				console.log("Befo:re game");
			} else {
				console.log("After game");
			}


		});
	});
	*/

	/*
	describe('simulate NFLweek', function() {
		it('creating test users', function(done) {
			var users = [];
			users.push(new User("test1", 1234, "test1"));
			users.push(new User("test2", 1234, "test2"));
			users.push(new User("test3", 1234, "test3"));
			users.push(new User("test4", 1234, "test4"));
			users.push(new User("test5", 1234, "test5"));
			users.push(new User("test6", 1234, "test6"));			

			database.insert(users, database.users, function (err, data) {
				done();
			});
		});

		it('creating dummy games for database', function(done) {
			var games = [];

			var schedule = new Schedule();
			schedule.week = 1;
			schedule.gamekey = "1";
			schedule.season_type = "REG";
			schedule.away = "TB";
			schedule.year = 2014;
			schedule.month = 7;
			schedule.eid = "2014071800";
			schedule.time = "6:30";
			schedule.home = "PHI";
			schedule.wday = "Fri";
			schedule.day = 18;

			games.push(new Game(10, 0, schedule));

			var schedule2 = new Schedule();
			schedule2.week = 1;
			schedule2.gamekey = "2";
			schedule2.season_type = "REG";
			schedule2.away = "NYG";
			schedule2.year = 2014;
			schedule2.month = 7;
			schedule2.eid = "2014071801";
			schedule2.time = "6:30";
			schedule2.home = "NYJ";
			schedule2.wday = "Fri";
			schedule2.day = 18;

			games.push(new Game(0, 10, schedule2));

			var schedule3 = new Schedule();
			schedule3.week = 1;
			schedule3.gamekey = "3";
			schedule3.season_type = "REG";
			schedule3.away = "SEA";
			schedule3.year = 2014;
			schedule3.month = 7;
			schedule3.eid = "2014071802";
			schedule3.time = "6:30";
			schedule3.home = "GB";
			schedule3.wday = "Fri";
			schedule3.day = 18;

			games.push(new Game(7, 3, schedule3));

			database.insert(games, database.games, function (err, data) {
				done();
			});

		});

		it('creating picks', function() {
			data.insertPick("1", "test1", "HOME", function() {});
			data.insertPick("1", "test2", "AWAY", function() {});
			data.insertPick("1", "test3", "HOME", function() {});
			data.insertPick("1", "test4", "HOME", function() {});
			data.insertPick("1", "test5", "AWAY", function() {});
			data.insertPick("1", "test6", "AWAY", function() {});
			data.insertPick("2", "test1", "HOME", function() {});
			data.insertPick("2", "test2", "AWAY", function() {});
			data.insertPick("2", "test3", "HOME", function() {});
			data.insertPick("2", "test4", "HOME", function() {});
			data.insertPick("2", "test5", "AWAY", function() {});
			data.insertPick("2", "test6", "AWAY", function() {});
			data.insertPick("3", "test1", "HOME", function() {});
			data.insertPick("3", "test2", "AWAY", function() {});
			data.insertPick("3", "test3", "HOME", function() {});
			data.insertPick("3", "test4", "HOME", function() {});
			data.insertPick("3", "test5", "AWAY", function() {});
			data.insertPick("3", "test6", "AWAY", function() {});
		});

		var schedule3 = '<ss><gms w="0" y="2014" t="P" gd="0" bph="0"><g eid="2014071802" gsis="1" d="Fri" t="6:30" q="1" h="BUF" hnn="bills" hs="0" v="NYG" vnn="giants" vs="0" rz="0" ga="" gt="PRE"/><g eid="2014070701" gsis="2" d="Sun" t="8:00" q="1" h="BUF" hnn="bills" hs="0" v="NYG" vnn="giants" vs="0" rz="0" ga="" gt="PRE"/><g eid="2014070702" gsis="3" d="Sun" t="8:00" q="P" h="BUF" hnn="bills" hs="0" v="NYG" vnn="giants" vs="0" rz="0" ga="" gt="PRE"/></gms></ss>';
		var schedule2 = '<ss><gms w="0" y="2014" t="P" gd="0" bph="0"><g eid="2014071800" gsis="1" d="Fri" t="6:30" q="1" h="BUF" hnn="bills" hs="0" v="NYG" vnn="giants" vs="0" rz="0" ga="" gt="PRE"/><g eid="2014071801" gsis="2" d="Fri" t="6:30" q="F" h="BUF" hnn="bills" hs="0" v="NYG" vnn="giants" vs="0" rz="0" ga="" gt="PRE"/><g eid="2014071802" gsis="3" d="Fri" t="6:30" q="1" h="BUF" hnn="bills" hs="0" v="NYG" vnn="giants" vs="0" rz="0" ga="" gt="PRE"/></gms></ss>';
		var schedule1 = '<ss><gms w="0" y="2014" t="P" gd="0" bph="0"><g eid="2014071800" gsis="1" d="Fri" t="6:30" q="F" h="BUF" hnn="bills" hs="0" v="NYG" vnn="giants" vs="0" rz="0" ga="" gt="PRE"/><g eid="2014071801" gsis="2" d="Fri" t="6:30" q="F" h="BUF" hnn="bills" hs="0" v="NYG" vnn="giants" vs="0" rz="0" ga="" gt="PRE"/><g eid="2014071802" gsis="3" d="Fri" t="6:30" q="F" h="BUF" hnn="bills" hs="0" v="NYG" vnn="giants" vs="0" rz="0" ga="" gt="PRE"/></gms></ss>';


		it('entering schedule', function(done) {
			parseXML(schedule3, function(err, result) {
				updating.parseSchedule(result, function(err, schedule) {
					updating.analyzeGames(schedule, result, done);
				});
			});
		});	

		it('same schedule, no games ended', function(done) {
			parseXML(schedule3, function(err, result) {
				updating.parseSchedule(result, function(err, schedule) {
					updating.analyzeGames(schedule, result, function() {});
					setTimeout(done, 200);
				});
			});
		});

		it('game 2 has ended', function(done) {
			parseXML(schedule2, function(err, result) {
				updating.parseSchedule(result, function(err, schedule) {
					updating.analyzeGames(schedule, result, function() {});
					setTimeout(done, 200);
				});
			});
		});

		it('game 1 + 3 have ended', function(done) {
			parseXML(schedule1, function(err, result) {
				updating.parseSchedule(result, function(err, schedule) {
					updating.analyzeGames(schedule, result, function() {});
					setTimeout(done, 200);
				});
			});
		});
	});

	*/
});
	/*
	describe('data', function() {
	
		// -------------------------------------------------------------------
		describe('updateGames', function() {
			it('should result in an error with year = 1', function(done) {
				data.updateGames(1, 1, "REG", function(err) {
					expect(err).to.not.equal(null);					done();
				});
			});

			it('should result in an error with week = 0', function(done) {
				data.updateGames(2013, 0, "REG", function(err) {
					expect(err).to.not.equal(null);
					done();
				});
			});

			it('should result in an error with week = 20', function(done) {
				data.updateGames(2013, 20, "REG", function(err) {
					expect(err).to.not.equal(null);
					done();
				});
			});

			it('should result in an error with kind = ASDF', function(done) {
				data.updateGames(2013, 1, "ASDF", function(err) {
					expect(err).to.not.equal(null);
					done();
				});
			});

			it('should work with correct info and empty database', function(done) {
				data.updateGames(2013, 1, "REG", function(err) {
					expect(err).to.be.undefined;
					database.games.find().count(function (err, count) {
						console.log("Documents in database " + count);
						expect(count).to.be.above(0);
					});
					done();
				});
			});

			it('should work with correct info and games in database', function(done) {
				data.updateGames(2013, 1, "REG", function(err) {
					expect(err).to.be.undefined;
					database.games.find().count(function (err, count) {
						console.log("Documents in database " + count);
						expect(count).to.be.above(0);
					});
					done();
				});
			});
		});

		// -------------------------------------------------------------------
		describe('requestGames', function() {
			it('should work with correct info', function(done) {
				data.requestGames(2013, 1, "REG", function(err, result) {
					expect(err).to.be.null;
					expect(result).to.not.equal(null);
					done();
				});
			});

			it('should return an error with games in the future (that have no info yet)', function(done) {
				data.requestGames(2014, 1, "REG", function(err, result) {
					expect(err).to.not.equal.null;
					done();
				});
			});

			it('should result in an error with year = 1', function(done) {
				data.requestGames(1, 1, "REG", function(err, result) {
					expect(err).to.not.equal(null);
					done();
				});
			});

			it('should result in an error with week = 0', function(done) {
				data.requestGames(2013, 0, "REG", function(err, result) {
					expect(err).to.not.equal(null);
					done();
				});
			});

			it('should result in an error with week = 20', function(done) {
				data.requestGames(2013, 20, "REG", function(err, result) {
					expect(err).to.not.equal(null);
					done();
				});
			});

			it('should result in an error with kind = ASDF', function(done) {
				data.requestGames(2013, 1, "ASDF", function(err, result) {
					expect(err).to.not.equal(null);
					done();
				});
			});
		});

		
		// -------------------------------------------------------------------
		describe('updateScores', function() {
			it('inserting users into database', function(done) {
				var users = [];
				users.push(new User("test1", 1234, "test1"));
				users.push(new User("test2", 1234, "test2"));
				users.push(new User("test3", 1234, "test3"));
				users.push(new User("test4", 1234, "test4"));
				users.push(new User("test5", 1234, "test5"));
				users.push(new User("test6", 1234, "test6"));			

				database.insert(users, database.users, function (err, data) {
					done();
				});
			});

			it('inserting picks into database', function(done) {
				var picks = [];
				picks.push(new Pick("55837", "test1", "HOME"));
				picks.push(new Pick("55837", "test2", "AWAY"));
				picks.push(new Pick("55837", "test3", "HOME"));
				picks.push(new Pick("55837", "test4", "HOME"));
				picks.push(new Pick("55837", "test5", "AWAY"));
				picks.push(new Pick("55837", "test6", "HOME"));			

				picks.push(new Pick("55838", "test1", "HOME"));
				picks.push(new Pick("55838", "test2", "HOME"));
				picks.push(new Pick("55838", "test3", "HOME"));
				picks.push(new Pick("55838", "test4", "AWAY"));
				picks.push(new Pick("55838", "test5", "AWAY"));
				picks.push(new Pick("55838", "test6", "AWAY"));

				picks.push(new Pick("55839", "test1", "HOME"));
				picks.push(new Pick("55839", "test4", "AWAY"));
				picks.push(new Pick("55839", "test6", "HOME"));

				database.insert(picks, database.picks, function (err, data) {
					done();
				});
			});

			it('determining winer of game 1', function(done) {
				database.find({"schedule.gamekey" : "55837"}, database.games, function (err, game) {
					data.winnerOfGame(game[0], function (winner) {
						expect(winner).to.equal("HOME");
						done();
					});
				});
			});

			it('determining winer of game 2', function(done) {
				database.find({"schedule.gamekey" : "55838"}, database.games, function (err, game) {
					data.winnerOfGame(game[0], function (winner) {
						expect(winner).to.equal("AWAY");
						done();
					});
				});
			});

			it('determining winer of game 3', function(done) {
				database.find({"schedule.gamekey" : "55839"}, database.games, function (err, game) {
					data.winnerOfGame(game[0], function (winner) {
						expect(winner).to.equal("AWAY");
						done();
					});
				});
			});
			
			it('analyzing picks gor game 1', function(done) {
				data.analyzePicksForGame("55837");

				setTimeout(done, 1000);
			});

			it('analyzing picks gor game 2', function(done) {
				data.analyzePicksForGame("55838");

				setTimeout(done, 1000);
			});

			it('analyzing picks gor game 3', function(done) {
				data.analyzePicksForGame("55839");

				setTimeout(done, 1000);;
			});
			
		});

		describe('parseNFLDate', function() {
			it('should parse date correctly', function() {
				var expected = new Date(2014, 6, 7, 19, 30);

				var nfldate = "'2014070700'";
				var nfltime = "'7:30'";

				var date = updating.parseNFLDate(nfldate, nfltime);

				console.log(expected);
				console.log(date);

				expect(date.getDate()).to.equal(expected.getDate());
			});
		});

		describe('updating', function() {
			// -------------------------------------------------------------------
			
			it('should return a valid schedule', function(done) {
				updating.getSchedule(function(schedule) {
					expect(schedule).to.exist;
					done();
				});
			});
		});

		describe('parseSchedule', function() {
			var schedule1 = '<ss><gms w="0" y="2014" t="P" gd="0" bph="0"><g eid="2014080300" gsis="56426" d="Sun" t="8:00" q="P" h="BUF" hnn="bills" hs="0" v="NYG" vnn="giants" vs="0" rz="0" ga="" gt="PRE"/></gms></ss>';

			var schedule2 = '<ss><gms w="0" y="2014" t="P" gd="0" bph="0"><g eid="2014070700" gsis="56500" d="Sun" t="8:00" q="P" h="BUF" hnn="bills" hs="0" v="NYG" vnn="giants" vs="0" rz="0" ga="" gt="PRE"/></gms></ss>';

			var schedule3 = '<ss><gms w="0" y="2014" t="P" gd="0" bph="0"><g eid="2014070700" gsis="56500" d="Sun" t="5:35" q="1" h="BUF" hnn="bills" hs="0" v="NYG" vnn="giants" vs="0" rz="0" ga="" gt="PRE"/><g eid="2014070701" gsis="56501" d="Sun" t="8:00" q="1" h="BUF" hnn="bills" hs="0" v="NYG" vnn="giants" vs="0" rz="0" ga="" gt="PRE"/><g eid="2014070702" gsis="56502" d="Sun" t="8:00" q="P" h="BUF" hnn="bills" hs="0" v="NYG" vnn="giants" vs="0" rz="0" ga="" gt="PRE"/><g eid="2014070703" gsis="56503" d="Sun" t="8:00" q="P" h="BUF" hnn="bills" hs="0" v="NYG" vnn="giants" vs="0" rz="0" ga="" gt="PRE"/></gms></ss>';


			it('should return a valid schedule with s1', function(done) {
				parseXML(schedule1, function(err, result) {
					updating.parseSchedule(result, function(schedule) {
						expect(schedule).to.exist;
						done();
					});
				});
			});
			it('should return a valid schedule with s2', function(done) {
				parseXML(schedule2, function(err, result) {
					updating.parseSchedule(result, function(schedule) {
						expect(schedule).to.exist;
						done();
					});
				});
			});
			it('should return a valid schedule with s3', function(done) {
				parseXML(schedule3, function(err, result) {
					updating.parseSchedule(result, function(schedule) {
						updating.analyzeGames(schedule, result, done);
					});
				});
			});
		});
	});
	*/


/*
 * Copyright 2014 MTRamin
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// data.js

var database = require("./database");
var updating = require("./updating");
var logger = require("./logger");
var nfldata = require("./nfldata");

var moment = require('moment-timezone');
var async = require('async');

// Data model for a pick
function Pick(game, user, pick) {
	this.gamekey = game; // Game id
	this.user = user; // User name
	this.pick = pick; // pick (HOME/AWAY)
}

// Data model for games in a week of the season
function GamesPerWeek(season, week, type, games) {
	this.season = season; // Season year
	this.week = week; // Season week
	this.type = type; // Season type
	this.games = games; // number of games
}

// Data model for the score of a user
function Score(user, season, week, type) {
	this.user = user; // User name
	this.season = season; // season year
	this.week = week; // season week
	this.type = type; // season type
	this.correct = 0; // correct picks
	this.wrong = 0; // incorrect picks
}

// Data model for a highscore of a user
function Highscore(user, score, wrong, season, type) {
	this.user = user; // user name
	this.correct = score; // correct picks
	this.wrong = wrong; // incorrect picks
	this.season = season; // season year
	this.type = type; // season type
}

// Data model for the score of a team
function TeamScore() {
	this.team; // team name
	this.season; // season year
	this.type; // season type
	this.w; // wins 
	this.l; // losses
	this.t; // ties
}

function GamesInWeek(games) {
	this.gamesInWeek = games;
}

function Highscores(highscores) {
	this.highscores = highscores;
}

function Games(games) {
	this.games = games;
}

function Scores(scores) {
	this.scores = scores;
}

function Picks(picks) {
	this.picks = picks;
}

function TeamScores(scores) {
	this.teamScores = scores;
}

function GameUser(game, user) {
	this.gamekey = game;
	this.user = user;
}

/**
 * Checks the validity of the season parameters submitted in a request
 */
function checkGameRequestParameters(year, week, kind, callback) {
	if ((year >= 2013) && 
		(week >= 0) &&
		(week <= 17) &&
		(kind == "PRE" || kind == "REG" || kind == "POST")
		){

		callback();
	} else {
		logger.err("Week = " + week);
		logger.err("Year = " + year);
		logger.err("Type = " + kind);
		callback(new Error("Invalid data for game request"));
	}
}

/**
 * Manages games as received by the nfl.com scorestrip.
 * Checks if games need to be updated or inserted into the database
 * If it is new games, also add a DB entry about how many games are played in a week
 */
function manageGames(games, callback) {
	var newGames = false;
	var gameCount = 0;

	async.eachSeries(games, function (game, done) {
		var gamekey = game.gamekey;

		database.contains({"gamekey": gamekey}, database.games, function (err, exists) {
			if (!exists) {
				database.insert(game, database.games, function (err, data) {
					if (err) {
						logger.err(err);
						return callback(err);
					}
					gameCount++;
					newGames = true;
					done();
				});
			} else {
				database.find({"gamekey": gamekey}, database.games, function (err, docs) {
					if (err) {
						logger.err(err);
						return callback(err);
					}

					game.analyzed = docs[0].analyzed;

					database.update({"gamekey": gamekey}, game, database.games, function (err){
						if (err) {
							logger.err(err);
							return callback(err);
						}
						done();
					});
				});
			}
		});
	}, function (err) {
		if (err) {
			return callback(err);
		}
		if (newGames) {
			logger.info("New Games found!");
			logger.info(gameCount + " new games are here to pick!");
			var game = games[0];
			var gamesInWeek = new GamesPerWeek(game.season, game.week, game.type, gameCount);
			database.insert(gamesInWeek, database.gamesInWeek, function (err, data) {
				return callback(err);
			});
		} else {
			return callback();
		}
	});
}

/**
 * Returns games from the database with the provided parameters (usually 1 week of agmes)
 */
function requestGames(year, week, kind, callback) {
	checkGameRequestParameters(year, week, kind, function (err) {
		if (err) {
			return callback(err);
		}

		database.contains({$and: [{"season": year}, {"week": week}, {"type": kind}]}, database.games, function (err, exists) {
			if (exists) {
				database.find({$and: [{"season": year}, {"week": week}, {"type": kind}]}, database.games, function (err, docs) {
					games = new Games(docs);
					return callback(null, games);
				});
			} else {
				return callback(null);
			}
		});
	});
}

/**
 * Inserts a pick into the database after creating it from the data provided
 * Updates already contained picks for that user/game combination in the DB
 */
function insertPick(gamekey, user, pick, callback) {
	
	var gameUser = new GameUser(gamekey, user);

	database.find({"gamekey": gamekey}, database.games, function (err, games) {
		var game = games[0];

		var now = moment();
		var kickoff = moment(game.kickoff).tz("America/New_York");

		// TODO Remove this line, just for debugging
		//kickoff = moment("20150101 00:00", "YYYYMMDD HH:mm");

		// Check if game has already started
		if (now < kickoff) {
			var userPicked = new Pick(gamekey, user, pick);

			database.contains(gameUser, database.picks, function(err, exists) {
				if (!exists) {
					database.insert(userPicked, database.picks, callback);
				} else {
					database.update(gameUser, userPicked, database.picks, callback);
				}
			});
		} else {
			callback("Game has already started");
		}

		insertScoreEntries(user, game.season, game.week, game.type);
	});
}

/**
 * Inserts score and highscore entries into the respective databases
 */
function insertScoreEntries(user, season, week, type) {
	updateScoreEntry(user, season, week, type, 0, 0, function () {});
	updateHighscoreEntry(user, season, week, type, 0, 0, function() {});
}

/**
 * Returns picks for a user and games combination from the database
 */
function getPicks(user, games, callback) {
	var results = [];

	async.each(games, function (game, done) {
		var gameKey = game.gamekey;
		var thisGame = new GameUser(gameKey, user);

		database.find(thisGame, database.picks, function(err, pick) {
			if (pick.length != 0) {
				results.push(pick[0]);
			}
			done();
		});

	}, function (err) {
		if (err) {
			return callback(err);
		}
		return callback(null, new Picks(results));
	});
}

/**
 * Updates the score entry of a user and creates a new entry if necessary
 */
function updateScoreEntry(user, season, seasonWeek, seasonType, correctChange, wrongChange, callback) {
	database.contains({$and: [{"user": user}, {"season": season}, {"week": seasonWeek}, {"type": seasonType}]}, database.scores, function (err, exists) {
		if (err) {
			logger.err(err);
			return callback(err);
		}

		if (exists) {
			database.find({$and: [{"user": user}, {"season": season}, {"week": seasonWeek}, {"type": seasonType}]}, database.scores, function (err, users) {
				if (err) {
					logger.err(err);
					return callback(err);
				}

				var userScore = users[0];
				userScore.correct += correctChange;
				userScore.wrong += wrongChange;

				database.update({$and: [{"user": user}, {"season": season}, {"week": seasonWeek}, {"type": seasonType}]}, userScore, database.scores, function () {
					return callback();
				});
			});
		} else {
			var userScore = new Score(user, season, seasonWeek, seasonType);
			userScore.correct += correctChange;
			userScore.wrong += wrongChange;

			database.insert(userScore, database.scores, function (err, result) {
				if (err) {
					logger.err(err);
					return callback(err);
				}
				return callback();
			});
		}
	});
}

/**
 * Updates the highscore entry of a user and creates a new entry if necessary
 */
function updateHighscoreEntry(user, season, seasonWeek, seasonType, correctChange, wrongChange, callback) {
	database.contains({$and: [{"user": user}, {"season": season}, {"type": seasonType}]}, database.highscores, function (err, exists) {
		if (err) {
			logger.err(err);
			return callback(err);
		}

		if (exists) {
			database.find({$and: [{"user": user}, {"season": season}, {"type": seasonType}]}, database.highscores, function (err, users) {
				if (err) {
					logger.err(err);
					return callback(err);
				}

				var userScore = users[0];
				userScore.correct += correctChange;
				userScore.wrong += wrongChange;

				database.update({$and: [{"user": user}, {"season": season}, {"type": seasonType}]}, userScore, database.highscores, function () {
					return callback();
				});
			});
		} else {
			var highscore = new Highscore(user, correctChange, wrongChange, season, seasonType);

			database.insert(highscore, database.highscores, function (err, result) {
				if (err) {
					logger.err(err);
					return callback(err);
				}
				return callback();
			});
		}

	});
}

/**
 * Updates the score entries for the user. Calls for highscore and score changes
 */
function updateUserScore(user, season, seasonWeek, seasonType, correctChange, wrongChange, callback) {
	updateScoreEntry(user, season, seasonWeek, seasonType, correctChange, wrongChange, function(err) {
		if (!err) {
			updateHighscoreEntry(user, season, seasonWeek, seasonType, correctChange, wrongChange, function(err) {
				if (!err) {
					return callback();
				}
			});
		}
	});
}

/**
 * Updates the teams score entry in the database and creates a new entry if necessary
 */
function updateTeamScoreEntry(team, season, seasonType, wChange, lChange, tChange, callback) {
	database.contains({$and: [{"team": team}, {"season": season}, {"type": seasonType}]}, database.teamScores, function (err, exists) {
		if (err) {
			logger.err(err);
			return callback(err);
		}

		if (exists) {
			database.find({$and: [{"team": team}, {"season": season}, {"type": seasonType}]}, database.teamScores, function (err, teams) {
				if (err) {
					logger.err(err);
					return callback(err);
				}

				var teamScore = teams[0];
				teamScore.w += wChange;
				teamScore.l += lChange;
				teamScore.t += tChange;


				database.update({$and: [{"team": team}, {"season": season}, {"type": seasonType}]}, teamScore, database.teamScores, function () {
					return callback();
				});
			});
		} else {
			var teamScore = new TeamScore();
			teamScore.team = team;
			teamScore.season = season;
			teamScore.type = seasonType;
			teamScore.w = wChange;
			teamScore.l = lChange;
			teamScore.t = tChange;


			database.insert(teamScore, database.teamScores, function (err, result) {
				if (err) {
					logger.err(err);
					return callback(err);
				}
				return callback();
			});
		}

	});
}

/**
 * Updates the teams score after a game and calls for it to be entered into the database
 */
function updateTeamScoresAfterGame(game, winner, callback) {
	var homeTeam = game.homeTeam;
	var awayTeam = game.awayTeam;
	
	var season = game.season;
	var seasonType = game.type;

	var tChange = 0;
	var homeWChange = 0;
	var awayWChange = 0;
	var homeLChange = 0;
	var awayLChange = 0;

	if (winner == "HOME") {
		homeWChange += 1;
		awayLChange += 1;
	} else if (winner == "AWAY") {
		homeLChange += 1;
		awayWChange += 1;
	} else if (winner = "TIE") {
		tChange += 1;
	}

	updateTeamScoreEntry(homeTeam, season, seasonType, homeWChange, homeLChange, tChange, function (err) {
		if (!err) {
			updateTeamScoreEntry(awayTeam, season, seasonType, awayWChange, awayLChange, tChange, function (err) {
				if (!err) {
					return callback();
				}
			});
		}
	});
}

/**
 * Determines the winner of a game according to the scores
 */
function winnerOfGame(game, callback) {
	var home = parseInt(game.homeScore);
	var away = parseInt(game.awayScore);

	if (home > away) {
		var winner = "HOME";
	} else if (away > home) {
		var winner = "AWAY";
	} else if (ĥome == away) {
		var winner = "TIE";
	}

	callback(winner);
}

/**
 * Analyzes all picks entered for a game
 * Finds the game to be analyzed by its gamekey, determines its winner and updates all scores
 * for users and teams after
 */
function analyzePicksForGame(gamekey, callback) {
	logger.info("Analyzing picks for game " + gamekey);

	// Find the game to be analyzed
	database.find({"gamekey": gamekey}, database.games, function (err, game) {
		if (err) {
			logger.err(err);
			return callback(err);
		}
		game = game[0];

		var season = game.season;
		var seasonWeek = game.week;
		var seasonType = game.type;

		// Set Game to "ANALYZED"
		game.analyzed = true;
		database.update({"gamekey": gamekey}, game, database.games, function (err, docs) {
			if (err) {
				logger.err(err);
				return callback(err);
			}
		});

		// Determine the winning team of the game			
		winnerOfGame(game, function (winner) {

			logger.info("Game " + game.gamekey + " was won by " + winner + " with a score of " + game.homeScore + ":" + game.awayScore);

			updateTeamScoresAfterGame(game, winner, function (err) {
				// Find all the picks that were made for this game
				database.find({"gamekey" : gamekey}, database.picks, function (err, picks) {
					if (err) {
						logger.err(err);
						return callback(err);
					}

					logger.info("Analyzing " + picks.length + " picks for game " + gamekey);

					// Check each pick if it is correct
					async.eachSeries(picks, function (pick, done) {
						if (pick.pick == winner) {
							// Add points to the users score
							updateUserScore(pick.user, season, seasonWeek, seasonType, 1, 0, function (err) {
								done();
							});
						} else {
							updateUserScore(pick.user, season, seasonWeek, seasonType, 0, 1, function (err) {
								done();
							});
						}
					}, function (err) {
						if (err) {
							return callback(err);
						}
						logger.info("All picks for game " + gamekey + " have been analyzed");
						return callback();
					});
				});

			});

		});
	});
}

/**
 * Checks all games of a season for games that have not been analyzed yet
 * This can happen because heroku shuts down the server after 1h of 
 * inactivity
 */
function checkAllGamesForFinished(season) {
	database.find({"season" : season}, database.games, function (err, games) {
		if (err) {
			logger.err(err);
			return callback(err);
		}

		async.eachSeries(games, function (game, done) {
			if (((game.quarter == "F") || (game.quarter == "FOT")) && (game.analyzed == false)) {
				logger.info(game.gamekey + " missing");
				analyzePicksForGame(game.gamekey, function (err) {
					done();
				});
			} else {
				done();
			}
		});
	});
}

function findScoreForUser(user, season, type, callback) {
	database.find({$and: [{"user": user}, {"season": season}, {"type": type}]}, database.scores, function (err, scores) {
		if (err) {
			logger.err(err);
			return callback(err);
		}

		return callback(null, new Scores(scores));
	});
}

function getScoresForWeek(season, type, week, callback) {
	database.find({$and: [{"week": week}, {"season": season}, {"type": type}]}, database.scores, function (err, scores) {
		if (err) {
			logger.err(err);
			return callback(err);
		}

		return callback(null, new Highscores(scores));
	});
}

function getHighscores(callback) {
	var currentSeason = nfldata.getSeasonInfo();

	database.find({$and: [{"season": currentSeason.season}, {"type": currentSeason.type}]}, database.highscores, function (err, scores) {
		if (err) {
			logger.err(err);
			return callback(err);
		}
		
		return callback(null, new Highscores(scores));		
	});
}

function getTeamScores(callback) {
	var currentSeason = nfldata.getSeasonInfo();

	database.find({$and: [{"season": currentSeason.season}, {"type": currentSeason.type}]}, database.teamScores, function (err, scores) {
		if (err) {
			logger.err(err);
			return callback(err);
		}
		
		return callback(null, new TeamScores(scores));		
	});
}

function getGamesPerWeek(callback) {
	var currentSeason = nfldata.getSeasonInfo();

	database.find({$and: [{"season": currentSeason.season}, {"type": currentSeason.type}]}, database.gamesInWeek, function (err, games) {
		if (err) {
			logger.err(err);
			return callback(err);
		}
		
		return callback(null, new GamesInWeek(games));		
	});
}

exports.getScoresForWeek = getScoresForWeek;
exports.getGamesPerWeek = getGamesPerWeek;
exports.getTeamScores = getTeamScores;
exports.checkAllGamesForFinished = checkAllGamesForFinished;
exports.manageGames = manageGames;
exports.getHighscores = getHighscores;
exports.findScoreForUser = findScoreForUser;
exports.winnerOfGame = winnerOfGame;
exports.analyzePicksForGame = analyzePicksForGame;
exports.requestGames = requestGames;
exports.insertPick = insertPick;
exports.getPicks = getPicks;
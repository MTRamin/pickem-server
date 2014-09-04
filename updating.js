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

// updating.js
var data = require("./data.js");
var logger = require("./logger.js");
var nfldata = require("./nfldata.js");

var moment = require('moment-timezone');
var async = require('async');
var http = require('http');
var parseXML = require('xml2js').parseString;

var activeGames = [];
var nextGameDate = moment("20990101", "YYYYMMDD"); // Set very far in the future -- will be set to real next game at server start

/**
 * Initialize nfl game data updates
 * Schedules the first update and checks all games in the database if they have not been analyzed yet
 */
function init(callback) {
	scheduleUpdate(function () {

		checkForMissedGames();
		return callback();
	});
}

/**
 * Checks all games if they have finished and not been analyzed yet
 * This is needed, because Heroku shuts down the server after inactivity
 * This can mess with the update functionality, so checking this at the start is nessecary
 * The update will be limited to the current season only (type included)
 */
function checkForMissedGames() {
	var season = nfldata.getSeasonInfo().season;
	logger.info("Checking all games of the " + season + " season for missed games");

	data.checkAllGamesForFinished(season);
}

/**
 * Gets new game data from the scorestrip, manages that data and analyzes it 
 * to determine the date of the next update
 */
function scheduleUpdate(callback) {
	nfldata.getGames(function (error, games) {
		if (error) {
			logger.err(error);
			return callback(error);
		}
		data.manageGames(games, function (error) {
			if (error) {
				callback(error);
			}

			analyzeGames(games, callback);
		});
	});
}

/**
 * Analyzes games to determine if games are active and sets
 * the next update timer accordingly
 */
function analyzeGames(games, callback) {
	findActiveGames(games, function (gameActive) {
		if (gameActive) {
			setGameActiveUpdateTimer();
			callback();
		} else {
			updateNextGameDate(games);
			setNextGameUpdateTimer();	
			callback();	
		}
	});
}

/**
 * Sets a short update timer
 * Gets called in case games are currently active
 */
function setGameActiveUpdateTimer() {
	var updateDate = moment();
	updateDate.minutes(moment().minutes() + 5);

	logger.info("Active game, updating again soon");
	setUpdateTimer(updateDate);
}

/**
 * Searches for the next kickoff, if it is still far away
 * sets the update timer for about half a day in the future to update again
 */
function setNextGameUpdateTimer() {
	logger.info("No active game, updating for next game");

	var now = moment();

	var tomorrow = moment();
	tomorrow.date(now.date() + 1);

	var halfDay = moment();
	halfDay.hours(now.hours() + 12);

	var gameStart = nextGameDate;
	gameStart.minutes(gameStart.minutes() + 1);

	if (nextGameDate > tomorrow) {
		setUpdateTimer(halfDay);
	} else {
		setUpdateTimer(gameStart);
	}
}

/**
 * Compares two arrays of games to check if games, which were active
 * last update cycle have now ended. Calls to analyze ended games.
 */
function checkForEndedGames(lastActiveGames, activeGames) {
	var endedGames = [];

	// Check for games that are in "lastActiveGames" but not in "activeGames" 
	// - i.e. games that have ended since last update
	for (i = 0; i < lastActiveGames.length; i++) {
		var stillActive = false;

		for (j = 0; ((j < activeGames.length) && !stillActive); j++) {
			if (lastActiveGames[i].gamekey == activeGames[j].gamekey) {
				stillActive = true;
			}
		}

		if (!stillActive) {
			endedGames.push(lastActiveGames[i]);
		}
	}

	// Analyze ended games
	async.eachSeries(endedGames, function (game, done) {
		var gamekey = game.gamekey;
		
		data.analyzePicksForGame(gamekey, function (err) {
			done();
		});
		
	}, function (err) {
		if (err) {
			return callback(err);
		}
	});
}

/**
 * Finds active games in an array of games
 * Checks for ended games if games were active last update cycle
 */
function findActiveGames(games, callback) {

	var lastActiveGames = activeGames;
	var currentActiveGames = [];

	async.eachSeries(games, function (game, done) {
		var quarter = game.quarter;

		if (quarter != "P" && quarter != "F" && quarter != "FOT") {
			currentActiveGames.push(game);
		}

		done();
	}, function (err) {
		if (err) {
			return callback(err);
		}
		// Only check for ended games if games were active on last update
		if (lastActiveGames.length > 0) {
			checkForEndedGames(lastActiveGames, currentActiveGames);
		}
		activeGames = currentActiveGames;

		logger.info("There are " + currentActiveGames.length + " active games");
		callback(currentActiveGames.length > 0);

	});
}

/**
 * Updates the date of the next kickoff from a list of games
 */
function updateNextGameDate(games) {
	// Reset next game date if nessecary
	if (nextGameDate < now) {
		logger.info("Reset nextGameDate");
		nextGameDate = moment("20990101", "YYYYMMDD");
	}

	var now = moment();

	async.eachSeries(games, function (game, done) {
		var kickoff = moment(game.kickoff).tz("America/New_York");
		logger.info("Game kickoff: " + kickoff.format());

		if (kickoff < nextGameDate && kickoff > now) {
			logger.info("Updated nextGameDate");
			nextGameDate = kickoff;
		}
		done();
	});
}

/**
 * Schedules an update timer to the provided date
 */
function setUpdateTimer(date) {
	var now = moment();
	var ms = date - now;

	setTimeout(function () {
		scheduleUpdate(function(){});
	}, ms);

	logger.info("Update scheduled for " + date.format() + " - that's in " + ms + "ms");
}

exports.init = init;
exports.analyzeGames = analyzeGames;
exports.checkForEndedGames = checkForEndedGames;
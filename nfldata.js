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

// nfldata.js

var logger = require("./logger");

var async = require('async');
var http = require('http');
var parseXML = require('xml2js').parseString;
var moment = require('moment-timezone');

// Data about a nfl game
function NFLGame() {
	this.homeTeam; // Name of home team
	this.awayTeam; // Name of away team

	this.homeScore; // Home team score
	this.awayScore; // Away team score

	this.gamekey; // Game id
	this.season; // Season year
	this.week; // Season week
	this.type; // Season type (PRE/REG/POST)

	this.kickoff; // Time/Date of kickoff

	this.quarter; // current game quarter
	this.gameclock; // current game clock

	this.analyzed = false; // flag if game was analyzed
}

// Info about the current season/week
function NFLSeasonInfo() {
	this.season; // Season year
	this.week; // Season week
	this.type; // Season type (PRE/REG/POST)
}

// Request for the scorestrip xml from nfl.com
var scheduleRequest = {
	hostname: 'www.nfl.com',
	port: 80,
	path: '/liveupdate/scorestrip/ss.xml',
	method: 'GET'
}

var current = new NFLSeasonInfo();

/**
 * Download games data from the scorestrip on nfl.com and parse the 
 * games into an array of games
 */
function getGames(callback) {
	var result = [];

	getCurrentSchedule(function (error, currentGames) {
		if (error) {
			logger.err(error);
			callback(error);
		}

		current.season = currentGames.ss.gms[0].$.y;
		current.week = currentGames.ss.gms[0].$.w;
		current.type = parseType(currentGames.ss.gms[0].$.t);

		var games = currentGames.ss.gms[0].g;

		async.eachSeries(games, function (game, done) {
			var thisGame = new NFLGame();
			thisGame.season = current.season;
			thisGame.week = current.week;
			thisGame.type = current.type;

			thisGame.homeTeam = game.$.h;
			thisGame.awayTeam = game.$.v;

			thisGame.homeScore = game.$.hs;
			thisGame.awayScore = game.$.vs;

			thisGame.gamekey = game.$.gsis;
			
			parseNFLDate(game.$.eid, game.$.t, thisGame);
			parseQuarter(game, thisGame);

			result.push(thisGame);
			done();
		});

		callback(null, result);
		
	});
}

/**
 * Parse the date and time strings contained in the scorestrip
 * and save them in an easier to read format
 */
function parseNFLDate(nfldate, nfltime, game) {
	// Example of NFL Date string
	// "2014080300"
	var dateString = parseInt(nfldate.substring(0,8));

	// Example of NFL Time string
	// time is in Eastern Time (ET)
	// "8:00"

	dateString += " ";
	dateString += nfltime + "PM";

	// Parse NFL Date and Time in ET
	var date = moment.tz(dateString, "YYYYMMDD h:mma", "America/New_York");

	game.kickoff = date.format();
}

/**
 * Parse the quarter as returned by the scorestrip
 * and also parse the gameclock according to the quarter, if it is available
 */
function parseQuarter(data, game) {
	game.quarter = data.$.q;

	if (game.quarter == "P" || game.quarter == "F") {
		game.gameclock = "0:00";
	} else {
		game.gameclock = data.$.k;
	}
}

/**
 * Parse the season type literal into an easier to read format
 */
function parseType(typeAbbr) {
	if (typeAbbr == 'P') {
		return "PRE";
	} else if (typeAbbr == 'R') {
		return "REG";
	} else if (typeAbbr == 'POST') {
		return "POST";
	} else {
		return "unknown";
	}
}

/**
 * Download the current schedule from the nfl.com scorestrip,
 * parse its XML and return it
 */
function getCurrentSchedule(callback) {
	var request = http.get(scheduleRequest, function (response) {
		var str = '';

		response.on('data', function (chunk) {
			str += chunk;
		});

		response.on('end', function () {
			parseXML(str, function (err, result) {
				callback(null, result);
			});
		});
	});

	request.on('error', function (err) {
		logger.err(err);
		return callback(err);
	});
}

function getSeasonInfo() {
	return current;
}

exports.parseNFLDate = parseNFLDate;
exports.getGames = getGames;
exports.getSeasonInfo = getSeasonInfo;
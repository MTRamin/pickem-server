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

// database.js
var database = require('./database');
var logger = require('./logger');

// Retrieve
var MongoClient = require('mongodb').MongoClient;

var dbpath = "temp"
var dbname = "temp";

var pickCollection = "temp";
var gameCollection = "temp";
var userCollection = "temp";
var scoreCollection = "temp";
var highscoreCollection = "temp";
var teamscoreCollection = "temp";
var gamesInWeekCollection = "temp";

var dbuser = 'temp';
var dbpassword = 'temp';


/**
 * Initializes the connection to the database and sets up the exports
 */ 
function init(callback) {
	// Connecto to the database
	MongoClient.connect(dbpath + dbname, function(err, db) {
		if (err) {
			callback(err);
		}

		// Log into database
		db.authenticate(dbuser, dbpassword, function (err, res) {
			if (err) {
				logger.err(err);
				return callback(err);
			}

			if (res == 0) {
				logger.warn("Couldn't authorize database access");
				return callback(err);
			}

			module.exports.db = db;
			module.exports.games = db.collection(gameCollection);
			module.exports.picks = db.collection(pickCollection);
			module.exports.users = db.collection(userCollection);
			module.exports.scores = db.collection(scoreCollection);
			module.exports.highscores = db.collection(highscoreCollection);
			module.exports.teamScores = db.collection(teamscoreCollection);
			module.exports.gamesInWeek = db.collection(gamesInWeekCollection);

			callback();
		});
	});
}

/**
 * Find data in database collection
 */
function find(data, collection, callback) {
	//console.log("Database access: find");

	collection.find(data).toArray(function(err, docs) {
		if (err) {
			logger.err(err);
			return callback(err);
		} 
		return callback(null, docs);
	});
}

/**
 * Check if data exists in a database collection
 */
function contains(data, collection, callback) {
	//console.log("Database access: contains");

	collection.find(data).count(function(err, count) {
		if (err) {
			logger.err(err);
			return callback(err);
		}

		return callback(null, (count != 0));
	});
}

/**
 * Update a document in a collection
 */
function update(query, data, collection, callback) {
	//console.log("Database access: update");

	collection.update(query, data, function(err, result) {
		if (!err) {
			return callback(null, result);
		} else {
			return callback(err);
		}
	});
}

/**
 * Insert data into a collection
 */
function insert(data, collection, callback) {
	//console.log("Database access: insert");

	collection.insert(data, {w:1}, function(err, result) {
		if (!err) {
			return callback(null, result);
		} else {
			logger.err(err);
			return callback(err);
		
		}	
	});
}

exports.insert = insert;
exports.update = update;
exports.init = init;
exports.find = find;
exports.contains = contains;
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

var requestHandlers = require("./requestHandlers");
var database = require("./database.js");
var updating = require("./updating.js");
var logger = require("./logger.js");

var https = require('https');
var express = require('express');
var passport = require('passport');
var bodyParser = require('body-parser');

var app = express();

require('./passport')(passport); // pass passport for configuration

app.use(passport.initialize());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(function (req, res, next) {
	logger.info('%s %s', req.method, req.url);
	next();
});

require('./requestHandlers')(app, passport);

//	========================
//	Start the Server
//	========================
// Connect to database
database.init(function(error) {
	if (error) {
		logger.err(error);
		logger.err("Unable to connect to database");
		throw error;
	}
	logger.info("Connection to database established");

	// Init Game updates
	updating.init(function(error) {
		if (error) {
			logger.err("Unable to set-up update schedule");
			throw error;
		}

		var port = Number(process.env.PORT || 8888);

		// Start server
		app.listen(port);
		logger.info("Server running on port " + port);
	});
});

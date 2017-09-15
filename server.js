// Dependencies
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var cheerio = require('cheerio');
var request = require('request');
var Note = require('./models/Note.js');
var Movie = require('./models/Movie.js');
mongoose.Promise = Promise;

// Initialize Express
var app = express();

app.use(bodyParser.urlencoded({
	extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Database configuration with mongoose
mongoose.connect("mongodb://localhost/mongoscrape");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
	console.log("Mongoose Error: " + error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
	console.log("Mongoose connection successful.");
});

// mongoose routes

// A GET request to scrape the tcm website
app.get("/scrape", function(req, res) {
	// First, we grab the body of the html with request
	request("http://www.tcm.com", function(error, response, html) {
		// Then, we load that into cheerio and save it to $ for a shorthand selector
		var $ = cheerio.load(html);
		// Now, we grab every li tage with class topNavElement within an movie tag, and do the following:
		$('li.topNavElement').each(function(i, element) {
			// Save an empty result object
			var result = {};

			result.title = $(this).children("a").text();
			result.link = $(this).children("a").attr("href");

			var entry = new Movie(result);

			entry.save(function(err, doc) {
				if (err) {
					console.log(err);
				}
				else {
					console.log(doc);
				}
			});
		});
	});

	res.send("Scrape complete");
});

app.get("/movies", function(req, res) {

	Movie.find({}, function(error, doc) {
		if (error) {
			console.log(error);
		}
		else {
			res.json(doc);
		}
	});
});

app.get("/movies/:id", function(req, res) {

	Movie.findOne({ "_id": req.params.id })

	.populate("note")

	.exec(function(error, doc) {
		if (error) {
			console.log(error);
		}
		else {
			res.json(doc);
		}
	});
});

app.post("/movies/:id", function(req, res) {

	var newNote = new Note(req.body);

	newNote.save(function(error, doc) {
		if (err) {
			console.log(err);
		}
		else {
			Movie.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});



app.listen(3000, function() {
	console.log("Running on port 3000");
});
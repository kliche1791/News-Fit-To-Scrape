var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var axios = require("axios");
var cheerio = require("cheerio");
var path = require('path');

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static(path.join(__dirname, '/public')));

// Connect to the Mongo DB
//mongoose.connect("mongodb://localhost/unit18Populater", { useNewUrlParser: true });
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI);
app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

// Routes

// A GET route for scraping the echoJS website
app.get("/", function(req, res) {
  res.render("index");
});

app.get("/scrape", function(req, res) {
  axios.get("https://www.inquirer.com/").then(function(response) {

  // Load the HTML into cheerio and save it to a variable
  // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
  var $ = cheerio.load(response.data);

  // An empty array to save the data that we'll scrape
  var results = [];

  // With cheerio, find each p-tag with the "title" class
  // (i: iterator. element: the current element)
  $("div.card").each(function(i, element) {

    // Save the text of the element in a "title" variable
    var title = $(element).find(".hover-unchanged-color").text();

    var content = $(element).find(".preview-text").text();
    // In the currently selected element, look at its child elements (i.e., its a-tags),
    // then save the values for any "href" attributes that the child elements may have
    var link = $(element).find(".hover-unchanged-color").attr("href");
    if (title || content || link === " "){

    
    // Save these results in an object that we'll push into the results array we defined earlier
    results.push({
      title: title,
      content: content,
      link: link
    });
  }
  });

  // Log the results once you've looped through each of the elements found with cheerio
  console.log(results);

    db.Article.create(results)
          .then(function(dbArticle) {
            // View the added result in the console
            console.log(dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, log it
            console.log(err);
          });
   
  
      // Send a message to the client
      res.send("Scrape Complete");
    });
  });

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  db.Article.find({}, null, {sort: {created: -1}}, function(err, data) {
		if(data.length === 0) {
			res.render("placeholder", {message: "Uh Oh. Looks like we don't have any new articles."});
		}
		else{
     //res.json(data);
      res.render("index", {article: data});
		}
	});
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {

});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {

});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});



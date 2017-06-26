var express = require('express');
var app = express();
var path = require('path');
var base58 = require('./base58.js');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var config = require('./config');
// grab the url model
var Url = require('./models/url');
// create a connection to our MongoDB
mongoose.connect('mongodb://' + config.db.host + '/' + config.db.name);
// handles JSON bodies
app.use(bodyParser.json());
// handles URL encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
// tell Express to serve files from our public folder
app.use(express.static(path.join(__dirname, 'public')));

//EXPRESS ROUTES
//Route to serve up the homepage (index.html)
app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

//Route to create and return a shortened URL given a long URL
app.post('/api/shorten', function(req, res){
  console.log(req.body.url);
  var longUrl = req.body.url;
  var shortUrl = ''; // the shortened URL we will return

  // check if url already exists in database
  Url.findOne({long_url: longUrl}, function (err, doc){
    if (doc){
      // URL has already been shortened
      // base58 encode the unique _id of that document and construct the short URL
      shortUrl = config.webhost + base58.encode(doc._id);

      // since the document exists, we return it without creating a new entry
      res.send({'shortUrl': shortUrl});
    } else {
      // The long URL was not found in the long_url field in our urls
      // collection, so we need to create a new entry

      // The long URL was not found in the long_url field in our urls
      // collection, so we need to create a new entry:
      var newUrl = Url({
        long_url: longUrl
      });

      // save the new link
      newUrl.save(function(err) {
        if (err){
          console.log(err);
        }

        // construct the short URL
        shortUrl = config.webhost + base58.encode(newUrl._id);

        res.send({'shortUrl': shortUrl});
      });
    }
  });
});

//Route to redirect the visitor to their original URL given the short URL
app.get('/:encoded_id', function(req, res){
  var base58Id = req.params.encoded_id;
  var id = base58.decode(base58Id);

  // check if url already exists in database
  Url.findOne({_id: id}, function (err, doc){
    if (doc) {
      // found an entry in the DB, redirect the user to their destination
      res.redirect(doc.long_url);
    } else {
      // nothing found, take 'em home
      res.redirect(config.webhost);
    }
  });
});

var server = app.listen(5000, function(){
  console.log('Server listening on port 5000');
});
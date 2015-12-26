var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
//var logger = require('morgan');
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Hashids = require("hashids"),
hashids = new Hashids("HyperlinkCompressor", 5);
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/urls');
var ShortenedURL = mongoose.model('ShortenedURL', { url: String, short: String, uses:{ type: Number, default: 0}, created: { type: Date, default: Date.now }});

console.log("HyperlinkCompressor Started...");

var app = express();

// view engine setup (jade)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.listen(process.env.PORT, process.env.IP);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

//render homepage
app.get('/', function(req, res) {
  res.render('index', { title: 'Hyperlink Compressor' });
});

//redirect to compressed url
app.route('/:id').all(function (req, res, next) {
    // Get ID
    var id = req.params.id.trim();
    // Look up the URL
    ShortenedURL.findOne({short: id}, function(err, foundUrl) {
        if(err) return console.error(err);
        if(foundUrl) {
            // Redirect user to it
            res.status(301);
            res.set('Location', foundUrl.url);
            res.send();
            
            //increment redirect usage
            foundUrl.uses++;
            console.log("Redirecting /"+id+" -> "+foundUrl.url+" | uses="+foundUrl.uses);
            foundUrl.save(function(err, obj) {
              if(err) return console.error(err);
            });
        }
        else {
          var err = new Error('Error 404 - Not Found');
          err.status = 404;
          next(err);
        }
    });
});


var expression = /(https|http)?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
  
//submit link
app.post('/', function(req, res, next) {
  var url = req.body.url;
  var regex = new RegExp(expression);
  if (url.match(regex) ) {
      
           
           ShortenedURL.findOne({url: url}, function(err, foundUrl) {
             if(err) return console.error(err);
             if(foundUrl) {
               var full = 'https://hyperlinkcompressor-bobacadodl.c9users.io/'+foundUrl.short;
               res.render('display', { message: "Hyperlink Fetched", url: full });
             }
             else {
               ShortenedURL.count({}, function(err, c) {
                 if (err) return console.error(err);
                 var id = hashids.encode(c);
                 var shortUrl = new ShortenedURL({url: url, short: id});
                 shortUrl.save(function (err, shortUrl) {
                    if (err) return console.error(err);
                    var full = 'https://hyperlinkcompressor-bobacadodl.c9users.io/'+shortUrl.short;
                    res.render('display', { message: "Hyperlink Compressed!", url: full });
                    console.log("Compressed url "+url+" -> "+id);
                 });
               });
               
             }
           });
  } else {
    var err = new Error('Invalid URL to Shorten');
    next(err);
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Error 404 - Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

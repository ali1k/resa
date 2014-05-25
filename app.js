/**
 * Module dependencies.
 */
var express = require('express')
    , io = require('socket.io')
    , http = require('http')
    , cronJob = require('cron').CronJob
    , _ = require('underscore')
    , path = require('path');
var annotator=require('./annotator.js');
//Create an express app
var app = express();

//Create the HTTP server with the express app as an argument
var server = http.createServer(app);
var default_port=5555;
if(process.argv[2]){
    default_port = process.argv[2];
}
//Generic Express setup
app.set('port', process.env.PORT || default_port);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
//app.use(express.bodyParser());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

//We're using bower components so add it to the path to make things easier
app.use('/components', express.static(path.join(__dirname, 'components')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

//Our only route! Render it with the current watchList
app.get('/', function(req, res) {
    res.render('index', { data: annotator.watchList });
});

//Start a Socket.IO listen
var sockets = io.listen(server);
//Set the sockets.io configuration.
//THIS IS NECESSARY ONLY FOR HEROKU!
/*
 sockets.configure(function() {
 sockets.set('transports', ['xhr-polling']);
 sockets.set('polling duration', 10);
 });
 */
//If the client just connected, give them fresh data!
sockets.sockets.on('connection', function(socket) {
    socket.emit('data', annotator.watchList);
    socket.on('startA', function(data) {
        annotator.emptyWatchList();
        console.log('start streaming...');
        console.log(data.keywords);
        annotator.start(data.keywords,sockets);
    });
    socket.on('stopA', function(data) {
        console.log('stop streaming...');
        annotator.stop();
    });
    socket.on('pauseA', function(data) {
        console.log('pause streaming...');
        annotator.pause();
    });
    socket.on('removeAll', function(data) {
        annotator.emptyWatchList();
    });
});




//Create the server
server.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
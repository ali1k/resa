var config = require('./config.js');
var twitter = require('ntwitter');

var t = new twitter({
    consumer_key: config.get['twitter_consumer_key'],
    consumer_secret: config.get['twitter_consumer_secret'],
    access_token_key: config.get['twitter_access_token_key'],
    access_token_secret: config.get['twitter_access_token_secret']
});
t.stream('statuses/filter', { track: 'Iran' }, function(stream) {
    stream.on('data', function (data) {
        console.log(data.text);
    });
});

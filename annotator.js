var config = require('./config.js');
var http = require('http');
var twitter = require('ntwitter');
var io = require('socket.io');
var _ = require('underscore');
var path = require('path');
// MongoDB
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/resa_tweets');
//DBpedia Spotlight
var spotlight = require('./spotlight.js');

var watchList = {
    search_for:[],
    tweets_no: 0,
    total: 0,
    recent_tweets:[],
    symbols: {}
};
//Instantiate the twitter component
//You will need to get your own key. Don't worry, it's free. But I cannot provide you one
//since it will instantiate a connection on my behalf and will drop all other streaming connections.
//Check out: https://dev.twitter.com/
var t = new twitter({
    consumer_key: config.get['twitter_consumer_key'],
    consumer_secret: config.get['twitter_consumer_secret'],
    access_token_key: config.get['twitter_access_token_key'],
    access_token_secret: config.get['twitter_access_token_secret']
});
var stop_streaming=0;
var stop=function(){
    stop_streaming=1;
}
var pause_streaming=0;
var pause=function(){
    pause_streaming=1;
}
var start=function(watchSymbols,sockets) {
    stop_streaming=0;
    pause_streaming=0;
    var send_data=0;
    if(!watchSymbols.length){
        return 0;
    }
    watchList.search_for=watchSymbols;
// //Tell the twitter API to filter on the watchSymbols
    t.stream('statuses/filter', { track: watchSymbols }, function(stream) {

        //We have a connection. Now watch the 'data' event for incomming tweets.
        stream.on('data', function(tweet) {
            if(stop_streaming){
                stopStreaming(stream,sockets);
            }
            if(pause_streaming){
                console.log('pause streaming...');
                stream.destroy();
                sockets.sockets.emit('pause',{});
            }
            send_data=1;
            var tweet_text=tweet.text;
// console.log("Tweet: " + tweet_text);
            //Make sure it was a valid tweet
            if (tweet_text !== undefined) {

                spotlight.sendRequest(tweet_text,function(output){
                    console.log('*********************************');
                    console.log(tweet_text);
                    if(output.Resources !=undefined){
                        //store tweets on DB
                         db.get('tweetscollection').insert({"tweet_id":tweet.id,"user_name":tweet.user.screen_name,"created_at":tweet.created_at,"place":tweet.place,"processed":output});
                        //console.log(output);
                        _.each(output.Resources, function(v) {
                            //do not count search keywords
                            if(!_.contains(watchSymbols, v['@surfaceForm'])){
                                //console.log(v['@surfaceForm']+' => '+v['@URI']);
                                if(watchList.symbols[v['@surfaceForm']] ==undefined ){
                                    watchList.symbols[v['@surfaceForm']] = {count:1,type:getEntityType(v['@types']), uri:v['@URI']};
                                    console.log('------>'+v['@surfaceForm']);
                                    //console.log('------>type: '+getEntityType(v['@types']));
                                }else{
                                    watchList.symbols[v['@surfaceForm']].count++;
                                    //Increment total
                                    watchList.total++;
									//limit for demo
									if(Object.keys(watchList.symbols).length>400){
										pause_streaming=1;
									}
                                    //console.log(watchList);
                                }
                                tweet_text=tweet_text.replace(v['@surfaceForm'],'&nbsp;<span resource="'+v['@URI']+'" class="r_entity r_'+getEntityType(v['@types']).toLowerCase()+'" typeOf="'+v['@types']+'">'+v['@surfaceForm']+'</span>&nbsp;');
                            }
                        });
                        //Send to all the clients
                        watchList.tweets_no++;
                        watchList.recent_tweets.push({text:tweet_text,date:tweet.created_at});
                        //watchList.current_tweet.text=tweet.text;
                        //watchList.current_tweet.date=tweet.created_at;
                    }
                })
            }
        });
        //add a threshold to stop service if we got more than 1000 tweets
        if(watchList.tweets_no>1000){
            stopStreaming(stream,sockets);
        }
    });
//acts as a buffer to slow down emiting results
    setInterval(function(){
        if(send_data){
            sockets.sockets.emit('data', watchList);
            watchList.recent_tweets=[];
            send_data=0;
        }
    },1500)
    /*
     //filter out results for scalability
     setInterval(function(){
     var removed_ones=removeWeakSymbols(watchList);
     if(Object.keys(removed_ones).length){
     sockets.sockets.emit('filter', removed_ones);
     }
     },3000)
     */
}
var emptyWatchList=function(){
    watchList.tweets_no=0;
    watchList.total=0;
    watchList.recent_tweets=[];
    watchList.symbols={}
}
var stopStreaming=function(stream,sockets){
 //Reset collection
	db.get('tweetscollection').drop();
    console.log('stop streaming...');
    emptyWatchList();
    stream.destroy();
    sockets.sockets.emit('data', watchList);
    sockets.sockets.emit('stop',{});
}
var getEntityType=function(types_str){
    if(types_str==''){
        return 'Misc';
    }
    var tmp,out='',types_arr=types_str.split(',');
    _.each(types_arr, function(v) {
        tmp=v.split(':');
        if(tmp[0]=='Schema'){
            out= tmp[1];
        }
    })
    if(out){
        return out;
    }else{
        return 'Misc';
    }

}
//TODO:delete low level nodes when we get a huge amount of links
var removeWeakSymbols=function(watchList){
    var filtered_list={};
    var removed_ones={};
    // calculate the count of symbols
    var symbols_no=Object.keys(watchList.symbols).length;
    if(symbols_no>20){
        _.each(watchList.symbols, function (v,i) {
            if(v.count>1){
                filtered_list[i]=v;
            }else{
                removed_ones[i]=v;
            }
        });
        watchList.symbols=filtered_list;
    }
    return removed_ones;
}
module.exports = {
    start: start,
    stop: stop,
    pause: pause,
    watchList: watchList,
    emptyWatchList:emptyWatchList
}
//Reset everything on a new day!
//We don't want to keep data around from the previous day so reset everything.
/*
 new cronJob('0 0 0 * * *', function(){
 //Reset collection
 //db.get('tweetscollection').drop();

 //Reset the total
 watchList.total = 0;

 //Clear out everything in the map
 _.each(watchSymbols, function(v) { watchList.symbols[v] = {}; });

 //Send the update to the clients
 sockets.sockets.emit('data', watchList);
 }, null, true);
 */
var http = require('http');
var querystring = require('querystring');
var config = require('./config.js');
exports.sendRequest=function(input, cb) {
    // Build the post string from an object
    var post_data = querystring.stringify({
        'text' : input,
        'confidence': 0,
        'support' : 20
    });
    var options={
        hostname:config.get['spotlight_host'],
		port:config.get['spotlight_host_port'],
        path:config.get['spotlight_path'],
        method:'POST',
        headers:{
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            'Content-Length': post_data.length
        }
    };
    // Set up the request
    var post_req = http.request(options, function(res) {
        res.setEncoding('utf8');
        var body='';
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            //console.log(body);
            try{
                var output=JSON.parse(body);
            }catch(e){
                var output={};
            }
            cb(output);
        });
    });
    // post the data
    post_req.write(post_data);
    post_req.end();

}
var redis = require('redis')

var http = require('http');
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({});
// REDIS
//var client = redis.createClient(6379, '127.0.0.1', {});

//var target = ['localhost1' , 'localhost2'];
var target = process.env.WEBIP.split(",");
var ctr =0;

var server = http.createServer(function(req, res) {

	var value = target.shift();
	ctr++;
	console.log(ctr + value);
	target.push(value);

	proxy.web(req, res, { target: 'http://' + value });
	
})

server.listen(5050)
console.log('Proxy server listening at port 5050')

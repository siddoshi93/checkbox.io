var redis = require('redis')

var http = require('http');
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({});
// REDIS
//var client = redis.createClient(6379, '127.0.0.1', {});

//var target = ['localhost1' , 'localhost2'];
var target = process.env.WEBIP.split(",");
var ctr =0;

console.log(target)

var server = http.createServer(function(req, res) {

	var value;
//	ctr++;
        var re = /^.*\.(js|css|ico|jpg|png|svg|eot|ttf|woff|txt|html)$/;
     
	//static request
        if(re.test(req.url))
	{   
		//console.log(req.url+ ' ' + value);
		value = target[0]
	}

	else
	{	
		value = target.shift();
		target.push(value);
		console.log(req.url+ ' ' + value);
	}


	proxy.web(req, res, { target: 'http://' + value });
	
})

server.listen(5050)
console.log('Proxy server listening at port 5050')

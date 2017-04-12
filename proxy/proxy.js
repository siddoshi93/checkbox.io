var redis = require('redis')

var http = require('http');
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({});
// REDIS
//var client = redis.createClient(6379, '127.0.0.1', {});

//var target = ['localhost1' , 'localhost2'];
var stable_target = process.env.WEBIP.split(",");
var unstable_target = process.env.UNSTABLEWEBIP.split(",");

console.log(stable_target)
console.log(unstable_target)

//var ctr = 0;

var percent = 25;

var server = http.createServer(function(req, res) {

	var value;
        var re = /^.*\.(js|css|ico|jpg|png|svg|eot|ttf|woff|txt|html)$/;
     
	var chance = Math.random()
//	console.log(chance);
//	console.log(36/100); 
//      console.log((chance * 100 > percent));
        


	//static request
        if(re.test(req.url))
		{   
			//console.log(req.url+ ' ' + value);
			value = stable_target[0]
		}

		else
		{	
		
			if(chance * 100 > percent){
			value = stable_target.shift();
			stable_target.push(value);
			console.log(req.url+ ' ' + value + ' stable');
	}

else
{
	value = unstable_target.shift();
                    unstable_target.push(value);
                        console.log(req.url+ ' ' + value + ' unstable');
}

	}

	
	proxy.web(req, res, { target: 'http://' + value });
	
})

server.listen(5050)
console.log('Proxy server listening at port 5050')

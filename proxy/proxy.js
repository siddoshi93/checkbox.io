
var http = require('http');
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({});

var stable_target = process.env.WEBIP.split(",");
var unstable_target = process.env.UNSTABLEWEBIP.split(",");


console.log(stable_target)
console.log(unstable_target)


var percent = 100;

var server = http.createServer(function(req, res) {

	var value;
	// var re = /^.*\.(js|css|ico|jpg|png|svg|eot|ttf|woff|txt|html)$/;
     
	var chance = Math.random()

	//monitoring
	var starttime = new Date().getTime();
	var latency = 2000;
     
	//static request
 	// if(re.test(req.url))
	// {   
	// 	//console.log(req.url+ ' ' + value);
	// 	value = stable_target[0]
		
	// }

	// else
	// {	
	
	if(chance * 100 > percent || unstable_target.length == 0){
		value = stable_target.shift();
		stable_target.push(value);
		
		//console.log(value)

		proxy.web(req, res, { target: 'http://' + value });

		res.on('finish', function() {
			latency = new Date().getTime() - starttime
	    	console.log(req.url+ ' ' + value + ' stable ' +  latency + 'ms');
	    	
	    });

	}

	else
	{
		value = unstable_target.shift();
		unstable_target.push(value);
		//console.log(value);
		
		proxy.web(req, res, { target: 'http://' + value });

		res.on('finish', function() {
			latency = new Date().getTime() - starttime
	    	console.log(req.url+ ' ' + value + ' unstable ' +  latency + 'ms');
	    	
	    	status  = Math.floor((res.statusCode / 100))

	    	if(status == 4 || status == 5 || latency >= 2000)
	    	{
	    		console.log("Canary alert raised. Closing traffic to unstable versions");
	    		unstable_target=[];
	    	}
	    	
	    });
		
	   	
	}


})

server.listen(5050)
console.log('Proxy server listening at port 5050')

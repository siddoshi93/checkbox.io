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

	//monitoring
	var starttime = new Date().getTime();
	var latency = 500;
     
	//static request
 //    if(re.test(req.url))
	// {   
	// 	//console.log(req.url+ ' ' + value);
	// 	value = stable_target[0]
		
	// }

	// else
	// {	
	
	if(chance * 100 > percent){
		value = stable_target.shift();
		
		
	

		proxy.web(req, res, { target: 'http://' + value });

		res.on('finish', function() {
			latency = new Date().getTime() - starttime
	    	console.log(req.url+ ' ' + value + ' stable ' +  latency + 'ms');
	    	console.log(Math.floor((res.statusCode / 100)))

	    	status  = Math.floor((res.statusCode / 100))

	    	if(status == 4 || status == 5 || latency >= 500)
	    	{
	    		console.log("removing" + value);
	    	}
	    	else
	    	{
	    		stable_target.push(value);
	    	}


	    });
		

	}

	else
	{
		value = unstable_target.shift();
		//unstable_target.push(value);
		
		proxy.web(req, res, { target: 'http://' + value });

		res.on('finish', function() {
			latency = new Date().getTime() - starttime
	    	console.log(req.url+ ' ' + value + ' stable ' +  latency + 'ms');
	    	
	    	status  = Math.floor((res.statusCode / 100))

	    	if(status == 4 || status == 5 || latency >= 500)
	    	{
	    		console.log("removing" + value);
	    	}
	    	else
	    	{
	    		unstable_target.push(value);
	    	}
	    });
		
	   	
	}

	

	


})

server.listen(5050)
console.log('Proxy server listening at port 5050')

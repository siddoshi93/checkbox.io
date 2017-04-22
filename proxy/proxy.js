var redis = require('redis')
var http = require('http')
var httpProxy = require('http-proxy')
var proxy = httpProxy.createProxyServer({});
//REDIS
var client = redis.createClient(6379, "127.0.0.1", {})
//Delete queues if they exist
client.del("stable_target_queue");
client.del("unstable_target_queue");
var stable_target = process.env.WEBIP.split(",");
for (var i = 0; i < stable_target.length; i++) {
	client.lpush("stable_target_queue", stable_target[i]);
}

var unstable_target = process.env.UNSTABLEWEBIP.split(",");
for (var i = 0; i < unstable_target.length; i++) {
	client.lpush("unstable_target_queue", unstable_target[i]);
}

console.log(stable_target)
console.log(unstable_target)

var percent = 25;

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
		//value = stable_target.shift();
		//stable_target.push(value);
		
		//console.log(value)
		client.rpoplpush('stable_target_queue', 'stable_target_queue', function(err, value) {
	    	url = value
	    	console.log("Delivering request to http://" + url) 
	    	proxy.web(req, res, { target: 'http://' + url });

	    	res.on('finish', function() {
				latency = new Date().getTime() - starttime
		    	console.log(req.url+ ' ' + value + ' stable ' +  latency + 'ms');	    	
		    });
	    })	
	}

	else
	{
		value = unstable_target.shift();
		unstable_target.push(value);

		client.rpoplpush('unstable_target_queue', 'unstable_target_queue', function(err, value) {
	    	url = value
	    	console.log("Delivering request to http://" + url) 
	    	proxy.web(req, res, { target: 'http://' + url });

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
	    })		   	
	}
})

server.listen(5050)
console.log('Proxy server listening at port 5050')

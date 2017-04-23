var app = require('express')();
var http = require('http').Server(app);
//var io = require('socket.io')(http);
var redis = require('redis');
var Ansible = require('node-ansible');
var needle = require("needle");
var fs = require('fs');

//var redisClient = redis.createClient(6379, '127.0.0.1', {})
var lock = false;


var serverMap = {};
var config = {};
config.token = process.env.DIGITALOCEAN;

var dropletData = 
		{
			"name":"web",
			"region":"nyc3",
			"size":"512mb",
			"image":"ubuntu-14-04-x64",
			"ssh_keys":[8075842,8403284,8403407],
			"backups":false,
			"ipv6":false,
			"user_data":null,
			"private_networking":null
		};


var headers =
{
	'Content-Type':'application/json',
	Authorization: 'Bearer ' + config.token
};


buildMap();

// io.on('connection', function (socket){
// 	console.log('connection');

// 	socket.on('ding', function() {
// 	   // console.log('ding' + Date.now() );
// 	    socket.emit('dong','down');
// 	});


//   	socket.on('data', function (IP, CPU, memory, latency) {
//     	console.log('IP Address: ', IP, ' CPU: ', CPU, ' mem: ', memory, ' latency: ', latency);

	
// 		if(CPU > 0.7 || memory > 85 || latency > 3000)
// 		{
// 			redisClient.llen("stable_target_queue",function(err,numServers){
// 	    	//console.log(numServers);
	    
// 			    if(numServers > 1){ 
// 			    	//console.log("in");
// 			    	redisClient.lrem("stable_target_queue",0,data['name'],function(err2,reply1){
// 			    		socket.disconnect();
// 			    		console.log("disconnecting" + IP);
// 			    	});
// 			    	//console.log('IP Address: ', IP, ' CPU: ', CPU, ' mem: ', memory);
// 			    	rebootDroplet(IP);
// 				}

// 				else{
					
// 					console.log("only one server remaining");
// 					if(!lock)
// 					{
// 						console.log("spawning new server");
// 						lock = true;
// 						//createDroplet();
// 					}
// 				}
// 	    	});		
// 		}   
// 	});
// });


http.listen(3000, function () {
  	console.log('listening on *:3000');
});

rebootDroplet("107.170.57.73");

function rebootDroplet(ip) {

	var restartData = 
		{
			"type": "reboot"
		};

		console.log("id" + serverMap[ip]);

	needle.post("https://api.digitalocean.com/v2/droplets/" + serverMap[ip] + "/actions", restartData, {headers:headers,json:true}, function(err, resp, body)
	{

		

		console.log(resp)

	});

	//var command = new Ansible.Playbook().playbook('mainReboot');

	//create inventory
	// var entry = "[webserver]\nweb ansible_ssh_host=" + 
	// 	ip + " ansible_ssh_user=root";	
	// fs.writeFile("inventoryReboot", entry, function(err) {
	//     if(err) {
	//         return console.log(err);
	//     }
	//     console.log("Saved temp inventory");
	//     command.inventory('inventoryReboot');
		
	// 	var promise = command.exec();
	// 	promise.then(function(result) {
			

	// 		console.log(result.output);
	// 		console.log(result.code);
	// 		if(result.code == 0)
	// 		{
	// 			redisClient.lpush("stable_target_queue", ip);
	// 		}

	// 	})
	// }); 	
}



// function createDroplet()
// {
// 	needle.post("https://api.digitalocean.com/v2/droplets", dropletData, {headers:headers,json:true}, function(err, resp, body)
// 	{ 


// 		dropletId = body.droplet.id;
// 	 	console.log("Created Droplet: " + dropletId);


// 	 	if(!err && resp.statusCode == 202)
// 		{

// 	 		setTimeout(function tempfun(){ 

// 	 			needle.get("https://api.digitalocean.com/v2/droplets/" + dropletId, {headers:headers}, function( error,response) 
// 	 			{

// 			 		var temp = response.body;
// 			 		var ip_addr = temp.droplet.networks.v4[0].ip_address;
// 					console.log("Public IP Address: " + ip_addr);
			
// 					var command = new Ansible.Playbook().playbook('webSetup');

// 					var entry = "[webserver]\nweb ansible_ssh_host=" + 	ip_addr + " ansible_ssh_user=root";	
					
// 					fs.writeFile("inventoryWeb", entry, function(err) {
// 					    if(err) {
// 					        return console.log(err);
// 					    }
// 					    console.log("Saved temp inventory");
// 					    command.inventory('inventoryWeb');
// 						//command.verbose('v');
// 						var promise = command.exec();
						
// 						promise.then(function(result) {
					

// 							console.log(result.output);
// 							console.log(result.code);
// 							if(result.code == 0)
// 							{
// 								redisClient.lpush("stable_target_queue", ip_addr);
// 								lock = false;
// 							}

// 						})
// 					}); 	

// 			 	}); 
// 		 	}, 4000);
// 	 	}


// 		});

// }



function buildMap()
{

	needle.get("https://api.digitalocean.com/v2/droplets" , {headers:headers}, function( error,response) {

		var droplets = response.body.droplets;
	
		for (var i in droplets)
		{
			var ip_addr = droplets[i].networks.v4[0].ip_address;
			serverMap[ip_addr] = droplets[i].id.toString();
		}
			
		console.log(serverMap);

		//return serverMap;
	});



}

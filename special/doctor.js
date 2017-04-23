
var http = require('http');
var io = require('socket.io')(3000);
var redis = require('redis');
var Ansible = require('node-ansible');
var fs      = require('fs')
var redisClient = redis.createClient(6379, '127.0.0.1', {})
io.on('connection', function (socket) {


var timer= setInterval( function () 
  {
   
    socket.emit('heartbeat');
  }, 5000);


  socket.on('data', function (data) {

    //var temp = data;

    redisClient.llen("stable_target_queue",function(err,numServers){
    	console.log(numServers);
    	if(data['cpu'] > 0.7 && data['memoryLoad'] > 85){
		    if(numServers > 1){ 
		    	console.log("in");
		    	redisClient.lrem("stable_target_queue",0,data['name'],function(err2,reply1){
		    		socket.disconnect();
		    		console.log("disconnecting" + data['name']);
		    	});
		    	console.log(data['name'] + " has cpu" + data['cpu'] + " and mem " + data['memoryLoad']);
		    	//rebootDroplet(data['name'].toString());
			}
			else{
				console.log("only one server remaining");
			}
		}

    });	

    
    });

});

//rebootDroplet("162.243.32.107")
function rebootDroplet(ip) {
	var command = new Ansible.Playbook().playbook('mainReboot');

	//create inventory
	var entry = "[webserver]\nweb ansible_ssh_host=" + 
		ip + " ansible_ssh_user=root";	
	fs.writeFile("inventoryReboot", entry, function(err) {
	    if(err) {
	        return console.log(err);
	    }
	    console.log("Saved temp inventory");
	    command.inventory('inventoryReboot');
		//command.verbose('v');
		var promise = command.exec();
		promise.then(function(result) {
			redisClient.lpush("stable_target_queue", ip);
			console.log(result.output);
			console.log(result.code);
		})
	}); 	
}


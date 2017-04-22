
var http = require('http');
var io = require('socket.io')(3000);
var redis = require('redis');
var redisClient = redis.createClient(6379, '127.0.0.1', {})
io.on('connection', function (socket) {


var timer= setInterval( function () 
  {
   
    io.sockets.emit('heartbeat');
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
			}
			else{
				console.log("only one server remaining");
			}
		}

    });	

    
    });

});


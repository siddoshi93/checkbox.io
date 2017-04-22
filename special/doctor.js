
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
    console.log(data['name'] + " has cpu" + data['cpu'] + " and mem " + data['memoryLoad']);

    });

});


var os = require('os');
var ip = require("ip");
var io = require('socket.io-client');


var data ={};

function memoryLoad()
{
	//console.log( os.totalmem(), os.freemem() );
	return (os.totalmem() - os.freemem()) * 100 / os.totalmem();
}

// Create function to get CPU information
function cpuTicksAcrossCores() 
{
  //Initialise sum of idle and time of cores and fetch CPU info
  var totalIdle = 0, totalTick = 0;
  var cpus = os.cpus();
 
  //Loop through CPU cores
  for(var i = 0, len = cpus.length; i < len; i++) 
  {
		//Select CPU core
		var cpu = cpus[i];
		//console.log(cpu);
		//Total up the time in the cores tick
		for(type in cpu.times) 
		{
			totalTick += cpu.times[type];
		}     
		//Total up the idle time of the core
		totalIdle += cpu.times.idle;
  }
 
  //Return the average Idle and Tick times
  return {idle: totalIdle / cpus.length,  total: totalTick / cpus.length};
}

var startMeasure = cpuTicksAcrossCores();

function cpuAverage()
{
	var endMeasure = cpuTicksAcrossCores(); 
 
	
	var idleDifference = endMeasure.idle - startMeasure.idle;
	var totalDifference = endMeasure.total - startMeasure.total;

	return (totalDifference - idleDifference) * 100 / totalDifference ;
}





var timer = setInterval( function () 
{
	data = { 
		name: ip.address(),cpu: cpuAverage(), memoryLoad: memoryLoad()		
	};


	
}, 5000);



var socket = io.connect('http://107.170.35.42:3000' , {'reconnect': false});
    
socket.once('connect',function () {
	data = { 
		name: ip.address(),cpu: cpuAverage(), memoryLoad: memoryLoad()		
	};

	console.log(ip.address())
	console.log("Client connected")

	 socket.on("heartbeat", function() 
    {
    	console.log(data);
       socket.emit("data", data);
        
    });

    socket.on('disconnect', function () {
		console.log("closing connection")
    	clearInterval(timer);
  	});

});

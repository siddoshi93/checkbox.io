var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('redis');
var Ansible = require('node-ansible');
var needle = require("needle");
var fs = require('fs');
var redisClient = redis.createClient(6379, '127.0.0.1', {})
var lock = false;
var destroyLock = false;
 //"ssh_keys":[6035151,7239385,8423519],
var serverMap = {};
var webServerMap = {}
var config = {};
var ansiblewait = 30000;
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
io.on('connection', function (socket){
 
    console.log('connection');
    socket.on('ding', function() {
    // console.log('ding' + Date.now() );
     socket.emit('dong','down');
    });
    
    socket.on('data', function (IP, CPU, memory, latency) {
     //console.log('IP Address: ', IP, ' CPU: ', CPU, ' mem: ', memory, ' latency: ', latency);
    
        if(CPU > 20 || memory > 85 || latency > 3000)
        {
            console.log('Alert: IP Address: ', IP, ' CPU: ', CPU, ' mem: ', memory, ' latency: ', latency);
            redisClient.llen("stable_target_queue",function(err,numServers){
             //console.log(numServers);
                if(numServers > 1){
                //console.log("in");
                redisClient.lrem("stable_target_queue",0,IP,function(err2,reply1){
                        console.log("Rebooting" + IP);
                        console.log("Removing "+ IP + " from redis until restart" );
                        rebootDroplet(IP);
                });
                 //console.log('IP Address: ', IP, ' CPU: ', CPU, ' mem: ', memory);
                }
                else{
                    if(!lock){
                        console.log("only one server remaining");
                        //console.log(lock)
                     console.log("spawning new server");
                     lock = true;
                     createDroplet();
                    }
                }
            });     
        }
        // Janitor Monkey
        else if(CPU < 10 && memory < 50 && latency < 200 && destroyLock == false){
            destroyLock = true
            console.log("Resource IP: " + IP + " is underused, removing it")
            redisClient.llen("stable_target_queue",function(err,numServers){
            //console.log(numServers);
                if(numServers > 1){
                    redisClient.lrem("stable_target_queue",0,IP,function(err2,reply1){
                        console.log("Removing Resourse, IP: " + IP);
                        destroyDroplet(IP);
                        setTimeout(function(){
                            destroyLock = false
                        } , 20000);
                    });
                };
            })
        }
    });
});
http.listen(3000, function () {
     console.log('listening on *:3000');
});
function rebootDroplet(ip) {
    var restartData =
    {
        "type": "power_cycle"
    };
    console.log("id " + serverMap[ip]);
    needle.post("https://api.digitalocean.com/v2/droplets/" + serverMap[ip] + "/actions", restartData, {headers:headers,json:true}, function(err, resp, body){
        timer1 = setInterval( function () {
            checkstatus(serverMap[ip], function(state, ip_address){
                console.log(state);
                if(state == 'off')
                {
                    clearInterval(timer1);
                    timer2 = setInterval( function () {
                        checkstatus(serverMap[ip],  function(stateinner,ip_address_inner){
                            console.log(stateinner)
                            if(stateinner == 'active')
                            {
                                clearInterval(timer2);
                                    
                                setTimeout(function(){
                                    runansible('reboot','inventoryReboot',ip , false);
                                } , ansiblewait);
                              }
                        });
                    }, 2000);
                }
            });
        }, 2000);
    });
}
function destroyDroplet(ip){
    needle.delete("https://api.digitalocean.com/v2/droplets/" + serverMap[ip], null,  {headers:headers,json:true}, function(err, resp)
    {
        if(resp.statusCode == 204){
            redisClient.lrem("stable_target_queue",0,ip,function(err,reply){
                console.log("Removing IP: "+ ip);
            });
            delete serverMap[ip];
            delete webServerMap[ip];
        }
    });
}
function createDroplet()
{
    needle.post("https://api.digitalocean.com/v2/droplets", dropletData, {headers:headers,json:true}, function(err, resp, body)
    { 
        console.log(resp)
        if(!err && resp.statusCode == 202)
        {
            dropletId = body.droplet.id;
            console.log("Created Droplet: " + dropletId);
            timer = setInterval( function () {
                checkstatus(dropletId, function(state, ip_address){
                    console.log(state);
                    if(state == 'active'){
              
                        clearInterval(timer);
                        serverMap[ip_address] = dropletId+'';
                        //console.log(serverMap);
                        setTimeout(function(){
                            runansible('web','inventoryWeb',ip_address , true);
                        } , ansiblewait);
                
                    }
                });
            }, 2000);
        }
    });
}
function runansible(playbook,filename,ip ,isCreate)
{
    //console.log("running ansible")
    var command = new Ansible.Playbook().playbook(playbook);
    
    var entry = "[webserver]\nweb ansible_ssh_host=" + ip + " ansible_ssh_user=root";   
    
    fs.writeFile(filename, entry, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("Saved temp inventory");
        command.inventory(filename);
        
        command.on('stdout', function(data) { console.log(data.toString()); });
        command.on('stderr', function(data) { console.log(data.toString()); });
        var promise = command.exec();
        promise.then(function(result) {
            
            //console.log(result.output);
            //console.log(result.code);
             if(result.code == 1)
            {
                 if(isCreate)
                {
                    lock = false;
                }
            }   
            if(result.code == 0)
            {
                console.log(ip);
                if(isCreate)
                {
                    lock = false;
                }
                redisClient.lpush("stable_target_queue", ip);
                console.log("Added "+ ip + " to redis" );
            }
        })
    }); 
}
function checkstatus(dropletId, callback){
    needle.get("https://api.digitalocean.com/v2/droplets/" + dropletId, {headers:headers}, function( error,response) {
            
            if(error)
                return '';
               
            else{
                console.log(response.body.droplet.status);
                return callback(response.body.droplet.status, response.body.droplet.networks.v4[0].ip_address);
            }
    });
}
function buildMap()
{
    needle.get("https://api.digitalocean.com/v2/droplets" , {headers:headers}, function( error,response) {
        
        //console.log(response.body);
        var droplets = response.body.droplets;
        
        for (var i in droplets)
        {
            var ip_addr = droplets[i].networks.v4[0].ip_address;
            serverMap[ip_addr] = droplets[i].id.toString();
            if(droplets[i].name.toString().indexOf("web") !== -1){
                webServerMap[ip_addr] = droplets[i].id.toString();
            }
        }
        console.log(serverMap);
        console.log("////////////////////")
        console.log(webServerMap);
        // destroyDroplet("107.170.68.250")
    });
}

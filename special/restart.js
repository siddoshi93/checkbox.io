var needle = require("needle");

var config = {};
config.token = process.env.DIGITALOCEANTOKEN;

var headers =
{
	'Content-Type':'application/json',
	Authorization: 'Bearer ' + config.token
};

var client = {
	restartDroplet: function( onResponse ) {
		var data = 
		{
			"type": "reboot"
		};
		needle.post("https://api.digitalocean.com/v2/droplets/" + id + "/actions", data, {headers:headers,json:true}, onResponse);
	}
}
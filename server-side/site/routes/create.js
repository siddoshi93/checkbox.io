var mongo = require('mongodb');
var crypto = require('crypto');
var emailjs = require('emailjs/email');
var models = require('./studyModel.js');
var redis = require('redis')
var client = redis.createClient(6379, '127.0.0.1', {})
 
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
 
var MongoClient = mongo.MongoClient;
var db = null;

var user = process.env.USERNAME;
var password = process.env.PASSWORD;
var dbip = process.env.DBIP;


MongoClient.connect("mongodb://" + user + ":" + password + "@"+ dbip +":27017/site?authSource=admin", function(err, authdb) {

  // Now you can use the database in the db variable
  db = authdb;
  console.log( err || "connected!" );
});

var emailServer  = emailjs.server.connect({
   user:    "supportemail@domain.com", 
   password:"supportpwd", 
   host:    "smtp.gmail.com", 
   ssl:     true
});

exports.createStudy = function(req, res) {
    client.get("createStudy",function(err,value){
        if(value == "on"){
       
            console.log("on");
            var invitecode = req.body.invitecode; 
            var studyKind = req.body.studyKind;

            if( invitecode != "RESEARCH" )
            {
                res.send({'error':'Invalid invitecode'});
                return;
            }

            basicCreate( req, res, studyKind ).onCreate( function(study)
            {
            	db.collection('studies', function(err, collection) 
            	{
            		if( err )
            			console.log( err );

                	collection.insert(study, {safe:true}, function(err, result) 
                	{
                		console.log( err || "Study created: " + study._id );

                		if( err )
                		{
                			res.send({error: err });
                		}
                		else
                		{
                            study.setPublicLink( study._id );

                            // update with new public link, and notify via email, redirect user to admin page.
                            collection.update( {'_id' : study._id}, {'$set' : {'publicLink' : study.publicLink}},
                                function(err, result )
                            {
                                sendStudyEmail( study );
                                res.send({admin_url: study.adminLink});
                            });
                		}
                	});

                });
            });
        }

        else
        {
             console.log("on");
                res.send({'error':'Feature unavailable'});
             
        }

    })
};


function basicCreate(req, res, kind) 
{
	console.log( kind );
    this.onCreate = function ( onReady )
    {
	    crypto.randomBytes(48, function(ex, buf) 
	    {
	        // alternative: https://github.com/broofa/node-uuid
	        var token = buf.toString('hex');

	        console.log( token );

	        var study = null;
	        if( kind == "survey")
	        {
	        	study = new models.SurveyModel( req.body, token );
	        }
	        if( kind == "dataStudy")
	        {
	        	study = new models.DataStudyModel( req.body, token );
	        }

	        console.log( study );

	        onReady(study);
	    });
	};

	return this;
}

function sendStudyEmail (study) {
    emailServer.send( study.getMessage(), 
        function(err, message) 
        { 
            console.log(err || message); 
        }
    );
}

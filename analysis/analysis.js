var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var fs = require("fs");
var path = require('path');

var errors = "";
var flag = false;

function main()
{
	var args = process.argv.slice(2);
	var startPoint = "../server-side/site";
  
    
    findAllFiles(startPoint,args);    
    
   // args= ['analysis.js']
   // sadavar i =0;

	for(var i = 0;i < args.length;i++){
	var filePath = args[i];
	builders={};
	complexity(filePath);
   
	// Report
	//console.log("\n");
		var len = Object.keys(builders).length;

		if(len != 0)
		{

			console.log("File: " + filePath);
			for( var node in builders )
			{
				var builder = builders[node];
				builder.report(filePath);
			}
			console.log("\n");	
		}
	
	} 


	if(flag)
	{
		console.log("=========Errors========");
		console.log(errors);
		console.log("=======================");
		process.exit(1);

	}

}


var builders = {};


function findAllFiles(startPoint,args)
{
	var files=fs.readdirSync(startPoint);
	files.forEach(function(file) {
        var re = /^.*\.js$/;
        if(file != "node_modules"){
            if (fs.statSync(startPoint + '/' + file) && fs.statSync(startPoint + '/' + file).isDirectory()) {
                findAllFiles(startPoint + '/' + file,args);
            }
            else if(re.test(file)){
                    args.push(startPoint + '/' +file);
            }
        }
    });

	return args;

}


// Represent a reusable "class" following the Builder pattern.
function FunctionBuilder()
{
	this.NumLines = 0;
	this.FunctionName = "";
	this.MaxNestingDepth = 0;
	this.MaxConditions = 0;

	this.report = function(filePath)
	{
		console.log(
		   (
		   	"{0}():" +
		   	"============\n" +
		   	    "NumLines: {1}\t" +
				"MaxNestingDepth: {2}\t" +
				"MaxConditions: {3}\t"
			)
			.format(this.FunctionName, this.NumLines, this.MaxNestingDepth,
			        this.MaxConditions)
		);


	this.err = false;
	this.str = "\nFile name: "+ filePath + "\nFunction Name: "+ this.FunctionName + "\n";

	if(this.NumLines > 100)
	{
		flag = true;
		this.err = true;
		this.str += "Error: Number of line greater than 100\n";
	}

	if(this.MaxNestingDepth > 3)
	{
		flag = true;
		this.err = true;
		this.str += "Error: Big O greater than 3\n";	
	}

	if(this.MaxConditions > 8)
	{
		flag = true;
		this.err = true;
		this.str += "Error: Number of conditions in if greater than 8\n";
	}


	if(this.err)
	{	
		errors += this.str + "\n" ; 
	}
	

	}
};

// A function following the Visitor pattern.
// Annotates nodes with parent objects.
function traverseWithParents(object, visitor)
{
    var key, child;

    visitor.call(null, object);



    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null && key != 'parent') 
            {
            	child.parent = object;
					traverseWithParents(child, visitor);
            }
        }
    }
}


function complexity(filePath)
{
	var buf = fs.readFileSync(filePath, "utf8");
	var ast = esprima.parse(buf, options);

	var i = 0;

	// Tranverse program with a function visitor.
	traverseWithParents(ast, function (node) 
	{
		if (node.type === 'FunctionDeclaration') 
		{
			var builder = new FunctionBuilder();

			builder.FunctionName = functionName(node);
			// number of lines
			builder.NumLines    = node.loc.end.line - node.loc.start.line;

			// if(builder.NumLines > 100)
			// 	{
			// 		console.log("============Error============");
	  //             	console.log("File name: " + filePath);
	  //             	console.log("File location: " + builder.FunctionName);				              
	  //             	console.log("Error: Number of line greater than 100" );
			// 		console.log("=============================");
			// 		//process.exit(1);

			// 	}

			builders[builder.FunctionName] = builder;
            
            // max counts
			traverseWithParents(node, function(child){
				if (child.type === "IfStatement") {
					var temp = 1;
					traverseWithParents(child.test, function(grandChild){
						if(grandChild.operator === '||' || grandChild.operator === '&&'){
							temp += 1;
						}
					});

				builder.MaxConditions = Math.max(temp, builder.MaxConditions);

				}

				// if(builder.MaxConditions > 8)
				// {
				// 	console.log("============Error============");
	   //            	console.log("File location: " + filePath);
	   //            	console.log("Function name: " + builder.FunctionName);				              
	   //            	console.log("Error: Number of conditions in if greater than 8" );
				// 	console.log("=============================");
				// //	process.exit(1);

				// }


				if (isIterator(child)) {

					if(child.depth === undefined)
						child.depth = 1; 

					//console.log(child.depth);
		            builder.MaxNestingDepth = Math.max(builder.MaxNestingDepth, child.depth);

		            traverseWithParents(child.body, function(grandChild){
		              if(isIterator(grandChild)){
		              
		                grandChild.depth = child.depth + 1;
		                builder.MaxNestingDepth = Math.max(builder.MaxNestingDepth, grandChild.depth );
		              	traverseWithParents(grandChild.body, function(greatgrandChild){
			              if(isIterator(greatgrandChild)){
			              
			              	greatgrandChild.depth = grandChild.depth + 1;
			                builder.MaxNestingDepth = Math.max(builder.MaxNestingDepth, greatgrandChild.depth );
			              	traverseWithParents(greatgrandChild.body, function(greatgreatgrandChild){
				              if(isIterator(greatgreatgrandChild)){
				              
				              	greatgreatgrandChild.depth = greatgrandChild.depth + 1;
				                builder.MaxNestingDepth = Math.max(builder.MaxNestingDepth, greatgreatgrandChild.depth );
				    //           	console.log("============Error============");
				    //           	console.log("File location: " + filePath);
				    //           	console.log("Function name: " + builder.FunctionName);				              
				    //           	console.log("Error: Big O is greater than 3" );
								// console.log("=============================");
								//process.exit(1);


				              }
				            });

			              }
			            });

		              }
		            });


				}

			});
		}
		});

}

// Helper function for counting children of node.
function childrenLength(node)
{
	var key, child;
	var count = 0;
	for (key in node) 
	{
		if (node.hasOwnProperty(key)) 
		{
			child = node[key];
			if (typeof child === 'object' && child !== null && key != 'parent') 
			{
				count++;
			}
		}
	}	
	return count;
}


// Helper function for checking if a node is a "decision type node"
function isDecision(node)
{
	if( node.type == 'IfStatement' || node.type == 'ForStatement' || node.type == 'WhileStatement' ||
		 node.type == 'ForInStatement' || node.type == 'DoWhileStatement')
	{
		return true;
	}
	return false;
}


function isIterator(node)
{
	if( node.type == 'ForStatement' || node.type == 'WhileStatement' ||
		 node.type == 'ForInStatement' || node.type == 'DoWhileStatement')
	{
		return true;
	}
	return false;
}

// Helper function for printing out function name.
function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "anon function @" + node.loc.start.line;
}

// Helper function for allowing parameterized formatting of strings.
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}


function crazy()
{

for(var i=0 ; i < 30 ; i++)
{

	for(var i=0 ; i < 30 ; i++)
{
	for(var i=0 ; i < 30 ; i++)
{
	for(var i=0 ; i < 30 ; i++)
{


	
}


	
}


	
}

}




}


main();

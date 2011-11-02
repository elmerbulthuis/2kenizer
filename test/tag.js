var assert = require("assert");
var fs = require('fs');
var Tokenizer = require("2kenizer");

var voidTags = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

function parse(data)	{
	var line = 0;
	var newline = "\n";
	
	var tokenizer = new Tokenizer(function(token, buffer) {
		if(!token) return;

		for(var index = buffer.indexOf(newline); ~index && index < token.index; index = buffer.indexOf(newline, index + newline.length))	{
	line++;
		}

	//console.log(token[0], token.category);

		if(token.category in tokenActions) tokenActions[token.category](token, buffer);
		else throw "invalid category '" + token.category + "' in this context";
	},	{
		"tagComment":	/<!--[\s\S]*?-->/
		, "tag":	/<([\w:]+)/
		, "tag1":	/\s*(\/?)>/
		, "tag2":	/<\/([\w:]+)\s*>/
	});


	var contextStack = [];
	function enterContext(context)	{
		currentContext = context;
		tokenizer.filter(currentContext.filter);
		contextStack.unshift(currentContext);

		//console.log(arguments.callee, currentContext.category);
	}
	function exitContext()	{
		contextStack.shift();
		currentContext = contextStack[0];
		tokenizer.filter(currentContext.filter);
		assert.ok(contextStack.length > 0);

		//console.log(arguments.callee, currentContext.category);
	}

	var tokenActions = {
		"tagComment":	function(token, buffer)	{
		}
		, "tag":	function(token, buffer)	{
			enterContext({
				category:	token.category
				, tag:	token[1]
				, filter:	["tag1"]
			});
		}
		, "tag1":	function(token, buffer)	{
			var tag = currentContext.tag;
			exitContext();
			if(token[1] != "/" && !~voidTags.indexOf(tag.toLowerCase()))	{
				enterContext({
					category:	token.category
					, tag:	tag
					, filter:	["tagComment", "tag", "tag2"]
				});
			}
		}
		, "tag2":	function(token, buffer)	{
			var tag = currentContext.tag;
			
			assert.equal(tag, token[1], "<" + tag + "> at line " + line + " should be closed before closing <" + token[1] + ">");
			exitContext();
		}

	}

	enterContext({
		category:	'root'
		, filter:	["tagComment", "tag"]
	});

	tokenizer.end.apply(tokenizer, arguments);

	assert.equal(contextStack.length, 1, contextStack.map(function(context) {return context.category}));
}


var doTests = process.argv.slice(2);

function testDirectory(dirPath)	{
	fs.readdirSync(dirPath).forEach(function(subPath) {
		var filePath = dirPath + '/' + subPath;
		var fileStat = fs.statSync(filePath);
		if(fileStat.isDirectory()) testDirectory(filePath);
		if(fileStat.isFile()) testFile(filePath);
	});
}

function testFile(filePath, options)	{
	var match = /((.*\/)?(.+))\.html$/i.exec(filePath);
	if (!match) return;

	if(doTests.length && !~doTests.indexOf(match[3]))	{
		return;
	}

	console.log('[' + match[3] + ']');
	try	{
		parse(fs.readFileSync(match[0], 'utf-8'));
	}
	catch(ex)	{
		console.log('[' + match[1] + ']');
		console.log(ex.toString());
	}
}

testDirectory(__dirname + "/../..");




var assert = require("assert");
var path = require('path');
var fs = require('fs');
var Tokenizer = require("../lib/2kenizer");
var tools = require("../lib/tools");

var voidTags = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

describe('html', directoryTest(path.normalize(__dirname + '/../.')));


function directoryTest(rootPath){
	return function(){
		fs.readdirSync(rootPath).forEach(function(subPath) {
			var filePath = path.join(rootPath, subPath);
			var fileStat = fs.statSync(filePath);
			var fileMatch = /^(.+)\.html$/.exec(filePath);

			if(fileStat.isDirectory()) {
				describe(subPath, directoryTest(filePath));
			}
			if(fileStat.isFile() && fileMatch) {
				it(subPath, fileTest(fileMatch[0]));
			}
		});
	}
}

function fileTest(filePath){
	return function(cb){
		parse(filePath, cb);
	}
}


function parse(path, cb)	{
	var currentContext;
	var line = 0;
	var newline = "\n";
	
	var tokenizer = new Tokenizer(function(token, buffer) {
		if(!token.category) return;

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
		tokenizer.categories = currentContext.filter;
		contextStack.unshift(currentContext);

		//console.log(arguments.callee, currentContext.category);
	}
	function exitContext()	{
		contextStack.shift();
		currentContext = contextStack[0];
		tokenizer.categories = currentContext.filter;
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

	var stream = fs.createReadStream(path, {
		encoding: 'utf8'
	});
	stream.pipe(tokenizer);
	stream.on('close', function(){
		assert.equal(contextStack.length, 1, contextStack.map(function(context) {return context.category}));
		stream.destroy();
		cb();
	});

}



var assert = require("assert");
var path = require('path');
var fs = require('fs');
var Tokenizer = require("../lib/2kenizer");
var tools = require("../lib/tools");


describe('js', directoryTest(path.normalize(__dirname + '/../.')));


function directoryTest(rootPath){
	return function(){
		fs.readdirSync(rootPath).forEach(function(subPath) {
			var filePath = path.join(rootPath, subPath);
			var fileStat = fs.statSync(filePath);
			var fileMatch = /^(.+)\.js$/.exec(filePath);

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
	var tokenizer = new Tokenizer(function(token, buffer) {
		if(!token.category) return;

		//console.log(token.category, token[0]);

		if(token.category in tokenActions) tokenActions[token.category](token, buffer);
		else throw "invalid category '" + token.category + "' in this context";
	},	{
		"jsCommentLine":	/\/\/.*?\n/
		, "jsCommentBlock":	/\/\*[\s\S]*?\*\//
		
		, "jsDoubleQuote":	/"(?:\\.|.)*?[^\\]?"/
		, "jsSingleQuote":	/'(?:\\.|.)*?[^\\]?'/
		, "jsRegExp":	/\/(?:\\.|.)+?[^\\]?\/[gim]*/

		, "jsBlock":	"{"
		, "jsBlock1":	"}"
		, "jsGroup":	"("
		, "jsGroup1":	")"
		, "jsArray":	"["
		, "jsArray1":	"]"
	});


	var contextStack = [];
	function enterContext(context)	{
		currentContext = context;
		tokenizer.categories = currentContext.filter;
		contextStack.unshift(currentContext);
	}
	function exitContext()	{
		contextStack.shift();
		currentContext = contextStack[0];
		tokenizer.categories = currentContext.filter;
		assert.ok(contextStack.length > 0);
	}

	var tokenActions = {
		"jsCommentLine":	function(token, buffer)	{
		}
		, "jsCommentBlock":	function(token, buffer)	{
		}
		, "jsDoubleQuote":	function(token, buffer)	{
		}
		, "jsSingleQuote":	function(token, buffer)	{
		}
		, "jsRegExp":	function(token, buffer)	{
		}



		, "jsBlock":	function(token, buffer)	{
			enterContext({
				category:	token.category
				, filter:	["jsCommentLine", "jsCommentBlock", "jsDoubleQuote", "jsSingleQuote", "jsRegExp", "jsBlock", "jsGroup", "jsArray", "jsBlock1"]
			});
		}
		, "jsBlock1":	function(token, buffer)	{
			exitContext();
		}
		, "jsGroup":	function(token, buffer)	{
			enterContext({
				category:	token.category
				, filter:	["jsCommentLine", "jsCommentBlock", "jsDoubleQuote", "jsSingleQuote", "jsRegExp", "jsBlock", "jsGroup", "jsArray", "jsGroup1"]
			});
		}
		, "jsGroup1":	function(token, buffer)	{
			exitContext();
		}
		, "jsArray":	function(token, buffer)	{
			enterContext({
				category:	token.category
				, filter:	["jsCommentLine", "jsCommentBlock", "jsDoubleQuote", "jsSingleQuote", "jsRegExp", "jsBlock", "jsGroup", "jsArray", "jsArray1"]
			});
		}
		, "jsArray1":	function(token, buffer)	{
			exitContext();
		}

	}

	enterContext({
		category:	'root'
		, filter:	["jsCommentLine", "jsCommentBlock", "jsDoubleQuote", "jsSingleQuote", "jsRegExp", "jsBlock", "jsGroup", "jsArray"]
	});

	var stream = fs.createReadStream(path, {
		encoding: 'utf8'
	});
	stream.pipe(tokenizer);
	stream.on('close', function(){
		cb();
		assert.equal(contextStack.length, 1, contextStack.map(function(context) {return context.category}));
		//stream.destroySoon();
	});

}



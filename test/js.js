var assert = require("assert");
var fs = require('fs');
var Tokenizer = require("2kenizer");
var tools = require("../lib/tools");

function parse(data)	{
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

	tokenizer.end.apply(tokenizer, arguments);

	assert.equal(contextStack.length, 1, contextStack.map(function(context) {return context.category}));
}



var root = '../../';

tools
.allFiles(root)
.filter(function(file){
	return /\.js$/.test(file); 
})
.forEach(function(file){
	console.log('[' + file + ']');
	try	{
		parse(fs.readFileSync(root + '/' + file, 'utf-8'));
	}
	catch(ex)	{
		console.log(ex.toString());
	}
})
;


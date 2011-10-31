var assert = require('assert');
var Tokenizer = require('2kenizer');

var tokens = '';
var tokenizer = new Tokenizer(function(token, buffer) {
	if(!token) return;

	tokens += token.category;

},	{
	A:	/[a-zA-Z]{2}/
	, 0:	/[0-9]{2}/
});

tokenizer.write('abcdefghijklmnopqrstuvwxyz');
tokenizer.write('0123456789');
tokenizer.end('abcdefghijklmnopqrstuvwxyz0123456789');

assert.equal('AAAAAAAAAAAAA00000AAAAAAAAAAAAA00000', tokens);

var assert = require('assert');
var Tokenizer = require('2kenizer');

var tokens = '';
var tokenizer = new Tokenizer(function(token, buffer) {
	if(!token) return;

	switch(token.category)	{
		case 'A':
		if(token[0] == 'yz')	{
			tokenizer.filter('0');
		}
		break;
		
		case '0':
		break;
	}

	tokens += token.category;
},	{
	'A':	/[a-zA-Z]{2}/
	, '0':	/[0-9]{2}/
});

tokenizer.write('abcdefghijklmnopqrstuvwxyz');
tokenizer.write('0123456789');
tokenizer.end('abcdefghijklmnopqrstuvwxyz0123456789');

assert.equal('AAAAAAAAAAAAA0000000000', tokens);

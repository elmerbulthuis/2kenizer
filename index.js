/*!
 * 2kenizer
 * Copyright(c) 2011 Elmer Bulthuis <elmerbulthuis@gmail.com>
 * MIT Licensed
 */


/**
add members of the second and following arguments to the first argument
*/
function extend(o) {
    var argumentCount = arguments.length;
    for (var argumentIndex = 1; argumentIndex < argumentCount; argumentIndex++) {
        var argument = arguments[argumentIndex];
        if(!argument) continue;
        for (var argumentKey in argument) {
            o[argumentKey] = argument[argumentKey];
        }
    }
    return o;
}

/**
Transforms an array-like object (like arguments) into an array
*/
function toArray(list)	{
	var result = [];
	var count = list.length;
	for(var index = 0; index < count; index++)	{
		result.push(list[index]);
	}
	return result;
}

/**
takes all elements from list and puts them in another list (result)
when one of the elements in list is an array, concat it to the result.
*/
function flatten(list, result)	{
	if(!result) result = [];
	list.forEach(function(item)	{
		if(Array.isArray(item)) flatten(item, result);
		else result.push(item);
	});
	return result;
}


/**
Efficient tokenizer. Calls tokenCallback on every token
found, looks for categories in expressionSet.
*/
module.exports = function(tokenCallback, expressionSet, options) {
	var options = extend({bufferSize: 1024, bufferLimit: 4096}, options);
    var tokenizer = this;

	/**
	*/
    var buffer = '';

	/**
	matches in the current buffer. Serves as a cache.
	*/
	var matchSet = {};

	/**
	What categories should we look for?
	*/
	var categoryList;


	/**
	write data to the buffer and process it.
	*/
	function write() {
		flatten(toArray(arguments)).forEach(function(argument)	{
			while(argument.length > 0)	{
				var chunk = argument.substring(0, options.bufferLimit);
				argument = argument.substring(chunk.length);
				buffer += chunk;
				if(buffer.length > options.bufferLimit)	{
					flush(options.bufferSize);
				}
			}
		
		});
	}

	/**
	clear the buffer and flush the buffer by calling tokenCallback
	without a token.
	*/
	function end() {
		write.apply(tokenizer, arguments);
		flush(0);
	    tokenCallback.call(tokenizer, null, buffer);
	    buffer = '';
	    matchSet = {};
	}
	
	/**
	process data in the buffer.
	*/
    function flush(bufferSize) {
		var token;
        while(buffer.length > bufferSize && (token = nextToken())) {
        	tokenCallback.call(tokenizer, token, buffer);
			/*
			the offset to which we are going to flush.
			*/
        	var offset = token.match.index + token.match[0].length;
			
			/*
			trim the buffer.
			*/
			buffer = buffer.substr(offset);

			/*
			sync the cache with the buffer.
			*/
			for(var category in matchSet)	{
	            var match = matchSet[category];
				/*
				when the index of the cached match is before the
				offset, it is trimmed off! so remove it from the
				cache
				*/
	            if(match.index < offset) delete matchSet[category];
	            /*
	            if the cached match is not before the offset, it is
	            still in the buffer but if moved a litte to the
	            beginning. So adjust the index.
	            */
	            else match.index -= offset;
			}
			
		}
    }
	
	/**
	finds the next token in the buffer.
	*/
    function nextToken() {
        var token = null;
		categoryList.forEach(function(category) {
            var expression = expressionSet[category];
			/*
			look for a cached match
			*/
            var match = matchSet[category];
			/*
			if there is no cached match
			*/
            if(!match)	{
            	/*
            	if expression is a string we are just going
            	to look for the string.
            	*/
            	if(typeof expression == 'string')	{
	            	var index = buffer.indexOf(expression);
	            	/*
	            	if we found the string (remember, ~-1 == 0) then
	            	mimic the match object returned by RegExp
	            	*/
	            	if(~index)	{
	            		match = extend([
	            			expression
	            		], {
	            			index:	index
	            		});
		           	}
            	}
        		/*
        		if it's not a string, it should be a RegExp. Just execute
        		it.
        		*/
            	else	{
	            	match = expression.exec(buffer);
            	}
            	/*
            	if there is a match, cache it!
            	*/
            	if(match) matchSet[category] = match;
            }
            
			/*
			if there is no token or, if there is a token and it is before
			the current token.
			*/
            if (match && (!token || match.index < token.match.index)) {
				/*
				define a new token.
				*/
                token = {
                    category: category
                    , match: match
                };
            }
		});
		/*
		if there is no token found, this will return null
		*/
        return token;
    }
    
    /**
    specify what categories to look for.
    */
    function filter() {
		categoryList = flatten(toArray(arguments));
		/*
		when there are no arguments, match any category there is.
		*/
    	if(categoryList.length == 0)	{
			for(var category in expressionSet)	{
				categoryList.push(category);
			}
    	}
    }
    
    /*
    initialize empty filter (find any category in expressionSet)
    */
    filter();

	/*
	exporting methods
	*/
	extend(tokenizer, {
		end: end
		, write: write
		, filter: filter
	});
	
}
;


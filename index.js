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
	var tokenSet = {};

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
	    tokenSet = {};
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
        	var offset = token.index + token[0].length;
			
			/*
			trim the buffer.
			*/
			buffer = buffer.substr(offset);

			/*
			sync the cache with the buffer.
			*/
			for(var category in tokenSet)	{
	            var token = tokenSet[category];
				/*
				when the index of the cached match is before the
				offset, it is trimmed off! so remove it from the
				cache
				*/
	            if(token.index < offset) delete tokenSet[category];
	            /*
	            if the cached match is not before the offset, it is
	            still in the buffer but if moved a litte to the
	            beginning. So adjust the index.
	            */
	            else token.index -= offset;
			}
			
		}
    }
	
	/**
	finds the next token in the buffer.
	*/
    function nextToken() {
		var foundToken = null;
		categoryList.forEach(function(category) {
            var expression = expressionSet[category];
			/*
			look for a cached token
			*/
           	var token = tokenSet[category];
			/*
			if there is no cached token
			*/
            if(!token)	{
            	if(expression)	{
                	if(expression.exec){
		        		/*
	            		when there is an exec method on the expression, assume it is
	            		a regular expression and execute it!
	            		*/
		            	var match = expression.exec(buffer);
		            	if(match)	{
		            		token = extend(match, {
		            			category:	category
		            		});
		            	}
	            	}
	            	else{
		            	/*
		            	maybe it's a string!
		            	*/
		            	var index = buffer.indexOf(expression);
		            	/*
		            	if we found the string (remember, ~-1 == 0) then
		            	create a token object
		            	*/
		            	if(~index)	{
		            		token = extend([expression], {
		            			index:	index
		            			, category:	category
		            		});
			           	}
	            	}
	            	/*
	            	if there is a match, cache it!
	            	*/
	            	if(token) tokenSet[category] = token;
	            }
	            else	{
	            	/*
	            	when there is no exrpression, there is always a match!
	            	*/
	            	token = extend([""], {
            			index:	0
            			, category:	category
            		});
	            }
            }
            
			/*
			if there is no token or, if there is a token and it is before
			the current token.
			*/
            if (token && (!foundToken || token.index < foundToken.index)) {
                foundToken = token;
            }

            if(foundToken && foundToken.index <= 0) return false;
		});
		/*
		if there is no token found, this will return null
		*/
        return foundToken;
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


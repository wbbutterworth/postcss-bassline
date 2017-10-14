var postcss        = require( 'postcss' );
var VerticalRhythm = require( './vertical-rhythm' );

var defaults = {
	baseFontSize:   '16px',
	baseLineHeight: '1.5',
};

module.exports = postcss.plugin( 'bassline', function( options ) {

	// iterate over the object and get any property name that's a function
	function getMethodNames( object ) {
		var methodNames = [];

		for ( property in object ) {
			if ( typeof object[property] === 'function' ) {
				methodNames.push( property );
			}
		}

		return methodNames;
	}

	// get parameter array from a function call within a string, e.g. [16, 1px] in "lines( 16, 1px )"
	function getParams( string ) {
		return string.match( /\(([^)]+)\)/ )[1].replace( /["'\s]/g, '' ).trim().split( /,\s?/ );
	}

	return function( css ) {
		options = Object.assign( {}, defaults, options );
		var verticalRhythm = new VerticalRhythm( options );

		css.walkRules( function( rule ) {
			rule.walkDecls( function( decl, i ) {

				// generate a string of method names to use in regular expressions, e.g. font\-size|line\-height
				var regexMethodNames = getMethodNames( verticalRhythm ).join( '|' ).replace( /\-/g, "\\$&" );

				// regular expression for testing declaration for bassline methods
				var regexTest = new RegExp( regexMethodNames, 'g' );

				// regular expression for splitting a declaration string; the delimiter being any
				// custom bassline method names through the closing parenthesis, e.g. "lines( 16, 1px )"
				var regexSplit = new RegExp( `((?:${ regexMethodNames })\\(.*?\\))`, 'g' );

				// test entire declaration value for any instance of a bassline method name
				if ( regexTest.test( decl.value ) ) {

					// split the declaration value using bassline method names as the delimiter
					var valueSegments = decl.value.split( regexSplit );

					// iterate over the value segments and compile output for bassline methods
					var compiledSegments = valueSegments.map( function( segment ) {

						// test value segment for bassline method
						if ( regexTest.test( segment ) ) {

							// get the method name from segment, e.g. "lines" in "lines( 16, 1px )"
							var method = verticalRhythm[ segment.substr( 0, segment.indexOf( '(' ) ) ];

							// get array of parameters from the segment, e.g. ['16', '1px'] in "lines( 16, 1px )"
							var params = getParams( segment );

							// call the method using the parameter array; ensure 'this' is it's parent object
							return method.apply( verticalRhythm, params );
						}
					} );

					// define new declaration value by joining the compiled segments
					decl.value = compiledSegments.join( ' ' );
				}
			} );
		} );
	}
} );

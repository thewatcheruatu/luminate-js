'use strict';

if ( ! Promise ) {
	var Promise; // eslint-disable-line vars-on-top
	
	Promise = function( p ) {
		let self;
		
		self = this;	
		this.resolved = false;
		this.rejected = false;
		this.arguments;
		
		this.resolve = function() {
			self.arguments = arguments;
			self.resolved = true;
		};
		
		this.reject = function() {
			self.arguments = arguments;
			self.rejected = true;
		};
		p.call( self, self.resolve, self.reject );
	};

	
	Promise.prototype.then = function( f ) {
		let self;
		
		self = this;
		if ( self.rejected ) {
			return self;
		}
		if ( ! self.resolved ) {
			setTimeout( function() {
				self.then( f );
			}, 200 );
			return self;
		}
		f.apply( self, self.arguments );
		return self;
	};
	
	Promise.prototype.catch = function( f ) {
		let self;
		
		self = this;
		if ( self.resolved ) {
			return self;
		}
		if ( ! self.rejected ) {
			setTimeout( function() {
				self.catch( f );
			}, 200 );
			return self;
		}
		f.apply( self, self.arguments );
		return self;
	};
}

const GWUtilities = ( function( $ ) {
	let self;
	
	self = {};
	self.loadedStylesheets = [];
	self.loadedScripts = [];
	self.knownClasses = {
		'GWAnimation' : 'gw-animation.min.js',
		'GWMockSelectionLists' : 'gw-mock-selection-lists.js',
		'GWModals' : 'gw-modals.js',
		'GWProgressMeters' : 'gw-progress-meters.js'
	};
	
	self.formatMoney = function( number, options ) {
		options = options || {};
		options.prefix = options.prefix || '$';
		options.displayCents = options.displayCents !== undefined ? options.diplayCents : true;
		options.scale = options.dislayCents === true ? 2 : 0;
		return self.formatNumber( number, options );
	};
	
	self.formatNumber = function( number, options ) {
		let decimalPart;
		let integerPart;
		let formattedNumber;

		options = options || {};
		options.prefix = options.prefix || '';
		options.scale = options.scale || 0;
		number = parseFloat( String( number ).replace( /[$,]/gi, '' ) );
		integerPart = Math.floor( number );
		decimalPart = ( number - integerPart ).toFixed( options.scale );
		formattedNumber = integerPart.toString().replace( /(\d)(?=(\d{3})+$)/g, '$1,' );
		if ( options.scale > 0 ) {
			formattedNumber += decimalPart.substring( 1 );
		}
		return options.prefix + formattedNumber;
	};
	
	self.jQueryVersionGreaterOrEqual = function( foundVersion, desiredVersion ) {
		/*
		 * I wrote this to test for version > 1.7, but eventually decided to use feature detection instead.
		 * But maybe I'll still want it someday.
		 */
		let versionArrayLength;
		
		desiredVersion = desiredVersion.split( '.' );
		foundVersion = foundVersion.split( '.' );
		versionArrayLength = Math.max( desiredVersion.length, foundVersion.length );
		desiredVersion = padArrayToLength( desiredVersion, versionArrayLength, 0 );
		foundVersion = padArrayToLength( foundVersion, versionArrayLength, 0 );
	
		return foundVersion.reduce( function( acc, val, i ) {
			return acc && parseInt( val, 10 ) >= parseInt( desiredVersion[i], 10 );
		} );
	};
	
	self.loadClass = function ( className ) {
		return new Promise( function( resolve, reject ) {
			if ( ! self.knownClasses[className] ) {
				return reject( new Error( 'Unable to load unknown class: ' + className ) );
			}
			self.loadScript( self.knownClasses[className] )
				.then( function() {
					resolve( true );
				} )
				.catch( function( error ) {
					reject( error );
				} );
				
		} );
	};
	
	self.loadScript = function( url ) {
		return new Promise( function( resolve, reject ) {
			if ( self.loadedScripts.indexOf( url ) >= 0 ) {
				return resolve();
			}
			$.getScript( '../js/gwu_wrpr/' + url )
				.done( function() {
					self.loadedScripts.push( url );
					resolve( true );
				} )
				.fail( function() {
					reject( new Error( 'Could not load the following script: ' + url ) );
				} );
		} );
	};
	
	self.loadStylesheet = function( href ) {
		let thisPath;
		
		if ( self.loadedStylesheets.indexOf( href ) >= 0 ) {
			console.log( 'stylesheet already loaded', href, self.loadedStylesheets );
			return;
		}
		self.loadedStylesheets.push( href );
		
		/*
		 * Build the URL for internal stylesheets.
		 * If it is an external stylesheet, we can skip this part.
		 */
		if ( href.indexOf( 'http' ) !== 0 ) {
			thisPath = document.location.pathname;
			if ( thisPath.indexOf( 'gwu/' ) >= 0 ) {
				thisPath = thisPath.substring( 0, thisPath.indexOf( 'gwu/' ) + 4 ) + 
					'css';
			} else if ( thisPath.indexOf( 'site/' ) >= 0 ) {
				thisPath = thisPath.substring( 0, thisPath.indexOf( 'site/' ) ) + 
					'css';
			}
			href = thisPath + href;
		}
		$( '<link>' )
			.attr( 'rel', 'stylesheet' )
			.attr( 'type', 'text/css' )
			.attr( 'href', href )
			.appendTo( 'head' );
			
	};
	
	self.queryString = {
		parsed: false,
		queryStringLookup: {}
	};
	
	self.queryString.get = function( parameter ) {
		if ( ! this.parsed ) {
			parseQueryString();
			this.parsed = true;
		}
		return this.queryStringLookup[parameter];
	};

	self.scrollTo = function( anchor, cb ) {
		const $anchor = typeof anchor === 'string' ? $( anchor ) : anchor;
		if ( ! $anchor.length ) {
			console.log( 'Anchor does not exist: GWUtilities.scrollTo()' );
			return;
		}
		cb = typeof cb === 'function' ? cb : function() {};
		
		const offsetTop = $anchor.offset().top;
		$( 'html, body' ).animate( {
			scrollTop : offsetTop + 'px'
		}, 'fast', cb );
	};

	self.shuffle = function( array ) {
		for ( let i = array.length - 1; i >= 0; i-- ) {
			const randomIndex = Math.floor( Math.random() * ( i + 1 ) );
			if ( randomIndex === i ) {
				continue;
			}
			const swappedElement = array[randomIndex];
			array[randomIndex] = array[i];
			array[i] = swappedElement;
		}

		return array;
	};
	
	function padArrayToLength( a, l, v ) {
		let temp;
		v = v || 0;
		temp = a;
		for ( let i = a.length; i < l; i++ ) {
			temp.push( v );
		}
		return temp;
	}
	
	function parseQueryString() {
		/* This can get pretty complex. For our use case, I elected to keep it
		 * pretty simple, but there are surely better, more comprehensive solutions
		 * out there. Why didn't I use one? Because I'm weird. jgb, 1/18/17
		 */
		let queryString;
		let queryStringArray;
		let queryStringLookup;
		
		queryString = location.search;
		if ( queryString.charAt( 0 ) === '?' ) {
			queryString = queryString.substring( 1 );
		}
		queryStringArray = queryString.split( /&amp;|&/g );
		queryStringLookup = self.queryString.queryStringLookup;
		for( let i = 0; i < queryStringArray.length; i++ ) {
			let parameter;
			let parameterAndValue;
			let value;
			
			parameterAndValue = queryStringArray[i].split( /=/g );
			/* 
			 * Apparently, decodeURIComponent might throw an exception if it stumbles across
			 * something it can't handle
			 */
			try {
				parameter = decodeURIComponent( parameterAndValue[0].replace( /\+/g, ' ' ) );
				value = parameterAndValue.length > 1 
					? decodeURIComponent( parameterAndValue[1].replace( /\+/g, ' ' ) )
					: null;
				if ( queryStringLookup[parameter] ) {
					if ( queryStringLookup[parameter] === null ) {
						// Making an assumption here that there was a mistake, and the new value is correct
						queryStringLookup[parameter] = value;
					} else if ( value !== null ) {
						// Assume, again--this time that the first value(s) are/were correct
						if ( ! Array.isArray( queryStringLookup[parameter] ) ) {
							queryStringLookup[parameter] = [ queryStringLookup[parameter] ];
						}
						queryStringLookup[parameter].push( value );
					}
				} else {
					queryStringLookup[parameter] = value;
				}
			} catch( error ) {
				console.log( 'error parsing query string', error );
			}
		}
	}
	
	return self;

} )( jQuery );

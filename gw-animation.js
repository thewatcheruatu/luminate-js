'use strict';

const GWAnimation = ( () => {
	/*
	 * Algorithms borrowed from Robert Penner
	 * Found here: http://gizma.com/easing/
	 * More here: http://robertpenner.com/easing/
	 */
	const Ease = {};
	/*
	 * For all functions:
	 * t: time since beginning of animation
	 * b: beginning position
	 * c: change in position (i.e., distance we ultimately want to travel over easing duration)
	 * d: duration of animation
	 * Just a gotcha to mention: these functions will continue to produce numbers
	 * beyond the point where t > d, so you need to check you haven't exceeded
	 * duration from wherever you're calling these functions.
	 */
	Ease.inOutExpo = function (t, b, c, d) {
		t /= d/2;
		if (t < 1) return c/2 * Math.pow( 2, 10 * (t - 1) ) + b;
		t--;
		return c/2 * ( -Math.pow( 2, -10 * t) + 2 ) + b;
	};
	
	Ease.inOutQuad = function (t, b, c, d) {
		t /= d/2;
		if (t < 1) return c/2*t*t + b;
		t--;
		return -c/2 * (t*(t-2) - 1) + b;
	};
	
	Ease.inOutQuart = function (t, b, c, d) {
		t /= d/2;
		if (t < 1) return c/2*t*t*t*t + b;
		t -= 2;
		return -c/2 * (t*t*t*t - 2) + b;
	};
	
	Ease.inOutQuint = function (t, b, c, d) {
		t /= d/2;
		if (t < 1) return c/2 * Math.pow( t, 5 ) + b;
		t -= 2;
		return c/2 * (Math.pow( t, 5 ) + 2) + b;
	};
	
	Ease.outExpo = function (t, b, c, d) {
		return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
	};
	
	Ease.outQuart = function (t, b, c, d) {
		t /= d;
		t--;
		return -c * (t*t*t*t - 1) + b;
	};
	
	Ease.dramatic = function( t, b, c, d ) {
		t /= d/2;
		if (t < 1) return c/2 * Math.pow( t, 13 ) + b;
		t -= 2;
		return c/2 * (Math.pow( t, 13 ) + 2) + b;
	};
	
	Ease.do = function( startTime, startValue, endValue, duration, options, callback ) {
		if ( typeof options === 'function' ) {
			callback = options;
			options = undefined;
		}

		options = options || {};
		options.algorithm = options.algorithm || Ease.inOutExpo;
		//default: 60 frames/sec (well, roughly, owing to the nature of timeouts)
		options.interval = options.interval || 1000/60;
		options.slowmoTriggered = options.slowmoTriggered || false;

		return _ease(); // a promise

		function _ease() {
			return new Promise( ( resolve, reject ) => {
				let previousValue;
				let easeInterval = setInterval( () => {
					let currentValue;
					const diffTime = ( new Date() ).getTime() - startTime;
					const diffValue = endValue - startValue;
					
					if ( diffTime >= duration ) {
						currentValue = endValue;
						clearInterval( easeInterval );
						resolve( true );
					} else {
						currentValue = Math.round( options.algorithm( diffTime, startValue, diffValue, duration ) );
					}

					if ( currentValue !== previousValue ) {
						callback( currentValue );
					}
					previousValue = currentValue;
				}, options.interval );
			} );
		}


	}

	return {
		Ease : Ease,
	};
} )();

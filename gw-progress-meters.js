'use strict';

function GWProgressMeters( dependencies, options ) {
	var $;
	var GWUtilities;
	
	init();
	
	function init() {
		dependencies = dependencies || {};
		options = options || {};
		
		$ = dependencies.jQuery || jQuery;
		
		if ( $ === undefined ) {
			throw new Error( 'GWProgressMeters failed to find an instance of jQuery' );
		} else if ( !$.fn.on ) {
			throw new Error( 'GWProgressMeters requires jQuery v1.7 or greater. Found v' + $.fn.jquery );
		}
		
		GWUtilities = GWUtilities || dependencies.GWUtilities;
		if ( GWUtilities === undefined ) {
			throw new Error ( 'GWUtilities is a required dependency of GWProgressMeters, but it was not available.' );
		}
		
		options.stylesheet = options.stylesheet || '/gwu_wrpr/gw-progress-meters.css';
		GWUtilities.loadStylesheet( options.stylesheet );
	};
	
	function ProgressMeter( selector, options ) {
		this.current;
		this.goal;
		this.goalType;
		this.numMilestones;
		this.options = {};
		this.selector = selector;

		const self = this;
		
		var $thisMeter;
		
		if ( ! selector ) {
			throw new Error( 'Selector passed to progress meter cannot be undefined.' );
		}
		this.selector = selector;
		
		$thisMeter = $( this.selector );
		if ( ! $thisMeter.length ) {
			throw new Error( 'Selector ' + selector + ' passed to progress meter does not exist' );
		}	
		options = options || {};
		this.goalType = options.goalType || 'cash';
		this.numMilestones = options.numMilestones || 0;
		this.options.delayFill = options.delayFill || 0;
		this.options.significantDigits = options.significantDigits || 0;
		
		$thisMeter.html( makeMeterHtml() );
		

		function makeMeterHtml() {
			let meterHtml = '<div class="progress-meter">';

			if ( self.numMilestones === 0 ) {
				meterHtml += '<div class="progress-meter-fill"></div>';
			} else {
				for ( let i = 0; i < self.numMilestones; i++ ) {
					meterHtml += '<div class="progress-meter-fill milestone" ' + 
						'id="milestone-' + i + '"></div>';
				}
			}

			meterHtml += '</div>';

			return meterHtml;
		}
	};
	
	ProgressMeter.prototype.init = function( data ) {
		var $thisMeter;
		var self;
		var fillPercent;
		
		self = this;
		fillPercent = 0;
		
		if ( ! data ) {
			//throw new Error( 'Initialization data for progress meter is not optional.' );
			return false;

		}
		if ( data.goal === undefined || data.current === undefined ) {
			//throw new Error( 'Progress meter "goal" and "current" data cannot be undefined.' );
			return false;
		}
		$thisMeter = $( this.selector );
		this.goal = data.goal;
		this.current = data.current;
		this.milestones = data.milestones || [];
		fillPercent = Math.floor( self.current / self.goal * 100 );
		if ( fillPercent > 100 ) {
			fillPercent = 100;
		}

		const $milestones = $thisMeter.find( '.milestone' );
		
		setTimeout( function() {
			if ( self.milestones.length && $milestones.length === self.milestones.length ) {
				for ( let i = 0; i < self.milestones.length; i++ ) {
					const milestonePercent = Math.floor( self.milestones[i] / self.goal * 100 );
					const $thisMilestone = $( $milestones.get( i ) );
					if ( self.current >= self.milestones[i] ) {
						$thisMilestone.css( 'width', milestonePercent + '%' );
					} else {
						$thisMilestone.css( 'width', fillPercent + '%' );
					}
				}
			} else {
				$thisMeter.find( '.progress-meter-fill' ).css( 'width', fillPercent + '%' );
			}
		}, self.options.delayFill );
		return true;
		
	};
	
	function ProgressReadout( selector, options ) {
		// Selector into which we will put this readout - should probably be an ID
		this.selector;
				
		// Data - should get passed into the init function
		this.current;
		this.goal;
		
		// General readout metadata
		this.goalType;
		this.options = {};
		
		var $thisReadout;
		var readoutHtml;
		
		if ( ! selector ) {
			throw new Error( 'Selector passed to progress readout cannot be undefined.' );
		}
		this.selector = selector;
		
		$thisReadout = $( this.selector );
		if ( ! $thisReadout.length ) {
			throw new Error( 'Selector ' + this.selector + ' passed to progress readout does not exist' );
		}
		options = options || {};
		this.goalType = options.goalType || 'cash';
		this.options.displayCents = options.displayCents !== undefined ? options.displayCents : true;
		
		readoutHtml = '<div class="progress-readout">';
		readoutHtml += '<div class="progress-readout-datum"><div class="progress-readout-label"><strong>Goal:</strong></div><div class="progress-readout-value goal"></div></div>';
		readoutHtml += '<div class="progress-readout-datum"><div class="progress-readout-label"><strong>Current:</strong></div><div class="progress-readout-value current"></div></div>';
		readoutHtml += '<div class="progress-readout-datum to-go-datum transparent"><div class="progress-readout-label"><strong>To Go:</strong></div><div class="progress-readout-value to-go"></div></div>';
		readoutHtml += '<div class="progress-readout-datum surplus-datum hidden transparent"><div class="progress-readout-label"><strong>Surplus:</strong></div><div class="progress-readout-value surplus"></div></div>';
		readoutHtml += '</div>';
		
		$thisReadout.html( readoutHtml );
	};
	
	ProgressReadout.prototype.init = function( data ) {
		var $current; // need this for easing callback
		var $thisReadout;
		
		var self;
		
		var absoluteDifferenceHtml;
		var easeDuration;
		var goalHtml;
		
		self = this;
		
		// Do not proceed if the readout is not initialized with data
		if ( ! data ) {
			throw new Error( 'Initialization data for progress readout is not optional.' );

		}
		if ( data.goal === undefined || data.current === undefined ) {
			throw new Error( 'Progress readout "goal" and "current" data cannot be undefined.' );
		}
		$thisReadout = $( this.selector );
		this.goal = data.goal;
		this.current = data.current;
		
		if ( this.goalType === 'cash' ) {
			//Cash values need to be made to look like cash values
			goalHtml = GWUtilities.formatMoney( this.goal, { displayCents: this.options.displayCents } );
			absoluteDifferenceHtml = GWUtilities.formatMoney( Math.abs( this.goal - this.current ), { displayCents: this.options.displayCents } );
		} else {
			//currentHtml = this.goal;
			goalHtml = this.goal + ' donors';
			absoluteDifferenceHtml = Math.abs( this.goal - this.current ) + ' donors';
		}
		
		$current = $thisReadout.find( '.current' );
		easeDuration = 5000;
		ease( ( new Date() ).getTime(), 0, this.current, easeDuration, { algorithm: Ease.dramatic }, function( currentValue ) {
			self.setCurrentValueDisplay( currentValue );
		});
		
		setTimeout( function() {
			if ( self.goal >= self.current ) {
				$thisReadout.find( '.to-go-datum' ).removeClass( 'transparent' ).find( '.to-go' ).html( absoluteDifferenceHtml );
			} else {
				$thisReadout.find( '.to-go-datum' ).addClass( 'hidden' );
				$thisReadout.find( '.surplus-datum' ).removeClass( 'hidden' ).removeClass( 'transparent' ).find( '.surplus' ).html( absoluteDifferenceHtml );
			}
		}, easeDuration );
		
		
		$thisReadout.find( '.goal' ).html( goalHtml );

	};
	
	ProgressReadout.prototype.setCurrentValueDisplay = function( value ) {
		var self = this;
		var $current;
		var currentHtml;
		
		$current = $( self.selector ).find( '.current' );
		if ( self.goalType === 'cash' ) {
			currentHtml = GWUtilities.formatMoney( value, { displayCents: self.options.displayCents } );
		} else {
			currentHtml = value + ' donors';
		}
		$current.html( currentHtml );
	};
	
	/*
	 * Algorithms borrowed from Robert Penner
	 * Found here: http://gizma.com/easing/
	 * More here: http://robertpenner.com/easing/
	 */
	var Ease = {};
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
	
	function ease( startTime, startValue, endValue, duration, options, callback ) {
		var currentValue;
		var diffTime;
		var diffTimePercent;
		var diffValue;
		var endTime;
		
		diffTime = ( new Date() ).getTime() - startTime;
		diffValue = endValue - startValue;
		if ( typeof options === 'function' ) {
			callback = options;
			options = undefined;
		}
		options = options || {};
		options.algorithm = options.algorithm || Ease.inOutExpo;
		//default: 60 frames/sec (well, roughly, owing to the nature of timeouts)
		options.interval = options.interval || 1000/60;
		options.slowmoTriggered = options.slowmoTriggered || false;
		

		
		if ( diffTime >= duration ) {
			currentValue = endValue;
		} else {
			currentValue = Math.round( options.algorithm( diffTime, startValue, diffValue, duration ) );
			setTimeout( function() {
				ease( startTime, startValue, endValue, duration, options, callback );
			}, options.interval );
		}
		callback( currentValue );
	}
	
	return {
		ProgressMeter : ProgressMeter,
		ProgressReadout : ProgressReadout
	};
}

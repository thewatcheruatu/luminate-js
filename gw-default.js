/*global GWDefaultUserServiceCenter GWDefaultEvents */
/*
 * v1.0.0
 *
 * GeneralWrapper: Takes care of basic page overhaul like dynamically purging
 * Luminate styles, as well as any kind of shared functionality that might
 * be useful accross Luminate applications.
 * 
 * DOMUtilities: This is just a static singleton that includes some helper
 * functions for DOM stuff that's obnoxious to do and not really specific
 * to the general wrapper.
 *
 * GoogleWebFonts: A wrapper object, basically, for loading Google Web Fonts
 * onto the page. Pretty self-explanatory.
 */
'use strict';

const GeneralWrapper = ( function() {
	let $;
	let initialized;
	
	initialized = false;

	function init( dependencies ) {
		if ( initialized ) {
			console.log( 'GeneralWrapper has already been initialized' );
			return false;
		}

		dependencies = dependencies || {};
		$ = dependencies.jQuery || jQuery;
		
		if ( $ === undefined ) {
			throw new Error( 'GeneralWrapper failed to find an instance of jQuery' );
		} else if ( !$.fn.on ) {
			throw new Error( 'GeneralWrapper requires jQuery v1.7 or greater. Found v' + $.fn.jquery );
		}

		initialized = true;

		$( () => {
			attachEventHandlers();
			moveBodyStylesToHead();
		} );

		return true;
	}

	function overhaulComplete() {
		$( 'body' ).css( 'opacity', '1.0' );
	}
	
	function overhaulPrepare() {
		$( 'body' ).css( 'opacity', '0.0' );
		//reveal theme elements that might have been hidden
		$( '#logo-making-history' ).css( 'opacity', '1' );		
	}
	
	
	function attachEventHandlers() {
		// Stuff that could be on any page
		$( 'body' )
			/*
			 * I wrote this mainly for people making events, so that they could
			 * reveal long descriptions behind an "additional info" button.
			 * You could technically use it anywhere, though.
			 */
			.on( 'click', '.additional-info-link', function( e ) {
				e.preventDefault();
				$( this )
					.addClass( 'hidden' )
					.next( '.additional-info-content' )
					.slideDown( 'fast' );
			} );
	}
	
	function moveBodyStylesToHead() {
		$( '.custom-styles' ).detach().appendTo( 'head' );
	}


	// Public
	function hideNavLinks() {
		$( () => {
			$( 'nav ul' ).addClass( 'transparent' );
		} );
	}

	return {
		hideNavLinks : hideNavLinks,
		init : init,
	};

} )();

const DOMUtilities = ( function( $ ) {
	let self;
	
	self = {};

	if ( $ === undefined ) {
		return {
			convertTag : throwMissingJQuery,
			ensureFirstHeadingIsH1 : throwMissingJQuery
		};
	}

	function throwMissingJQuery() {
		console.log( 'Cannot call DOMUtilities function. jQuery missing.' );
	}

	self.convertTag = function( object, newTag ) {
		object.each( function() {
			let thisId;
			let thisClass;
			let thisStyle;
			let html;

			thisId = $( this ).attr( 'id' );
			thisClass = $( this ).attr( 'class' );
			thisStyle = $( this ).attr( 'style' );
			html = '<' + newTag
					 + ( thisId !== undefined ? ' id="' + thisId + '"' : '' )
					 + ( thisClass !== undefined ? ' class="' + thisClass + '"' : '' )
					 + ( thisStyle !== undefined ? ' style="' + thisStyle + '"' : '' )
					 + '>' + $( this ).html() + '</' + newTag + '>';
			$( this ).replaceWith( html );		
		} );
	};

	self.ensureFirstHeadingIsH1 = function() {
		let $firstHeading;

		$firstHeading = $( 'h1,h2,h3' ).first();
		if ( $firstHeading.length && ! $firstHeading.is( 'h1' ) ) {
			let fhId;
			let fhClass;
			let fhStyle;
			let html;

			fhId = $firstHeading.attr( 'id' );
			fhClass = $firstHeading.attr( 'class' );
			fhStyle = $firstHeading.attr( 'style' );
			html = '<h1'
					 + ( fhId !== undefined ? ' id="' + fhId + '"' : '' )
					 + ( fhClass !== undefined ? ' class="' + fhClass + '"' : '' )
					 + ( fhStyle !== undefined ? ' style="' + fhStyle + '"' : '' )
					 + '>' + $firstHeading.html() + '</h1>';
			$firstHeading.replaceWith( html );
		}
	};

	return self;
} )( jQuery );

/* 
 * GoogleWebFonts 
 * This is all vanilla JS--shouldn't be any dependencies to pass in
*/

const GoogleWebFonts = ( function() {
	let self;

	self = {};

	self.add = function( fontFamily, weights ) {
		let font;

		weights = weights === undefined ? [] : weights;
		if ( ! weights.length ) {
			switch ( fontFamily ) {
			case 'Open Sans': 
				weights = [
					'400',
					'300',
					'700',
					'300italic',
					'400italic',
					'700italic'
				];			
				break;
			case 'Open Sans Condensed':
				weights = [
					'300',
					'300italic'
				];
				break;
			}
		}
		
		font = fontFamily.replace( / /g, '+' )
		     + ( weights.length ? ':' + weights.join( ',' ) : '' );
		if ( window.WebFontConfig === undefined ) {
			window.WebFontConfig = {
				'google': { 'families': [] }
			};
		}
		window.WebFontConfig.google.families.push( font );
	};
	
	self.load = function() {
		let s;
		let wf;

		wf = document.createElement( 'script' );
		wf.src = ( 'https:' == document.location.protocol ? 'https' : 'http' ) +
		  '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
		wf.type = 'text/javascript';
		wf.async = 'true';
		s = document.getElementsByTagName( 'script' )[0];
		s.parentNode.insertBefore( wf, s );		
	};

	return self;
} )();

( function( $ ) {
	GeneralWrapper.init( {
		jQuery: $,
	} );

	function GWDefaultOnReady() {	
		GoogleWebFonts.add( 'Open Sans' );
		GoogleWebFonts.add( 'Open Sans Condensed' );
		GoogleWebFonts.add( 'Montserrat' );
		GoogleWebFonts.load();
		// TODO - move this to gw-default-user-service-center.js
		try {
			if ( typeof GWDefaultUserServiceCenter !== 'undefined' ) {
				GWDefaultUserServiceCenter.init( { jQuery: $ } );
			}
		} catch( _error ) {
			if ( _error.name !== 'ReferenceError' ) {
				console.log( 'User Service Center error: ', _error );
			}
		}
		
		// TODO - move this to gw-default-events.js
		try {
			if ( typeof GWDefaultEvents !== 'undefined' ) {
				GWDefaultEvents.init( { jQuery: $ } );
			}
		} catch( _error ) {
			if ( _error.name !== 'ReferenceError' ) {
				console.log( 'GWDefaultEvents error: ', _error );
			}
		}
	}

	$( () => {
		GWDefaultOnReady();
	} );
} ) ( jQuery );

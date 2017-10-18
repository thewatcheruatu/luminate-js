/* globals gwProgress, GWUtilities */
'use strict';

/*
 * CROWDFUNDING HOME PAGE
 * Anything found within here should only apply to the Colonial Crowdfunding
 * Home Page (i.e., listing all open projects). Though there might be some
 * stuff that is going to apply to the Past Projects page, as well, since 
 * they're largely identical.
 * This is a lazy singleton that should only be instanced when needed.
**/
const CrowdfundingHome = ( () => {
	let instance;

	function _CrowdfundingHome() {
		let $;
		let $homepage;
		let errors;
		let initialized;

		errors = [];
		initialized = false;

		function init( dependencies ) {
			const d = dependencies || {};

			if ( initialized ) {
				errors.push( new Error( 'CrowdfundingHome has already been initialized.' ) );
				return false;
			}

			if ( ! d.jQuery ) {
				errors.push( new Error( 'CrowdfundingHome requires jQuery.' ) );
				return false;
			}

			$ = d.jQuery;
			$( _onDocumentReady );
			initialized = true;
		}

		function _onDocumentReady() {
			$homepage = $( '#crowdfunding-homepage' );

			$( '.crowdfunding-campaign' )
				.not( '.active-campaign' )
				.find( '.campaign-details' )
				.append( 
					'<div style="font-size: .9em; text-align: center;">Future donations ' +
					'support this student organization but may not go toward the project ' +
					'mentioned above.</div>'
				);
			_randomizeCampaigns();
			//pickFeaturedCampaign();

			if ( $homepage.hasClass( 'past-projects' ) ) {
				$homepage.prepend( 
					'<h2 style="text-align: center;">Colonial Crowdfunding harnesses ' +
					'the power of the GW network to support student-led projects and ' +
					'ventures. Thank you to the donors who gave more than $25,600 to ' +
					'support these 13 student organizations! You may still make a gift ' +
					'in support of these student organizations.</h2>'
				);
			} else {
				$homepage.prepend( 
					'<h2 style="text-align: center;">Colonial Crowdfunding harnesses ' +
					'the power of the GW network to support student-led projects and ' +
					'ventures.</h2>'
				);
			}
		}

		function _pickFeaturedCampaign() {
			$( '.featured-crowdfunding-campaign' ).each( function() {
				let campaignTileIndex;
				let campaignTile;
				let campaignTileHtml;

				campaignTileIndex = Math.floor( Math.random() * $( '.crowdfunding-campaign' ).length );
				campaignTile = $( $( '.crowdfunding-campaign' ).get( campaignTileIndex ) );
				campaignTileHtml = campaignTile.html();
					
				campaignTile.remove();
				$( this ).append( campaignTileHtml );
			} );
		}
		
		function _randomizeCampaigns() {
			let campaigns;

			campaigns = $( '.crowdfunding-campaign' ).detach();
			campaigns = GWUtilities.shuffle( campaigns );
			campaigns.each( function() {
				$( '#crowdfunding-campaign-tiles' ).append( this );
			} );
		}

		return {
			init : init,
		};
	}

	return {
		getInstance : function() {
			return instance || _CrowdfundingHome();
		}
	};
} )();


/*
 * CROWDFUNDING LANDING PAGE
 * Anything found within here should only apply to the landing/splash pages
 * on crowdfunding donation forms.
 * This is a lazy singleton that should only be instanced when needed.
**/
const CrowdfundingLanding = ( () => {
	let instance;

	function _CrowdfundingLanding() {
		let $;
		let $splashPage;
		let errors;
		let initialized;

		errors = [];
		initialized = false;



		function init( dependencies ) {
			const d = dependencies || {};

			if ( initialized ) {
				errors.push( new Error( 'CrowdfundingLanding already initialized.' ) );
				return false;
			}

			if ( ! d.jQuery ) {
				errors.push( new Error( 'CrowdfundingLanding required jQuery.' ) );
				return false;
			}

			$ = d.jQuery;
			GWUtilities.loadClass( 'GWAnimation' )
				.then( () => {
					$( _onDocumentReady );
				} )
				.catch( ( error ) => {
					console.log( error.message );
				} );

			initialized = true;
		}



		function _calculateTimeRemaining() {
			const now = new Date();
			const utcNow = now.getTime();
			const utcEnd = Date.UTC( 2019,3,24,4,59,59,0 );
			let diff = utcEnd - utcNow;

			// 15 days
			if ( diff < 1.296e9 ) {
				$( '#progress-meter-stats' ).find( 'li' ).last().removeClass( 'hidden' );
			}
			diff = diff < 0 ? 0 : diff;
			const diffDays = Math.floor( diff / ( 24 * 60 * 60 * 1000 ) );
			diff -= diffDays * ( 24 * 60 * 60 * 1000 );
			const diffHours = Math.floor( diff / ( 60 * 60 * 1000 ) );
			diff -= diffHours * ( 60 * 60 * 1000 );
			const diffMinutes = Math.floor( diff / ( 60 * 1000 ) );

			$( '#time-remaining' ).html(
				diffDays + 'd ' + diffHours + 'h ' + diffMinutes + 'm'
			);
		}
	


		function _initializeCrowdfunders() {
			const $crowdfundersChildren = $( '#crowdfunders' ).children( 'div' );
			let crowdfunder;
			let queriedCrowdfunder;
			let queriedCrowdfunderBlurb;

			$crowdfundersChildren
				.each( function() {
					let crowdfunderName;
					
					crowdfunderName = $( this ).find( 'h2' ).text();
					$( this )
						.attr( 'id', crowdfunderName.toLowerCase().replace( /\s/g, '-' ) )
						.append( '<button class="select-this-crowdfunder">Select</button>' );
				} )
				.on( 'click', function( e ) {
					e.preventDefault();
					if ( ! $( e.target ).is( 'button' ) ) {
						return;
					}
					_selectCrowdfunder( $( this ) );
				} );
			
			if ( $crowdfundersChildren.length ) {
				$( '#view-crowdfunders' ).css( 'display', 'block' )
				// Assign event handler to link that shows all crowdfunders
				.on( 'click', function( e ) {
					e.preventDefault();
					$( '#crowdfunders' ).css( 'display', 'block' ).children( 'div' ).slideDown();
					gwUtilities.scroll.to( '#crowdfunders' );
				} )
				.prev( '.give-button' ).css( 'margin-bottom', '2px' );
			}
			
			
			// Check the query string for a requested crowdfunder
			queriedCrowdfunder = GWUtilities.queryString.get( 'crowdfunder' );
			if ( ! queriedCrowdfunder ) {
				return;
			}
			
			// Clean up the name of the crowdfunder and find the associated blurb
			crowdfunder = queriedCrowdfunder.toLowerCase().replace( /\s/g, '-' ),
					queriedCrowdfunderBlurb = $( '#' + crowdfunder );
			if ( ! queriedCrowdfunderBlurb.length ) {
				//console.log( 'Could not locate a blurb for the requested crowdfunder.' );
				return;
			}
			
			// If a requested blurb is found, display it then update links to the donation form
			$( '#crowdfunders' ).css( 'display', 'block' );
			queriedCrowdfunderBlurb.css( 'display', 'block' ).addClass( 'selected' );
			_selectCrowdfunder( queriedCrowdfunderBlurb );
		}



		function _initializeIntervals() {
			if ( $( '.crowdfunding-splash-page' ).hasClass( 'completed' ) ) {
				return;
			}
			_calculateTimeRemaining();
			setInterval( _calculateTimeRemaining, 10000 );
		}



		function _initializePhoneyVideoFrame() {
			const $phoneyVideoFrame = $( '#phoney-video-frame' );
			const $trueVideoFrame = $( '#true-video-frame' );
			
			if ( $trueVideoFrame.attr( 'src' ) != '' ) {
				$phoneyVideoFrame.addClass( 'video-link' );
				
				$phoneyVideoFrame.one( 'click', function() {
					$phoneyVideoFrame.addClass( 'hidden' );
					$( '#true-video-frame-container' ).css( 'display', 'block' );
					$trueVideoFrame
						.css( 'display', 'block' )
						.attr( 'src', $trueVideoFrame.attr( 'src' ) + '?autoplay=1' );
				} );
			}
		}
	


		function _initializeProgressMeters() {
			const $goalDollars = $( '#goal-dollars' );
			const goalDollarsFormatted = GWUtilities.formatMoney(
				( parseInt( $goalDollars.text(), 10 ) / 100 ),
				{ displayCents : false }
			);
			const $progressDollars = $( '#progress-dollars' );
			const amountRaised = parseInt( $progressDollars.text(), 10 ) / 100;

			$goalDollars.html( goalDollarsFormatted ).removeClass( 'hidden' );
			$progressDollars.removeClass( 'hidden' );
			//gwUtilities.number.rampUpDollars( '#progress-dollars', 0, amountRaised/100 );
			if ( GWAnimation ) {
				GWAnimation.Ease.do( new Date(), 0, amountRaised, 3000, {}, ( currentValue ) => {
					$progressDollars.html( 
						GWUtilities.formatMoney( currentValue, { displayCents : false } ) 
					);
				} );
			} else {
				$progressDollars.html( GWUtilities.formatMoney( currentValue, { displayCents : false }) );
			}
		}	



		function _onDocumentReady() {
			$splashPage = $( '.crowdfunding-splash-page' );
			_initializePhoneyVideoFrame();
		
			//initializeCrowdfunders();
			_initializeProgressMeters();
			_initializeIntervals();

			// Initialize "Read More" option on descriptions
			const $description = $( '.description' );
			$description
				.addClass( 'preview' )
				.append( 
				'<div class="read-more-container"><button class="read-more">' +
				'Read More</button></div>' 
				);

			$( '.read-more' ).on( 'click', ( e ) => {
				e.preventDefault();
				//const $moreButton = $( e.target );
				$( '.read-more-container' ).addClass( 'hidden' );
				$description.removeClass( 'preview' );
			} );

			if ( 
				$splashPage.hasClass( 'completed' ) && 
				$( 'title' ).text().indexOf( 'Hillel' ) === -1 
			) {
				$( '.crowdfunding-splash-page' )
					.prepend( 
						'<h2 style="text-align: center;">Projects closed April 23. ' +
						'Future donations might not support this project.</h2>'
					);	
			}
		}



		function _selectCrowdfunder( crowdfunder ) {
			const crowdfunderName = crowdfunder.find( 'h2' ).text().replace( /\s/g, '%20' );
			const crowdfunderId = crowdfunder.attr( 'id' );
			let campaign;
			
			campaign = $( 'title' ).text().toLowerCase().replace( /\s/g, '-' );
				
			if ( campaign.indexOf( 'coffee-cup' ) >= 0 ) {
				campaign = 'hillel-coffee-cup-challenge';
			}
			
			crowdfunder.addClass( 'selected' ).siblings().removeClass( 'selected' );
			
			$( '.give-button' ).each( function() {
				let href;

				href = $( this ).attr( 'href' );
				if ( href === '#' ) {
					return;
				}
				if ( href.indexOf( '&utm_medium' ) >= 0 ) {
					href = href.substring( 0, href.indexOf( '&utm_medium' ) );
				}
				href += 
					'&utm_medium=website&utm_campaign=' + campaign + '&utm_source=' + 
					crowdfunderId + '&set.custom.Crowdfunder_Name=' + crowdfunderName;
				$( this ).attr( 'href', href );
			} );
		}
	


		return {
			init : init,
		};
	}

	return {
		getInstance : function() {
			return instance || _CrowdfundingLanding();
		}
	};
} )();


/*
 * GENERAL CROWDFUNDING MASTER CONTROLLER
 * Amongst other responsibilities, this will determine whether or not to
 * initialize the various singletons related to the crowdfunding.
 * E.g., instance and initialize CrowdfundingHome if on the home page.
**/
const Crowdfunding = ( () => {
	let $;
	let initialized;

	initialized = false;

	function init( dependencies ) {
		const d = dependencies || {};

		if ( initialized ) {
			return false;
		}

		if ( ! d.jQuery ) {
			console.log( 'No jQuery!' );
			return false;
		}

		$ = d.jQuery;
		$( _onDocumentReady );
		initialized = true;

		return true;
	}

	function _initializeOverlays() {
		const $permalink = $( '.permalink' );

		if ( ! $permalink.length ) {
			return;
		}
		
		_overlayAdd( $permalink.detach() );
		$( '.permalink-icon-link' ).on( 'click', function( e ) {
			e.preventDefault();
			_overlayToggle( '.permalink' );
		} );
		
		$( 'html' ).on( 'click', function( e ) {
			if ( 
				! $( e.target ).is( '.permalink' ) && 
				! $( e.target ).parents( '.permalink' ).length && 
				! $( e.target ).is( '.permalink-icon-link' ) && 
				! $( e.target ).parents( '.permalink-icon-link' ).length 
			) {
				_overlayHide( '.permalink' );
			}
		} );
		
		$( window ).on( 'resize' , function() {
			_layoutOverlays();
		} );
	}
	

	function _initializeSocialLinks() {
		const $linksContainer = $( '#social-sharing-links' );
		let permalink;
		
		permalink = $( '.permalink input' ).val();
		
		$linksContainer.find( 'a' ).each( function() {
			if ( $( this ).data( 'permalink' ) ) {
				permalink = $( this ).data( 'permalink' );
			}
			if ( ! permalink ) {
				return;
			}
			const permalinkEncoded = encodeURIComponent( permalink );
			
			if ( $( this ).hasClass( 'facebook-share' ) ) {
				$( this ).attr( 
					'href', 
					'https://www.facebook.com/sharer/sharer.php?u=' + permalinkEncoded 
				);
			} else if ( $( this ).hasClass( 'twitter-share' ) ) {
				let tweetText;

				tweetText = encodeURIComponent( $( this ).data( 'message' ) );
				$( this ).attr( 
					'href', 
					'https://twitter.com/intent/tweet?text=' + tweetText + '&url=' + permalinkEncoded 
				);
			} else if ( $( this ).hasClass( 'google-plus-share' ) ) {
				$( this ).attr( 
					'href', 
					'https://plus.google.com/share?url=' + permalinkEncoded
				);
				$( this ).css( 'display', 'none' ); //Temporary--seems to be broken
			}
		} );
	}

	function _layoutOverlays() {
		const screenHeight = $( window ).height();
		const screenWidth = $( window ).width();
		let overlayZIndex;

		overlayZIndex = parseInt( $( '#overlay-layer' ).css( 'z-index' ), 10 );

		if ( isNaN( overlayZIndex ) ) {
			overlayZIndex = 100;
		}
			
		$( '.overlay-box' ).each( function() {
			const contentHeight = $( this ).outerHeight();
			const contentWidth = $( this ).outerWidth();
			
			$( this )
			.css( 'top', ( screenHeight - contentHeight ) / 2 + 'px' )
			.css( 'left', ( screenWidth - contentWidth ) / 2 + 'px' )
			.css( 'z-index', ++overlayZIndex );
		} );
	}

	function _makeProgressMeterStub( i, element ) {
		const $stub = $( element );
		const goal = $( element ).data( 'goal' );
		const current = $( element ).data( 'amount-raised' );

		if ( $stub.attr( 'id' ) === undefined ) {
			$stub.attr( 'id', 'progress-meter-' + Math.round( Math.random() * 10000 ) );
		}

		GWUtilities.loadClass( 'GWProgressMeters' )
			.then( () => {
				const gwProgressMeters = new GWProgressMeters( 
					{ jQuery : $, GWUtilities : GWUtilities } 
				);
				const campaignMeter = new gwProgressMeters.ProgressMeter(
					'#' + $stub.attr( 'id' ),
					{ delayFill : 500 }
				);
				campaignMeter.init( {
					goal : goal,
					current : current
				} );
			} )
			.catch( ( error ) => {
				console.log( error.message );
			} );
	}
	
	function _onDocumentReady() {
		const $crowdfundingHomepage = $( '#crowdfunding-homepage' );
		const $splashPage = $( '.crowdfunding-splash-page' );

		_initializeOverlays();

		if ( $splashPage.length ) {
			CrowdfundingLanding.getInstance().init( { jQuery : $ } );

		}
		if ( $crowdfundingHomepage.length ) {	
			CrowdfundingHome.getInstance().init( { jQuery : $ } );
		}

		//GWUtilities.loadStylesheet( 'https://growlfrequency.com/work/luminate/css/gwu_wrpr/crowdfunding.css' );
		GWUtilities.loadStylesheet( '/gwu_wrpr/crowdfunding.css' );
	
		$( '.progress-meter-stub' ).each( _makeProgressMeterStub );
			
		_initializeSocialLinks();
		
		$( '.view-more-link' ).on( 'click', function( e ) {
			e.preventDefault();
			$( this ).parent().next( '.view-more' ).removeClass( 'view-more' );
			$( this ).hide();
		} );

	}

	function _overlayAdd( content ) {
		if ( ! $( '#overlay-layer' ).length ) {
			$( 'body' ).prepend( '<div id="overlay-layer"></div>' );
		}
		
		$( content ).insertAfter( '#overlay-layer' ).addClass( 'overlay-box' )
		.css( 'position', 'fixed' );
		
		_layoutOverlays();
	}


	function _overlayHide( selector ) {
		$( selector ).css( 'display', 'none' );
		$( '#overlay-layer' ).css( 'display', 'none' );
	}
	
	function _overlayShow( selector ) {
		$( '#overlay-layer' ).css( 'display', 'block' );
		$( selector ).css( 'display', 'block' );
	}
	
	function _overlayToggle( selector ) {
		if ( $( selector ).css( 'display' ) == 'block' ) {
			_overlayHide( selector );
		} else {
			_overlayShow( selector );
		}
	}

	return {
		init : init,
	};
} )();

Crowdfunding.init( { jQuery : jQuery } );

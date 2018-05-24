/* global GWUtilities */
/*
 * Dependencies:
 * GWDesigneeSearch
 * GWFormDesignees
 * jQuery
 */
'use strict';

const GWMainDonations = ( () => {
	let $;
	let GWDesigneeSearch;
	let GWFormDesignees;
	let greatestNeedIds;
	let initialized = false;

	function init( dependencies, options ) {
		if ( initialized ) {
			return false;
		}

		dependencies = dependencies || {};
		$ = dependencies.jQuery || jQuery;
		GWDesigneeSearch = dependencies.GWDesigneeSearch;
		GWFormDesignees = dependencies.GWFormDesignees;
		greatestNeedIds = dependencies.greatestNeedIds || [];

		options = options || {};
		const backgroundImage = options.backgroundImage || '../../images/gwu_wrpr/main-donation-bg-01.jpg'; 

		if ( $ === undefined ) {
			console.log( '$ was undefined in GWMainDonations' );
			return false;
		} else if ( ! $.fn.on ) {
			console.log( 
				'GWDonations requires jQuery v1.7 or greater. Found v' + $.fn.jquery 
			);
			return false;
		} else if ( GWFormDesignees === undefined ) {
			console.log( 'GWFormDesignees is a required dependency of GWMainDonations' );
			return false;
		} else if ( GWDesigneeSearch === undefined ) {
			console.log( 'GWDesigneeSearch is a required dependency of GWMainDonations' );
			return false;
		}

		initialized = true;
		$( onDocumentReady );

		function onDocumentReady() {
			const $ProcessForm = $( '#ProcessForm' );
			$ProcessForm
				.children( '.donation-form-container' )
				.addClass( 'hidden' );

			loadMainDonationsSection()
				.then( ( _$mainDonationsSection ) => {
					GWRockerSwitches.init( { jQuery : $ } );

					attachHandlers();
					GWDesigneeSearch.init(
						{ jQuery : $, GWFormDesignees : GWFormDesignees }
					);
					GWDesigneeSearch.attach( {
						searchBox : '#main-donations-designee-search',
						searchSubmit : '#main-donations-designee-search-submit',
						searchResults : '#main-donations-designee-search-results'
					} );

					makeGreatestNeedList();
					makeDesigneeBrowseList();

					// Assuming everything went as planned, hide the original form
					repurposeOriginalForm();

					// Add the background image - low priority so this comes last
					$( 'main' )
						.css( 'background-image', 'url( ' + backgroundImage + ' )' );
				} )
				.catch( ( _error ) => {
					/*
					 * If we get here, there's a possibility even the original
					 * form might be in trouble, but present it anyway.
					 */
					$ProcessForm.removeClass( 'hidden' );
				} );

			function attachHandlers() {
				const $body = $( 'body' );
				const $stepOneNextButton = $( '#main-donations-step-one-next' );
				const $stepTwoNextButton = $( '#main-donations-step-two-next' );
				const $stepThreeNextButton = $( '#main-donations-step-3-next' );
				const $stepFourNextButton = $( '#main-donations-step-4-next' );

				$body
					.on( 'keydown', ( e ) => {
						let enterPressed = false;
						if ( e.key !== undefined && e.key === 'Enter' ) {
							enterPressed = true;
						}
						// TODO check for keycode in else

						if ( enterPressed ) {
							e.preventDefault();
							const activeStepNextButton = $( '.active-step' )
								.find( '.main-donations-next-button.active' );

							if ( activeStepNextButton.length ) {
								activeStepNextButton.trigger( 'click' );
							}
						}
					} )
					.on( 'keyup change', '#main-donations-step-3-fields input.required', ( e ) => {
						let showNextButton = true;

						$( '#main-donations-step-3-fields' )
							.find( 'input.required' )
							.each( ( i, el ) => {
								if ( ! showNextButton ) {
									return;
								}
								if ( $( el ).val() === '' ) {
									showNextButton = false;
								}
							} );

						if ( showNextButton ) {
							makeNextButtonActive( $stepThreeNextButton );
						} else {
							makeNextButtonInactive( $stepThreeNextButton );
						}
					} )
					.on( 'keyup change', '#main-donations-step-4-fields input.required', ( e ) => {
						let showNextButton = true;

						$( '#main-donations-step-4-fields' )
							.find( 'input.required' )
							.each( ( i, el ) => {
								if ( ! showNextButton ) {
									return;
								}
								if ( $( el ).val() === '' ) {
									showNextButton = false;
								}
							} );

						if ( showNextButton ) {
							makeNextButtonActive( $stepFourNextButton );
						} else {
							makeNextButtonInactive( $stepFourNextButton );
						}
					} )
					.on( 
						'click', 
						'#change-frequency-decision, #change-amount-decision', 
						( e ) => {
							e.preventDefault();
							goToStep( '1' );
					} )
					.on( 'click', '#change-designee-decision', ( e ) => {
						e.preventDefault();
						goToStep( '2' );
					} )
					// Link that unhides the Browse options
					.on( 'click', '#browse-option-link', ( e ) => {
						e.preventDefault();
						browseList.show();
					} );

					const $searchSection = $( '#main-donations-designee-search-section' );
					$( '#main-donations-greatest-need' )
						.on( 'click', ( e ) => {
							e.preventDefault();
							$searchSection.addClass( 'hidden' );
							greatestNeedList.show();
							/*
							$( '#single_designee_unrestricted' )
								.prop( 'checked', true )
								.trigger( 'click' )
								.trigger( 'change' );
							//makeStepTwoNextText();
							$stepTwoNextButton.addClass( 'active' );
							//flashNextButton( $stepTwoNextButton );
							*/
						} )
					$( '#main-donations-specific-designee' )
						.on( 'click', ( e ) => {
							e.preventDefault();
							$searchSection.removeClass( 'hidden' );
							greatestNeedList.hide();
						} );

				const $flexibleGiftTypeRadios = $( 'input[name=level_flexiblegift_type]' );
				const $mainDonationsAmount = $( '#main-donations-amount' );
				const $otherAmount = $( '.donation-level-user-entered' )
					.find( 'input[type=text]' );
				const $singleDesignee = $( '#single_designee' );
				
				$flexibleGiftTypeRadios
					.on( 'change', ( e ) => {
						handleFrequencyDecision();
					} )
					// Trigger now in case this has been defaulted
					.trigger( 'change' );

				let stepOneScrollTimeout;
				$mainDonationsAmount
					.on( 'keyup', ( e ) => {
						clearTimeout( stepOneScrollTimeout );
						const thisVal = $mainDonationsAmount.val().replace( /$/g, '' );
						$otherAmount.val( thisVal );
						//makeStepOneNextText();
						handleAmountDecision();
						if ( parseFloat( thisVal ) > 0 ) {
							makeNextButtonActive( $( '#main-donations-step-one-next' ) );
							stepOneScrollTimeout = setTimeout( () => {
								//flashNextButton( $stepOneNextButton );
							}, 500 );
						} else {
							makeNextButtonInactive( $( '#main-donations-step-one-next' ) );
						}
					} )
					.on( 'blur', ( e ) => {
						const thisVal = $mainDonationsAmount.val().replace( /$/g, '' );

						if ( parseFloat( thisVal ) < 5 ) {
							$mainDonationsAmount.val( '5' ).trigger( 'keyup' );
							$( '#main-donations-amount-warning' )
								.html( 'Amount must be greater than or equal to $5.' )
								.removeClass( 'hidden' );
						}
					} );

				/*
				 * TODO
				 * This doesn't belong here. It only happens once to ensure the
				 * "Other Amount" radio button is checked.
				 * Find a better place for it.
				 */
				$( '.donation-level-user-entered' )
					.closest( '.donation-level-input-container' )
					.find( 'input[type=radio]' )
					.prop( 'checked', true )
					.trigger( 'change' );

				attachButtonHandlers();
				attachGiftDetailsHandlers();
				attachDesigneeHandlers();
				attachReverseHandlers();
				setFormDefaults();

				function attachButtonHandlers() {
					const $stepTwoBackButton = $( '#main-donations-step-two-back' );
					const $stepThreeBackButton = $( '#main-donations-step-three-back' );
					const $stepFourBackButton = $( '#main-donations-step-four-back' );
					
					$stepOneNextButton
						.on( 'click', ( e ) => {
							e.preventDefault();
							/*
							 * The next button should probably not be available if these
							 * decisions haven't been made. Just putting this here for
							 * now in case I need them later.
							 */
							if ( ! $( '#frequency-decision-made' ).prop( 'checked' ) ) {
								console.log( 'Frequency decision has not been made.' );
							}
							if ( ! $( '#amount-decision-made' ). prop( 'checked' ) ) {
								console.log( 'Amount decision has not been made.' );
							}
							goToStep( '2' );
						} );

					$stepTwoNextButton
						.on( 'click', ( e ) => {
							e.preventDefault();
							goToStep( '3' );
						} );

					$stepThreeNextButton
						.on( 'click', ( e ) => {
							e.preventDefault();
							goToStep( '4' );
						} );

					$stepFourNextButton
						.on( 'click', ( e ) => {
							e.preventDefault();
							//$( '#ProcessForm' ).submit();
							$( '#pstep_next' ).click();
						} );

					$stepTwoBackButton
						.on( 'click', ( e ) => {
							e.preventDefault();
							goToStep( '1' );
						} );
					
					$stepThreeBackButton
						.on( 'click', ( e ) => {
							e.preventDefault();
							goToStep( '2' );
						} );

					$stepFourBackButton
						.on( 'click', ( e ) => {
							e.preventDefault();
							goToStep( '3' );
						} );
				}

				function attachDesigneeHandlers() {
					$body
						.on( 
							'click', 
							'.designee-search-results a, #main-donations-designee-browse-list a,' +
							'#greatest-need-list a', 
							( e ) => {
							e.preventDefault();
							e.stopImmediatePropagation();
							const $singleDesignee = $( '#single_designee' );
							const $singleDesigneeDesignated = $( '#single_designee_designated' );
							const designeeId = $( e.target ).data( 'designeeId' );

							if ( ! $singleDesigneeDesignated.prop( 'checked' ) ) {
								$singleDesigneeDesignated
									.prop( 'checked', true )
									.trigger( 'click' )
									.trigger( 'change' );
							}

							$singleDesignee
								.val( designeeId )
								.trigger( 'change' );

							browseList.hide();
							searchResultsList.hide();
							greatestNeedList.hide();

							//makeStepTwoNextText();
							handleDesigneeDecision();
							makeNextButtonActive( $stepTwoNextButton );
							//flashNextButton( $stepTwoNextButton );
						} )
						.on( 'click', '.designee-browse-list-type', ( e ) => {
							e.preventDefault();
							browseList.toggleGroup( $( e.target ) );
						} );

					$( '#main-donations-designee-search' )
						.on( 'focus', ( e ) => {
							searchResultsList.show();
						} );
				}

				function attachGiftDetailsHandlers() {
					$( '#frequency-decision-made, #amount-decision-made' )
						.on( 'change', ( e ) => {
							//giftDetailsList.dynamicShow();
						} );
				}

				// Handlers that wire the original form up to the new UI
				function attachReverseHandlers() {
					/*
					 * This just assures that recurring gifts are always autoset
					 * to monthly ongoing. Not sure it belongs here, really.
					 */
					$( '#level_flexiblegift_type2' )
						.on( 'change', ( e ) => {
							$( '#level_flexibleduration' )
								.val( 'M:0' )
								.trigger( 'change' );
						} );
				}

				function flashNextButton( $nextButton ) {
					$nextButton.addClass( 'callout' );
					setTimeout( () => {
						$nextButton.removeClass( 'callout' );
					}, 300 );
				}

				function getFrequency() {
					const frequency = $( '#level_flexiblegift_type2' ).prop( 'checked' ) &&
						$( '#level_flexibleduration' ).val() === 'M:0' ?
						'Monthly' :
						'Once';

					return frequency;
				}

				function getDesignee() {
					if ( ! $singleDesignee.prop( 'disabled' ) && $singleDesignee.val() !== '0') {
						return $singleDesignee.find( 'option:selected' ).html();
					} else {
						return 'Greatest Need';
					}
				}

				function handleAmountDecision() {
					// TODO Maybe some validation here
					$( '#amount-decision' ).html( '$' + $otherAmount.val() );
					$( '#amount-decision-item' )
						.addClass( 'decided' )
						.removeClass( 'undecided' );

					$( '#amount-decision-made' )
						.prop( 'checked', true )
						.trigger( 'change' );
				}

				function handleFrequencyDecision() {
					$( '#frequency-decision' ).html( getFrequency() );
					$( '#frequency-decision-item' )
						.addClass( 'decided' )
						.removeClass( 'undecided' );

					$( '#frequency-decision-made' )
						.prop( 'checked', true );
				}

				function handleDesigneeDecision() {
					$( '#designee-decision, #current-designee-selection' )
						.html( getDesignee() );

					$( '#designee-decision-item' )
						.addClass( 'decided' )
						.removeClass( 'undecided' );

					$( '#designee-decision-made' )
						.prop( 'checked', true );
				}

				function makeStepOneNextText() {
					const $nextText = $( '#main-donations-step-one-next-text' );
					const frequency = getFrequency() === 'Monthly' ? '/Month' : ' (One-Time)';
					const amount = $otherAmount.val();
					$nextText.html( '$' + amount + frequency );
				}

				function makeStepTwoNextText() {
					const $nextText = $( '#main-donations-step-two-next-text' );
					const designee = getDesignee();
					$nextText.html( designee );
				}

				function scrollToAndFlashNext( $nextButton ) {
					GWUtilities.scrollTo( $nextButton, () => {
						flashNextButton( $nextButton );
					} );
				}
			}
			function repurposeOriginalForm() {
				$( 'div[id^=billing], div[id^=donor]' )
					.detach()
					.appendTo( $( '#main-donations-step-3-fields' ) );
				$( 'div[id^=payment_typecc]' )
					.detach()
					.appendTo( $( '#main-donations-step-4-fields' ) );
			}

			function loadMainDonationsSection() {
				return new Promise( ( resolve, reject ) => {
					const $mainDonationsSection = $( '<section>' ).attr( 'id', 'main-donations-form' );
					$mainDonationsSection.load( 'https://growlfrequency.com/work/luminate/js/gwu_wrpr/main-donations.html', () => {
						$mainDonationsSection.prependTo( '#ProcessForm' );
						GWUtilities.loadStylesheet( '/gwu_wrpr/main-donations.css' );
						resolve( $mainDonationsSection );
					} );

				} );
			}

			function makeDesigneeBrowseList() {
				const $designeeBrowseList = $( '#main-donations-designee-browse-list' );
				let designees = [];
				let designationTypes =[];

				GWFormDesignees.getDesignees()
					.then( ( _designees ) => {
						designees = _designees;
						return GWFormDesignees.getDesignationTypes();
					} )
					.then( ( _designationTypes ) => {
						if ( ! designees ) {
							return;
						}
						designationTypes = _designationTypes;
						const designeesByType = {};
						for ( let i = 0; i < designationTypes.length; i++ ) {
							const thisType = designationTypes[i];
							designeesByType[thisType.id] = [];
						}
						for ( let i = 0; i < designees.length; i++ ) {
							const thisDesignee = designees[i];
							designeesByType[thisDesignee.typeId].push(
								'<li><a href="#" data-designee-id="' + thisDesignee.id +
								'">' + thisDesignee.name + '</a></li>'
							);
						}
						for ( let i = 0; i < designationTypes.length; i++ ) {
							const thisType = designationTypes[i];
							$designeeBrowseList.append(
								'<li class="designee-browse-list-type closed">' + 
								'<span class="designee-browse-list-header">' + 
								thisType.name + '</span>\n<ul class="browse-list-group">' + 
								designeesByType[thisType.id].join( '\n' ) +
								'</ul></li>' 
							);
						}

						/*
						 * Want to make sure that the single designee field syncs with
						 * "Your Decisions" section on page load. I think this is only required
						 * on page load, anyway. May as well stick in in here.
						 */

						const $singleDesignee = $( '#single_designee' );
						const singleDesigneeValue = parseInt( $singleDesignee.val(), 10 );

						if ( parseInt( singleDesigneeValue, 10 ) > 0 ) {
							const $matchedBrowseItem = $designeeBrowseList
								.find( 'a' )
								.filter( function() {
									return singleDesigneeValue === parseInt( $( this ).data( 'designeeId' ), 10 );
								} );

							if ( $matchedBrowseItem.length ) {
								$matchedBrowseItem.trigger( 'click' );
							}

						}

					} )
					.catch( ( _error ) => {
						console.log( _error );
					} );
			}

			function makeGreatestNeedList() {
				const $greatestNeedList = $( '#greatest-need-list' );
				GWFormDesignees.getDesignees( greatestNeedIds )
					.then( ( _designees ) => {
						/*
						 * Have to jump through some hoops here to make sure designees
						 * appear in the same order as they were fed to the initialization
						 * script.
						 */
						const foundIds = _designees.map( ( current ) => {
							return parseInt( current.id, 10 );
						} );
						const greatestNeedArray = [];
						for ( let i = 0; i < greatestNeedIds.length; i++ ) {
							const indexOfId = foundIds.indexOf( greatestNeedIds[i] );
							if ( indexOfId === -1 ) {
								continue;
							}
							const thisDesignee = _designees[indexOfId];
							greatestNeedArray.push(
								'<li><a href="#" data-designee-id="' + thisDesignee.id +
								'">' + thisDesignee.name + '</a></li>'
							);
						}
						$greatestNeedList.html( greatestNeedArray.join( '\n' ) );
					} )
					.catch( ( _error ) => {
						console.log( _error );
					} );
			}

			function makeNextButtonActive( $nextButton ) {
				$nextButton
					.addClass( 'active' )
					.siblings( '.main-donations-back-button' )
					.addClass( 'subordinate' )
			}

			function makeNextButtonInactive( $nextButton ) {
				$nextButton
					.removeClass( 'active' )
					.siblings( '.main-donations-back-button' )
					.removeClass( 'subordinate' )
			}

			function setFormDefaults() {
				if( ! GWUtilities.queryString.get( 'set.OptionalRepeat' ) ) {
					$( '#level_flexiblegift_type2' )
						.prop( 'checked', true )
						.trigger( 'change' );
				}

				if ( ! GWUtilities.queryString.get( 'set.Amount' ) ) {
					$( '#main-donations-amount' )
						.val( '15' )
						.trigger( 'keyup' );
				}
			}

		}
	}

	const browseList = {
		hide : function() {
			$( '#browse-option' ).removeClass( 'hidden' );
			$( '#browse-container' ).addClass( 'hidden' );
		},

		show : function() {
			$( '#browse-option' ).addClass( 'hidden' );
			$( '#browse-container' ).removeClass( 'hidden' );
		},

		toggleGroup : function( $group ) {
			$group
				.closest( '.designee-browse-list-type' )
				.toggleClass( 'closed' )
				.siblings()
				.addClass( 'closed' );
		},

	};

	const giftDetailsList = {
		hide : function() {
			$( '#main-donations-decisions-container' ).addClass( 'hidden' );
		},

		show : function() {
			$( '#main-donations-decisions-container' ).removeClass( 'hidden' );
		},
	};

	const greatestNeedList = {
		hide : function() {
			$( '#greatest-need-section' ).addClass( 'hidden' );
		}, 

		show : function() {
			$( '#greatest-need-section' ).removeClass( 'hidden' );
		},
	};

	const searchResultsList = {
		hide : function() {
			$( '#main-donations-designee-search-results' )
				.addClass( 'hidden' );
		},

		show : function() {
			$( '#main-donations-designee-search-results' )
				.removeClass( 'hidden' );
		},
	};


	function goToStep( stepNum ) {
		const $step = $( '#main-donations-step-' + stepNum );

		if ( ! $step.length ) {
			return;
		}

		$step
			.removeClass( 'hidden' )
			.addClass( 'active-step' )
			.siblings( '.main-donations-step' )
			.removeClass( 'active-step' )
			.addClass( 'hidden' );
	}

	function selectDesignee( designee ) {
	}

	return {
		init : init,
	};
} )();

const GWRockerSwitches = ( () => {
	let $;
	let initialized = false;

	function attachEventHandlers() {
		const $rockers = $( '.rocker' );
		const $rockerButtons = $rockers.find( 'button' );

		$rockerButtons
			.each( ( i, el ) => {
				const references = $( el ).data( 'references' );
				const $referenced = $( '#' + references );
				$referenced
					.addClass( 'linked-rocker' )
					.data( 'references', $( el ).attr( 'id' ) );
			} )
			.on( 'click', ( e ) => {
				e.preventDefault();
				const references = $( e.target ).data( 'references' );
				if ( references === undefined ) {
					selectButton( $( e.target ) );
				} else {
					const $referenced = $( '#' + references );
					$referenced.prop( 'checked', true ).trigger( 'change' );
				}
			} )

		$( '.linked-rocker' )
			.on( 'change', ( e ) => {
				selectReferencedButton( e.target );
			} )
			.filter( ':checked' )
			.each( ( i, el ) => {
				selectReferencedButton( el );
			} );

		function selectReferencedButton( el ) {
			const references = $( el ).data( 'references' );
			const $referenced = $( '#' + references );
			const $buttonParent = $referenced.closest( 'li' );
			$buttonParent
				.addClass( 'selected' )
				.siblings()
				.removeClass( 'selected' );
		}

		function selectButton( $button ) {
			const $thisParent = $button.closest( 'li' );
			$thisParent
				.addClass( 'selected' )
				.siblings()
				.removeClass( 'selected' );
		}
	}

	function init( dependencies ) {
		if ( initialized ) {
			return false;
		}

		dependencies = dependencies || {};
		$ = dependencies.jQuery || jQuery;

		if ( $ === undefined ) {
			console.log( '$ was undefined in GWRockerswitches' );
			return false;
		} else if ( ! $.fn.on ) {
			console.log( 
				'GWRockerSwitches requires jQuery v1.7 or greater. Found v' + $.fn.jquery 
			);
			return false;
		}

		initialized = true;
		$( () => {
			attachEventHandlers();
		} );

	}

	return {
		init : init,
	};
} )();




/*
 * Initialization Example
 * v2.0
 * Put this in an HTML Content section on the Luminate donation form
 
<script src='../js/luminateExtend.js'></script>
<script src='../js/gwu_wrpr/gw-form-designees.js'></script>
<script src='../js/gwu_wrpr/gw-designee-search.js'></script>
<script src='../js/gwu_wrpr/gw-main-donations.js'></script>
<script>
(function( $ ) {

	// GW Designee Search
	if ( typeof GWFormDesignees !== 'undefined' ) {
		var apiConfig = {
			apiKey : '[[S0:CONVIO_API_KEY]]',
			path : {
			nonsecure : 'http://[[S29:DOMAIN]][[S29:PATH]]',
			secure : 'https://[[S29:SECURE_DOMAIN]][[S29:SECURE_PATH]]'
			},
		};

		var donationFormId = '2522';
		GWFormDesignees.init( 
			{ luminateExtend : luminateExtend }, 
			{ apiConfig : apiConfig, donationFormId : donationFormId },
		);
	}
// End: GW Designee Search

// GW Main Donations
if ( typeof GWMainDonations !== 'undefined' ) {
	GWMainDonations
		.init( { 
			jQuery : jQuery, 
			GWFormDesignees : GWFormDesignees,
			GWDesigneeSearch : GWDesigneeSearch,
			greatestNeedIds : [
				3082, // Graduate Fellowships Fund
				1863, // GW Libraries and Academic Innovation
				1001, // GW P&P
				1047, // President's Fund for Excellence
			],
		},
		{
			backgroundImage : '../../images/gwu_wrpr/main-donation-bg-01.jpg ',
		} );
}

})( jQuery );
</script>

 */

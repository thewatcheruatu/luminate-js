/* global GWUtilities */
'use strict';

const GWMainDonations = ( () => {
	let $;
	let GWDesigneeSearch;
	let initialized = false;

	function init( dependencies ) {
		if ( initialized ) {
			return false;
		}

		dependencies = dependencies || {};
		$ = dependencies.jQuery || jQuery;
		GWDesigneeSearch = dependencies.GWDesigneeSearch;

		if ( $ === undefined ) {
			console.log( '$ was undefined in GWMainDonations' );
			return false;
		} else if ( ! $.fn.on ) {
			console.log( 
				'GWDonations requires jQuery v1.7 or greater. Found v' + $.fn.jquery 
			);
			return false;
		} else if ( GWDesigneeSearch === undefined ) {
			console.log( 'GWDesigneeSearch is a required dependency of GWMainDonations' );
			return false;
		}

		initialized = true;
		$( () => {
			const $mainDonationsSection = $( '<section>' ).attr( 'id', 'main-donations-form' );
			$mainDonationsSection.load( 'https://growlfrequency.com/work/luminate/js/gwu_wrpr/main-donations.html', () => {
				$mainDonationsSection.prependTo( 'main' );
				//linkInputs();
				GWRockerSwitches.init( { jQuery : $ } );
				$( '#level_flexiblegift_type2' )
					.on( 'change', ( e ) => {
						$( '#level_flexibleduration' )
							.val( 'M:0' )
							.trigger( 'change' );
					} );

				attachHandlers();
				GWDesigneeSearch.attach( {
					searchBox : '#main-donations-designee-search',
					searchSubmit : '#main-donations-designee-search-submit',
					searchResults : '#main-donations-designee-search-results'
				} );

				makeDesigneeBrowseList();

				// Assuming everything went as planned, hide the original form
				$( '#ProcessForm' ).addClass( 'hidden' );
				$( 'div[id^=billing], div[id^=donor]' )
					.detach()
					.appendTo( $( '#main-donations-step-3-fields' ) );
				$( 'div[id^=payment_typecc]' )
					.detach()
					.appendTo( $( '#main-donations-step-4-fields' ) );

				function makeDesigneeBrowseList() {
					const $designeeBrowseList = $( '#main-donations-designee-browse-list' );
					let designees = [];
					let designationTypes =[];

					GWDesigneeSearch.getDesignees()
						.then( ( _designees ) => {
							designees = _designees;
							return GWDesigneeSearch.getDesignationTypes();
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
									thisType.name + '</span>\n<ul>' + 
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

			} );
		} );
	}

	function attachHandlers() {
		const $stepOneConfirmButton = $( '#main-donations-step-one-confirm' );
		const $stepTwoConfirmButton = $( '#main-donations-step-two-confirm' );
		const $stepThreeConfirmButton = $( '#main-donations-step-3-confirm' );
		const $stepFourConfirmButton = $( '#main-donations-step-4-confirm' );

		$( 'body' )
			.on( 'keydown', ( e ) => {
				let enterPressed = false;
				if ( e.key !== undefined && e.key === 'Enter' ) {
					enterPressed = true;
				}
				// TODO check for keycode in else

				if ( enterPressed ) {
					e.preventDefault();
					const activeStepConfirmButton = $( '.active-step' )
						.find( '.main-donations-next-button.active' );

					if ( activeStepConfirmButton.length ) {
						activeStepConfirmButton.trigger( 'click' );
					}
				}
			} )
			.on( 
				'click', 
				'.designee-search-results a, #main-donations-designee-browse-list a', 
				( e ) => {
				e.preventDefault();
				e.stopImmediatePropagation();
				const $singleDesignee = $( '#single_designee' );
				const $singleDesigneeDesignated = $( '#single_designee_designated' );
				const designeeId = $( e.target ).data( 'designeeId' );

				if ( ! $singleDesigneeDesignated.prop( 'checked' ) ) {
					console.log( 'checking prop' );
					$singleDesigneeDesignated
						.prop( 'checked', true )
						.trigger( 'click' )
						.trigger( 'change' );
				}
				$singleDesignee
					.val( designeeId )
					.trigger( 'change' );

				makeStepTwoConfirmText();
				$stepTwoConfirmButton.addClass( 'active' );
				scrollToAndFlashConfirm( $stepTwoConfirmButton );
			} )
			.on( 'click', '.designee-browse-list-type', ( e ) => {
				e.preventDefault();
				$( e.target )
					.closest( '.designee-browse-list-type' )
					.toggleClass( 'closed' )
					.siblings()
					.addClass( 'closed' );
			} )
			.on( 'keyup change', '#main-donations-step-3-fields input.required', ( e ) => {
				let showConfirmButton = true;

				$( '#main-donations-step-3-fields' )
					.find( 'input.required' )
					.each( ( i, el ) => {
						if ( ! showConfirmButton ) {
							return;
						}
						if ( $( el ).val() === '' ) {
							showConfirmButton = false;
						}
					} );

				if ( showConfirmButton ) {
					$stepThreeConfirmButton.addClass( 'active' );
					scrollToAndFlashConfirm( $stepThreeConfirmButton );
				} else {
					$stepThreeConfirmButton.removeClass( 'active' );
				}
			} )
			.on( 
				'click', 
				'#change-frequency-decision, #change-amount-decision', 
				( e ) => {
					e.preventDefault();
					goToStep( '1' );
			} )
			// Link that unhides the Browse options
			.on( 'click', '#browse-option-link', ( e ) => {
				e.preventDefault();
				$( '#browse-option' ).addClass( 'hidden' );
				$( '#browse-container' ).removeClass( 'hidden' );
			} );

			const $searchSection = $( '#main-donations-designee-search-section' );
			$( '#main-donations-greatest-need' )
				.on( 'click', ( e ) => {
					e.preventDefault();
					$searchSection.addClass( 'hidden' );
					$( '#single_designee_unrestricted' )
						.prop( 'checked', true )
						.trigger( 'click' )
						.trigger( 'change' );
					makeStepTwoConfirmText();
					$stepTwoConfirmButton.addClass( 'active' );
					scrollToAndFlashConfirm( $stepTwoConfirmButton );
				} )
			$( '#main-donations-specific-designee' )
				.on( 'click', ( e ) => {
					e.preventDefault();
					$searchSection.removeClass( 'hidden' );
				} );

		const $flexibleGiftTypeRadios = $( 'input[name=level_flexiblegift_type]' );
		const $mainDonationsAmount = $( '#main-donations-amount' );
		const $otherAmount = $( '.donation-level-user-entered' )
			.find( 'input[type=text]' );
		const $singleDesignee = $( '#single_designee' );
		
		$flexibleGiftTypeRadios.on( 'change', ( e ) => {
			makeStepOneConfirmText();
		} );

		let stepOneScrollTimeout;
		$mainDonationsAmount
			.on( 'keyup', ( e ) => {
				clearTimeout( stepOneScrollTimeout );
				const thisVal = $mainDonationsAmount.val().replace( /$/g, '' );
				$otherAmount.val( thisVal );
				makeStepOneConfirmText();
				if ( parseFloat( thisVal ) > 0 ) {
					$( '#main-donations-step-one-confirm' ).addClass( 'active' );
					stepOneScrollTimeout = setTimeout( () => {
						scrollToAndFlashConfirm( $stepOneConfirmButton );
					}, 1000 );
				} else {
					$( '#main-donations-step-one-confirm' ).removeClass( 'active' );
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

		function attachButtonHandlers() {
			const $recurringRadio = $( '#level_flexiblegift_type2' );
			const $recurringSelect = $( '#level_flexibleduration' );

			$stepOneConfirmButton
				.on( 'click', ( e ) => {
					e.preventDefault();
					const frequency = $recurringRadio.prop( 'checked' ) &&
						$recurringSelect.val() === 'M:0' ?
						'Monthly' :
						'Once';
					$( '#frequency-decision' ).html( frequency );
					$( '#amount-decision' ).html( '$' + $otherAmount.val() );
					$( '#frequency-decision-item, #amount-decision-item' )
						.addClass( 'decided' )
						.removeClass( 'undecided' );
					goToStep( '2' );
				} );

			$stepTwoConfirmButton
				.on( 'click', ( e ) => {
					e.preventDefault();
						.addClass( 'decided' )
						.removeClass( 'undecided' );
					goToStep( '3' );
				} );

			$stepThreeConfirmButton
				.on( 'click', ( e ) => {
					e.preventDefault();
					goToStep( '4' );
				} );
		}


		function makeStepOneConfirmText() {
			const $confirmText = $( '#main-donations-step-one-confirm-text' );
			const frequency = getFrequency() === 'Monthly' ? '/Month' : ' (One-Time)';
			const amount = $otherAmount.val();
			$confirmText.html( '$' + amount + frequency );
		}

		function makeStepTwoConfirmText() {
			const $confirmText = $( '#main-donations-step-two-confirm-text' );
			const designee = getDesignee();
			$confirmText.html( designee );
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

		function scrollToAndFlashConfirm( $confirmButton ) {
			GWUtilities.scrollTo( $confirmButton, () => {
				$confirmButton.addClass( 'callout' );
				setTimeout( () => {
					$confirmButton.removeClass( 'callout' );
				}, 350 );
			} );
		}
	}

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

( ( $ ) => {
	GWUtilities.scrollTo = function( anchor, cb ) {
		const $anchor = typeof anchor === 'string' ? $( anchor ) : anchor;
		if ( ! $anchor.length ) {
			console.log( 'anchor does not exist' );
			return;
		}
		cb = typeof cb === 'function' ? cb : function() {};
		
		const offsetTop = $anchor.offset().top;
		$( 'html, body' ).animate( {
			scrollTop : offsetTop + 'px'
		}, 'fast', cb );
	}
} )( jQuery );

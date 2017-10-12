/* global GWUtilities, GWMockSelectionLists */

'use strict';

const GWDonations = ( function() {
	let $;
	let initialized = false;

	const defaultState = {
		recurring : false,
		frequency : null,
		duration : null,
	};
	const donationLevels = {
		recurring : {
			annual : [],
			monthly : [],
		},
		oneTime : [],
	};
	
	function attachHandlers() {
		const $donationLevels = $( '.donation-levels' );

		$donationLevels
			.on( 'click', '.donation-level-container', function( e ) {
				const $target = $( e.target );

				if ( $target.is( 'input, label' ) ) {
					return;
				}

				const $childRadioButton = $target.find( 'input[type=radio]' );
				$childRadioButton
					.prop( 'checked', true )
					.trigger( 'change' )
					.trigger( 'focus' );
			} )

			.on( 'change', 'input[type=radio]', function( e ) {
				const $target = $( e.target );
				// Only proceed if a radio button in the group is actually checked
				if ( ! $target.prop( 'checked' ) ) {
					return;
				}

				const $donationLevelContainer = $target
					.closest( '.donation-level-container' );

				$donationLevelContainer
					.addClass( 'selected' )
					.siblings( '.donation-level-container' )
					.removeClass( 'selected' );
				
				/*
				 * If text box for custom user amount is an available option...
				 * then we want to ensure it's pulled from the tab index unless...
				 * "Other Amount" is the selected radio button, in order to prevent...
				 * the user from tabbing to it and unexpectedly selecting 
				 * "Other Amount".
				 */
				const $userEnteredTextbox = $( 
					'.donation-level-user-entered input[type=text]' 
				);

				if ( ! $userEnteredTextbox.length ) {
					return;
				}

				if ( $donationLevelContainer
						.find( '.donation-level-user-entered' )
						.length ) {
					$userEnteredTextbox.attr( 'tabindex', '' );
					return;
				} else {
					$userEnteredTextbox.attr( 'tabindex', '-1' );
				}
			} );
			
		/*
		 * Want to ensure that the tab index is negative for the 
		 * user donation level textfield.
		 * This conditional probably isn't necessary.
		 */
		if ( ! $donationLevels.find( 'input[type=radio]:checked' ).length ) {
			$donationLevels
				.find( 'input[type=radio]' )
				.first()
				.trigger( 'change' );
		}


		// Attach handlers to gift type selection
		const $giftTypeRadios = $( 'input[name=level_flexiblegift_type]' );
		const $giftDurationSelect = $( '#level_flexibleduration' );

		$giftTypeRadios.add( $giftDurationSelect ).on( 'change', ( e ) => {
			if ( ! donationLevels.oneTime.length ) {
				return;
			}

			const $checkedRadio = $giftTypeRadios.filter( ':checked' );
			const $donationLevels = $( '.donation-level-container' )
				.not( ':last-child' );
			const giftDurationVal = $giftDurationSelect.val();

			$donationLevels.addClass( 'hidden' );

			if ( $checkedRadio.attr( 'id' ) === 'level_flexiblegift_type2' ) {
				if ( ! giftDurationVal.length ) {
					return;
				} else if ( giftDurationVal.charAt( 0 ) === 'M' ) {
					$( '.monthly-level' ).removeClass( 'hidden' );
				} else if ( giftDurationVal.charAt( 0 ) === 'Y' ) {
					$( '.annual-level' ).removeClass( 'hidden' );
				}
			} else {
				$( '.one-time-level' ).removeClass( 'hidden' );
			}
		} );
	}
	
	function donationTotalInit() {
		const $donationLevelTotalDefault = $( '.donation-level-total-amount' )
			.addClass( 'hidden' );
		const $donationLevelTotalReplacement = $( '<span>' )
			.attr( 'id', 'donation-level-total-amount-replacement' );
		
		$donationLevelTotalDefault.after( $donationLevelTotalReplacement );
		
		const $giftTypeRadios = $( 'input[name=level_flexiblegift_type]' );
		const $giftDurationDropdown = $( '#level_flexibleduration' );
		const $donationLevelRadios = $( 'input[name=level_flexibleexpanded]' );
		const $donationLevelUserEntered = $( '.donation-level-user-entered' )
			.children( 'input[type=text]' );
		
		$( 'body' ).on( 
			'change keyup', 
			[ 
				$giftTypeRadios, 
				$giftDurationDropdown, 
				$donationLevelRadios, 
				$donationLevelUserEntered 
			], 
			function( e ) {	
				let donationTotal;
				// Want to ignore keyup unless it's on the custom amount field
				if ( 
					e.type === 'keyup' && 
					( ! e.target.type || e.target.type !== 'text' ) 
				) {
					return;
				}
				donationTotal = GWDonationsUtilities.calculateDonationTotal();
				$donationLevelTotalReplacement.html( 
					GWDonationsUtilities.formatDonationTotal( donationTotal )
				);
			} 
		);
	}

	function handleDefaultState() {
		if ( defaultState.recurring ) {
			setFlexibleDuration( defaultState.frequency, defaultState.duration );
		}

		/*
		 * Need to make sure we handle the flexible donation amount if it
		 * was set by default in the form configuration.
		 */
		$( 'input[name=level_flexibleexpanded]:checked' ).trigger( 'change' );
	}
	
	/*
	 * handleQueryString should be called before handleDefaultState,
	 * because we want any URL parameters to override previously set
	 * default state property values
	 */
	function handleQueryString() {
		const optionalRepeat = GWUtilities.queryString.get( 'set.OptionalRepeat' );
		const flexibleDuration = GWUtilities
			.queryString
			.get( 'set.FlexibleDuration' );

		if ( optionalRepeat ) {
			setDefault( 'recurring', true );
			if ( flexibleDuration ) {
				if ( flexibleDuration === 'M:0' ) {
					setDefault( 'gift duration', 'monthly ongoing' );
				}
				if ( flexibleDuration === 'Y:0' ) {
					setDefault( 'gift duration', 'yearly ongoing' );
				}
			}
		}
	}
	
	function init( dependencies ) {
		if ( initialized ) {
			return false;
		}

		dependencies = dependencies || {};
		$ = dependencies.jQuery || jQuery;
		
		if ( $ === undefined ) {
			console.log( 'GWDonations failed to find an instance of jQuery' );
			return false;
		} else if ( !$.fn.on ) {
			console.log( 
				'GWDonations requires jQuery v1.7 or greater. Found v' + $.fn.jquery 
			);
			return false;
		}
	
		initialized = true;
		
		// On document ready
		$( () => {
			// Total Price seems to be kind of laggy, so I'm just going to replace it
			attachHandlers();
			miscellaneousSetup();
			donationLevelsInit();
			donationTotalInit();
			handleQueryString();
			handleDefaultState();
			miscellaneousCleanup();
			$( 'body' ).addClass( 'gw-donations-ready' );
		} );

		return true;
	}
	
	function miscellaneousCleanup() {
		let $giftTypeRow;
		
		if ( $( '#ProcessForm' ).length ) {
			$( 'nav ul' ).addClass( 'transparent' );
		}
		
		$giftTypeRow = $( '#level_flexiblegift_type_Row' );
		if ( $giftTypeRow.length ) {
			$giftTypeRow
				.removeClass( 'field-required' )
				.find( 'legend' )
				.prepend( '<span class="field-required"></span>' );
		}
		
	}
	
	function miscellaneousSetup() {
		let $billingAddressState;
		querystringSetComments();
		
		/* Add checkbox to control State field for international addresses 
		 * Move this to a new function if you ever add anything else 
		 * to this miscellaneous function
		*/
		$billingAddressState = $( '#billing_addr_state' );
		if ( ! $billingAddressState.length ) {
			return;
		}
		
		$( '<div id="billing_addr_outside_us" class="form-row"><input type="checkbox" id="international-address">My credit card / billing address is outside the U.S. or Canada</div>' )
			.insertBefore( '#billing_addr_state_row' );
		$( '#international-address' ).on( 'change', function() {
			const $internationalAddress = $( this );

			if ( $internationalAddress.prop( 'checked' ) ) {
				$billingAddressState.val( 'None' ).trigger( 'change' );
			} else if ( $billingAddressState.val() === 'None' ) {
				$billingAddressState.val( '' ).trigger( 'change' );
			}
		} );
	}
	
	function querystringSetComments() {
		let $commentsField;
		let comments;
		
		comments = GWUtilities.queryString.get( 'set.Comments' );
		if ( ! comments ) {
			return;
		}
		$commentsField = $( '#comments_input' );
		if ( ! $commentsField.length ) {
			return;
		}
		$commentsField.val( comments );
	}

	function setDefault( property, value ) {
		if ( property === 'gift duration' ) {
			defaultState.recurring = true;
			if ( value === 'monthly ongoing' ) {
				defaultState.frequency = 'monthly';
				defaultState.duration = '0';
			} else if ( value === 'yearly ongoing' ) {
				defaultState.frequency = 'yearly';
				defaultState.duration = '0';
			}
		}
	}

	// Duration of 0 = ongoing
	function setFlexibleDuration( frequency, duration ) {
		const $giftTypeRecurring = $( '#level_flexiblegift_type2' );
		const $flexibleDuration = $( '#level_flexibleduration' );

		$giftTypeRecurring.prop( 'checked', true ).trigger( 'change' );
		if ( frequency && duration ) {
			let flexVal = '';

			if ( frequency === 'yearly' ) {
				flexVal += 'Y:';
			} else if ( frequency === 'monthly' ) {
				flexVal += 'M:';
			} else if ( frequency === 'quarterly' ) {
				flexVal += 'Q:';
			}
			flexVal += duration;
			$flexibleDuration.val( flexVal ).trigger( 'change' );
		}

	}

	function setDonationLevels( frequency, amounts ) {
		amounts = amounts.map( parseFloat );

		if ( frequency === 'one-time' ) {
			donationLevels.oneTime = amounts;
		} else {
			donationLevels.recurring[frequency] = amounts;
		}
	}
	
	function donationLevelsInit() {
		const $levelContainers = $( '.donation-level-container' );

		$levelContainers.each( ( i, container ) => {
			const $container = $( container );
			let amount;
			
			amount = $container.find( '.donation-level-amount-container' ).text();
			amount = parseFloat( amount.replace( /[,$]/g, '' ) );
			if ( isNaN( amount ) ) {
				return;
			}

			if ( donationLevels.recurring.monthly.indexOf( amount ) >= 0 ) {
				$container.addClass( 'monthly-level' );
			}
			if ( donationLevels.recurring.annual.indexOf( amount ) >= 0 ) {
				$container.addClass( 'annual-level' );
			}
			if ( donationLevels.oneTime.indexOf( amount ) >= 0 ) {
				$container.addClass( 'one-time-level' );
			}
		} );
	}

	return {
		init : init,
		setDefault : setDefault,
		setDonationLevels : setDonationLevels,
	};

} )();



/*
 *
 * Generally, tools for working with donation totals. Calculating. Setting.
 *
 */
const GWDonationsUtilities = ( () => {
	let $;
	let initialized = false;
	
	function init( dependencies ) {
		if ( initialized ) {
			return false;
		}

		dependencies = dependencies || {};
		$ = dependencies.jQuery || jQuery;
		
		if ( $ === undefined ) {
			console.log( 
				'GWDonationsUtilities failed to find an instance of jQuery' 
			);
			return false;
		} 

		initialized = true;
		return true;
	}
	
	function calculateDonationTotal() {
		let $donationLevelInputContainer;
		let $donationLevelRadios;
		let $donationLevelSelected;
		let $giftTypeRadios;
		let $giftDurationDropdown;
		
		let giftTypeValue;
		let giftDurationValue;
		let giftAmount;
		let giftAmountFrequency;
		let giftAmountMultiplier;

		$giftTypeRadios = $( 'input[name=level_flexiblegift_type]' );
		$giftDurationDropdown = $( '#level_flexibleduration' );
		$donationLevelRadios = $( 'input[name=level_flexibleexpanded]' );
		
		giftTypeValue = $giftTypeRadios.filter( ':checked' ).val();
		giftDurationValue = $giftDurationDropdown.val();
		giftAmount = 0;
		giftAmountFrequency = '';
		giftAmountMultiplier = 1;
		
		$donationLevelSelected = $donationLevelRadios.filter( ':checked' );
		if ( $donationLevelSelected.length ) {
			$donationLevelInputContainer = $donationLevelSelected
				.parent( '.donation-level-label-input-container' );

			if ( 
				$donationLevelInputContainer
					.siblings( '.donation-level-user-entered' )
					.length 
			) {
				giftAmount = parseFloat( 
					$donationLevelInputContainer
						.parent()
						.find( 'input[type=text]' )
						.val()
						.replace( /[$]/gi, '' ) 
				) || 0;
			} else {
				giftAmount = parseFloat( 
					$donationLevelInputContainer
						.siblings( 'label' )
						.find( '.donation-level-amount-container' )
						.text()
						.replace( /[$,]/gi, '' ) 
				);
			}
		}

		if ( giftTypeValue === '2' ) {
			// do recurring gift stuff
			if ( giftDurationValue === undefined || giftDurationValue === '' ) {
				giftAmount = 0;
			} else if ( ( /:0$/ ).test( giftDurationValue ) ) {
				if ( giftDurationValue === 'M:0' ) {
					giftAmountFrequency = 'monthly';
				} else if ( giftDurationValue === 'Y:0' ) {
					giftAmountFrequency = 'yearly';
				} else if ( giftDurationValue === 'Q:0' ) {
					giftAmountFrequency = 'quarterly';
				}
			} else {
				giftAmountMultiplier = parseInt( giftDurationValue.substring( 2 ) );
			}
		} else {
			// one-time gift - maybe nothing to do here?
		}
		giftAmount *= giftAmountMultiplier;

		return {
			amount: giftAmount,
			frequency: giftAmountFrequency
		};
	}
	
	function formatDonationTotal( donationTotal ) {
		const formatted = GWUtilities.formatMoney( donationTotal.amount ) +
			( donationTotal.frequency !== '' ? '/' + donationTotal.frequency : '' );
		return formatted;
	}
	
	function setDonation( donation ) {
		let $giftDurationDropdown;
		let $donationLevelAmountContainers;
		let $donationLevelUserEnteredRadio;
		let $donationLevelUserEnteredText;
		
		let donationLevelRadioFound;
		
		$giftDurationDropdown = $( '#level_flexibleduration' );
		$donationLevelUserEnteredText = $( '.donation-level-user-entered' )
			.children( 'input[type=text]' );
		$donationLevelUserEnteredRadio = $donationLevelUserEnteredText
			.closest( '.donation-level-input-container' )
			.find( 'input[type=radio]' );
		$donationLevelAmountContainers = $( '.donation-level-amount-container' );
		
		if ( !$donationLevelAmountContainers.length ) {
			return;
		}
		
		donationLevelRadioFound = false;
		$donationLevelAmountContainers.each( function() {
			const thisAmount = parseFloat( 
				$( this ).text().trim().replace( /[$,]/g, '' ) 
			);
			if ( donation.amount === thisAmount ) {
				donationLevelRadioFound = true;
			}
		} );

		if ( ! donationLevelRadioFound ) {
			$donationLevelUserEnteredRadio
				.prop( 'checked', true )
				.trigger( 'change' );
			$donationLevelUserEnteredText.val( donation.amount ).trigger( 'change' );
		}
		
		if ( donation.frequency === '' ) {
			return;
		}
		$( '#level_flexiblegift_type2' )
			.prop( 'checked', true )
			.trigger( 'change' );

		if ( donation.frequency === 'monthly' ) {
			$giftDurationDropdown.val( 'M:0' );
		}

		$giftDurationDropdown.trigger( 'change' );
		
	}
	
	return {
		calculateDonationTotal: calculateDonationTotal,
		formatDonationTotal: formatDonationTotal,
		init : init,
		setDonation: setDonation
	};
	
} )();


/*
 *
 * Detaches recurring/one-time radios (and makes them look more like buttons)
 * and by extension, the recurring frequency selection list,  
 * and places them above the donation levels.
 *
 */
const SustainingFocus = ( () => {
	let $;
	let initialized = false;
	
	function attachHandlers() {
		const $giftTypeRadios = $( 'input[name=level_flexiblegift_type]' );
		const $giftDurationRow = $( '#level_flexibleduration_row' );
		const $giftDurationSelect = $( '#level_flexibleduration' );
		
		$giftTypeRadios
			/* 
			 * Ensure that the recurring options dropdown is hidden when the user
			 * select one-time gift--no need for him/her to see that
			 */
			.on( 'change', function() {
				if ( $( this ).val() === '1' ) {
					// one-time gift
					$giftDurationRow.addClass( 'hidden' );
					$giftDurationSelect.prop( 'disabled', true );
				} else if ( $( this ).val() === '2' ) {
					// recurring gift
					$giftDurationRow.removeClass( 'hidden' );
					$giftDurationSelect.prop( 'disabled', false );
				}

				if ( $( this ).prop( 'checked' ) === false ) {
					$( this ).parent().removeClass( 'selected' );
				} else {
					$( this ).parent()
						.addClass( 'selected' )
						.siblings( '.designated-giving-recurring-row' )
						.removeClass( 'selected' );
				}
			} )
			.filter( ':checked' ).trigger( 'change' );
	}
	
	
	function buttonizeGiftType() {
		$( '.designated-giving-recurring-row' )
			.addClass( 'button' )
			.on( 'click', ( e ) => {
				const $target = $( e.target );
				if ( $target.hasClass( 'designated-giving-recurring-row' ) ) {
					$target
						.find( 'input[type=radio]' )
						.prop( 'checked', true )
						.trigger( 'change' );
				}
			} );
	}
	
	function init( dependencies, options ) {
		if ( initialized ) {
			return false;
		}

		dependencies = dependencies || {};
		$ = dependencies.jQuery || jQuery;
		
		options = options || {};
		options.buttonizeGiftType = options.buttonizeGiftType || false;
		
		if ( $ === undefined ) {
			console.log( 'GWDonations failed to find an instance of jQuery' );
			return false;
		} else if ( !$.fn.on ) {
			console.log( 'GWDonations requires jQuery v1.7 or greater. Found v' + $.fn.jquery );
			return false;
		}
		initialized = true;
	
		// on document ready
		$( () => {
			const $flexibleGiftTypeRow = $( '#level_flexiblegift_type_Row' );
			if ( ! $flexibleGiftTypeRow.length ) {
				return;
			}
			const $flexibleDurationRow = $( '#level_flexibleduration_row' );
			const $levelFlexibleRow = $( '#level_flexible_row' );
			const $oneTimeGiftType = $( '#level_flexiblegift_type1' ).parent();
			const $recurringGiftType = $( '#level_flexiblegift_type2' ).parent();
			
			/* 
			 * Detach gift type and duration sections and place them above
			 * the donation levels.
			 */
			$flexibleDurationRow.detach().prependTo( $levelFlexibleRow );
			$flexibleGiftTypeRow.detach().prependTo( $levelFlexibleRow );
			
			// Change order of the gift type options such that recurring appears first
			$recurringGiftType.detach().insertBefore( $oneTimeGiftType );
			if ( options.buttonizeGiftType ) {
				buttonizeGiftType();
			}

			attachHandlers();
		} );
		

		return true;
	}
	
	return {
		init : init
	};
} )();

let GWDefaultSingleDesigneeBillingInfo = ( function() {
	let $;
	let initialized;

	initialized = false;

	function attachEventHandlers() {
		$( '#edit-billing-info' ).on( 'click', ( e ) => {
			e.preventDefault();
			$( '#billing-info-response-list' ).addClass( 'hidden' );
			toggleBillingRowsDisplay( 'on' );
		} );
	}

	function init( dependencies ) {
		dependencies = dependencies || {};
		$ = dependencies.jQuery || jQuery;

		if ( initialized ) {
			console.log( 'GWDefaultSingleDesigneeBillingInfo has already been initialized' );
			return false;
		}
		if ( document.readyState !== 'interactive' && document.readyState !== 'complete' ) {
			console.log( 'GWDefaultSingleDesigneeBillingInfo.init() called before DOM ready. Please call from DOM ready handler.' );
			return false;
		}

		if ( ! $ ) {
			console.log( 'GWDefaultSingleDesigneeBillingInfo requires jQuery' );
			return false;
		} else if ( ! $.fn.on ) {
			console.log( 'GWDefaultSteppedSingleDesignee requires .on method from jQuery version 1.7 or greater. Found v' + $.fn.jquery );
			return false;
		}

		streamlineBillingInfo();
		attachEventHandlers();
		initialized = true;
	}

	function streamlineBillingInfo() {
		let $firstName;
		let $lastName;
		let $streetName1;
		let $streetName2;
		let $city;
		let $state;
		let $zipcode;
		let $country;
		let $email;

		let allFields;
		let docfrag;
		let docfragHtml;
		let requiredFields;

		$firstName = $( '#billing_first_namename' );
		$lastName = $( '#billing_last_namename' );
		$streetName1 = $( '#billing_addr_street1name' );
		$streetName2 = $( '#billing_addr_street2name' );
		$city = $( '#billing_addr_cityname' );
		$state = $( '#billing_addr_state' );
		$zipcode = $( '#billing_addr_zipname' );
		$country = $( '#billing_addr_country' );
		$email = $( '#donor_email_addressname' );

		allFields = [
			{ 'label' : 'First Name', 'field' : $firstName  },
			{ 'label' : 'Last Name', 'field' : $lastName  },
			{ 'label' : 'Street 1', 'field' : $streetName1  },
			{ 'label' : 'Street 2', 'field' : $streetName2  },
			{ 'label' : 'City', 'field' : $city  },
			{ 'label' : 'State/Province', 'field' : $state  },
			{ 'label' : 'ZIP/Postal Code', 'field' : $zipcode  },
			{ 'label' : 'Country', 'field' : $country  },
			{ 'label' : 'Email Address', 'field' : $email  }
		];

		requiredFields = [
			$firstName,
			$lastName,
			$streetName1,
			$city,
			$state,
			$zipcode,
			$country,
			$email
		];

		for ( let i = 0; i < requiredFields.length; i++ ) {
			if ( ! requiredFields[i].val() ) {
				return; // Can exit the function here, because a required field is empty
			}
		}

		/* We have all required fields, so make a new docfrag for 
		 * streamlined display
		 */
		docfrag = document.createDocumentFragment(); //probably don't need this
		docfragHtml = [];
		for ( let i = 0; i < allFields.length; i++ ) {
			if ( ! allFields[i].field.val() ) {
				continue;
			}
			docfragHtml.push( 
				'<p class="billing-info-response"><span class="label">' + allFields[i].label + ': </span> ' +
				'<span class="field-value">' + allFields[i].field.val() + '</span></p>' 
			);
		}
		docfragHtml = '<div id="billing-info-response-list">'
		            + '<p><em>Please review billing info and '
								+ '<button id="edit-billing-info" class="gw-gold">edit</button> '
								+ 'if incorrect.</em></p>' + docfragHtml.join( '' ) + '</div>';
		$( '#billing_first_name_row' ).before( docfragHtml );
		toggleBillingRowsDisplay( 'off' );
	}

	function toggleBillingRowsDisplay( onoff ) {
		let billingRowIds;
		let applyMethod;

		billingRowIds = [
			'billing_first_name_row',
			'billing_last_name_row',
			'billing_addr_street1_row',
			'billing_addr_street2_row',
			'billing_addr_city_row',
			'billing_addr_outside_us',
			'billing_addr_state_row',
			'billing_addr_zip_row',
			'billing_addr_country_row',
			'donor_email_address_row'
		];

		applyMethod = onoff === 'on' ? 'removeClass' : 'addClass';
		for ( let i = 0; i < billingRowIds.length; i++ ) {
			$( '#' + billingRowIds[i] )[applyMethod]( 'hidden' );
		}
	}

	return {
		init : init
	};
} )();

const GWDefaultSteppedSingleDesignee = ( function() {
	let $;
	let initialized;
	
	initialized = false;
	
	function attachHandlers() {
		$( document )
			.on( 'click', '.goto-step', function( e ) {
				let destinationStepNum;
				
				e.preventDefault();
				destinationStepNum = $( this ).data( 'goto' );
				goToStep( destinationStepNum );
			} )
			.on( 'click', '.step-navigator-goto', function( e ) {
				let destinationStepNum;
				
				e.preventDefault();
				destinationStepNum = $( this ).data( 'goto' );
				goToStep( destinationStepNum );
			} );
		stepNavigatorAssignDesignee();
		
		$( 'input[name=single_designee_radio], #single_designee' ).on( 'change', stepNavigatorAssignDesignee );
		$( 'input[name=level_flexiblegift_type], #level_flexibleduration, input[name=level_flexibleexpanded]' )
			.on( 'change', stepNavigatorAssignGiftDetails );
		$( '#level_flexible_row' ).find( 'input[type=text]' ).on( 'keyup', stepNavigatorAssignGiftDetails );
		stepNavigatorAssignGiftDetails();
	}
	
	function goToStep( stepNum, doScroll ) {
		let currentStep;
		let destinationStep;
		doScroll = doScroll === undefined ? true : doScroll;
		
		currentStep = $( '.donation-form-step' ).filter( function() { 
			return ! $( this ).hasClass( 'hidden' );
		} );
		destinationStep = $( '#step-' + stepNum );
		if ( ! destinationStep.length ) {
			return;
		}
		if ( currentStep.attr( 'id' ) === destinationStep.attr( 'id' ) ) {
			return;
		}
		currentStep.addClass( 'hidden' );
		destinationStep.removeClass( 'hidden' );
		$( '.step-navigator-goto' ).removeClass( 'selected' );
		$( '#step-navigator-step-' + stepNum ).addClass( 'selected' );
		if ( doScroll ) {
			scrollTo( '#step-navigator' );
		}
	}
	
	function scrollTo( thing, options ) {
		let offset;

		thing = typeof thing === 'string' ? $( thing ) : thing;
		options = options || {};
		options.animate = options.animate || true;
		
		offset = thing.offset();
		if ( options.animate ) {
			$( 'html, body' ).stop().animate( {
				scrollTop: offset.top
			}, 500 );
		} else {
			$( window ).scrollTop( offset.top );
		}
	}
	
	function init( dependencies, stepOrder ) {
		if ( initialized ) {
			console.log( 'GWDefaultSteppedSingleDesignee has already been initialized' );
			return false;
		}
		dependencies = dependencies || {};
		$ = dependencies.jQuery || jQuery;

		if ( $ === undefined ) {
			console.log( 'GWDefaultSteppedSingleDesignee requires jQuery' );
			return false;
		} else if ( ! $.fn.on ) {
			console.log( 'GWDefaultSteppedSingleDesignee requires .on method from jQuery version 1.7 or greater. Found v' + $.fn.jquery );
			return false;
		}

		initialized = true;
		// On document ready
		$( () => {
			boxUpSteps( stepOrder );
			attachHandlers();
		} );

		return true;
	}
	
	function boxUpSteps( stepOrder, options ) {
		let $designeeSections;
		let $billingInfoSections;
		let $giftDetailsSections;
		let $additionalSections;
		let $paymentInfoSections;
		let allStepsDocFrag;
		let stepDiv;
		let stepNavigator;
		let steps = [];
		
		$designeeSections = $( '#single_designee_row' );
		if ( $( '#comments_input' ).length ) {
			$designeeSections = $designeeSections.add( $( '#comments_input' ).closest( '.form-row' ) );
		}
		$giftDetailsSections = $( '#level_flexible_row' )
			.add( '#level_standard_row' );
		$billingInfoSections = $( '#billing_title_row' )
			.add( 'div[id^=billing_]' )
			.add( '#donor_email_address_row' )
			.add( '#donor_email_opt_in_Row' )
			.add( '#donor_remember_me_row' )
			.add( '#billing-info-response-list' );
		$( '#tribute_show_honor_fields_row' )
			.prepend( '<h3>Honor and Memorial Gifts' );
		$( '.matching-gift-container' )
			.prepend( '<h3>Employer Matching Gifts' );
		$additionalSections = $( '#tribute_show_honor_fields_row' )
			.add( 'div[id^=tribute]' )
			.add( '.matching-gift-container' );
		$paymentInfoSections = $( '.payment-type-element-container, .button-container' );

		const defaultStepOrder = [
			'designee',
			'gift',
			'billing',
			'additional',
			'payment'
		];

		stepOrder = stepOrder || defaultStepOrder;

		for ( let j = 0; j < stepOrder.length; j++ ) {
			let $items;
			let heading;

			switch ( stepOrder[j] ) {
			case 'designee' :
				$items = $designeeSections;
				heading = 'Your Designee';
				break;
			case 'gift' :
				$items = $giftDetailsSections;
				heading = 'Gift Details';
				break;
			case 'billing' :
				$items = $billingInfoSections;
				heading = 'Billing Information';
				break;
			case 'additional' :
				$items = $additionalSections;
				heading = 'Additional Information';
				break;
			case 'payment' :
				$items = $paymentInfoSections;
				heading = 'Credit Card Information';
				break;
			}

			if ( ! $items.length ) {
				continue;
			}

			steps.push( {
				items : $items,
				heading : heading
			} );
		}
		
		allStepsDocFrag = document.createDocumentFragment();
		stepNavigator = makeStepNavigator( steps );
		allStepsDocFrag.appendChild( stepNavigator );
		for ( let i = 0; i < steps.length; i++ ) {
			stepDiv = makeStepDiv( steps[i].items, i + 1, steps[i].heading );
			if ( i + 1 < steps.length ) {
				$( stepDiv ).append( '<button class="next-step goto-step" data-this-step="' + ( i + 1 ) + '" data-goto="' + ( i + 2 ) + '">Next: ' + steps[i+1].heading + '</button>' );
			}
			if ( i > 0 ) {
				$( stepDiv ).append( '<button class="previous-step goto-step subordinate" data-this-step="' + ( i + 1 ) + '" data-goto="' + i + '">Previous: ' + steps[i-1].heading + '</button>' );
			}
			allStepsDocFrag.appendChild( stepDiv );
			stepDiv = undefined;
		}
		
		options = options || {};
		options.activeStep = options.activeStep || 1;
		$( '.form-progress-bar' ).next( '.form-row' ).after( allStepsDocFrag );
		$( '#pstep_next' ).html( 'Next: Confirm &amp; Submit' );
		$( '.section-header-container, #payment_cc_container > h3' ).remove();

		goToStep( options.activeStep, false );
	}
	
	function makeStepNavigator( steps ) {
		let ul;
		
		ul = document.createElement( 'ul' );
		ul.id = 'step-navigator';
		for ( let i = 0; i < steps.length; i++ ) {
			let html;
			html = '<li><a href="#" id="step-navigator-step-' + ( i + 1 ) + '" class="step-navigator-goto" data-goto="' + ( i + 1 ) + '">'
			     + 'Step ' + ( i + 1 ) + ': ' + steps[i].heading + '</a>';
			if ( [ 'Your Designee', 'Gift Details' ].indexOf( steps[i].heading ) !== -1 ) {
				html += ': <span id="step-navigator-' + steps[i].heading.toLowerCase().replace( /[\s]+/gi, '-' ) + '"></span>';
			}
			html += '</li>';
			$( html ).appendTo( ul );
		}
		return ul;
	}
	
	function makeStepDiv( $elements, stepNum, stepHeading ) {
		let stepDiv;

		stepDiv = document.createElement( 'div' );
		stepDiv.id = 'step-' + stepNum;
		stepDiv.className = 'donation-form-step hidden';
		stepDiv.innerHTML = '<h2>' + stepHeading + '</h2>';
		$elements.each( function() {
			$( this ).detach().appendTo( stepDiv );
		} );
		return stepDiv;
	}
	
	function stepNavigatorAssignDesignee() {
		let designeeName;
		let singleDesigneeSelect;
		
		if ( $( '#single_designee_unrestricted' ).prop( 'checked' ) ) {
			designeeName = $( '#single_designee_unrestricted' ).next( 'label' ).text();
		} else {
			singleDesigneeSelect = document.getElementById( 'single_designee' );
			designeeName = singleDesigneeSelect.options[singleDesigneeSelect.selectedIndex].text;
		}
		$( '#step-navigator-your-designee' ).html( designeeName );
	}
	
	function stepNavigatorAssignGiftDetails() {
		let donationTotal;
		
		donationTotal = GWDonationsUtilities.calculateDonationTotal();
		$( '#step-navigator-gift-details' ).text( GWDonationsUtilities.formatDonationTotal( donationTotal ) );
	}
	
	return {
		init: init
	};
} )();


( function( $ ) {
	try {
		GWDonationsUtilities.init( { jQuery : $ } );
		GWDonations.init( { jQuery : $ } );
		SustainingFocus.init(
			{ jQuery: $ }, 
			{ buttonizeGiftType: true } 
		);
	} catch( error ) {
		console.log( error );
	}

	// on document load
	$( function() {
		let $selects;
		
		$selects = $( 'select' );
		if ( $selects.length ) {
			GWUtilities.loadClass( 'GWMockSelectionLists' )
				.then( function() {
					try {
						let msl = new GWMockSelectionLists( { jQuery: $ } );
						msl.addFromSelect( $selects );
						$selects.addClass( 'offscreen' );
					} catch( error ) {
						console.log( error );
					}
				} )
				.catch( function( error ) {
					console.log( error );
				} );
			
		}
		
	} );
	
} )( jQuery );


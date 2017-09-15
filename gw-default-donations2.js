/* global GWUtilities, GWMockSelectionLists */

'use strict';
const GWDonations = ( function() {
	let $;
	let gwDonationsUtilities;
	let initialized;
	const defaultState = {
		recurring : false,
		frequency : null,
		duration : null,
	};
	
	function attachHandlers() {
		let $donationLevels;
		
		$donationLevels = $( '.donation-levels' );
		$donationLevels
			.on( 'click', '.donation-level-container', function( e ) {
				let $target;
				let $childRadioButton;
				
				$target = $( e.target );
				if ( $target.is( 'input, label' ) ) {
					return;
				}
				$childRadioButton = $target.find( 'input[type=radio]' );
				$childRadioButton.prop( 'checked', true ).trigger( 'change' ).trigger( 'focus' );
			} )
			.on( 'change', 'input[type=radio]', function( e ) {
				let $donationLevelContainer;
				let $userEnteredTextbox;
				
				// Only proceed if a radio button in the group is actually checked
				if ( ! $( e.target ).prop( 'checked' ) ) {
					return;
				}
				$donationLevelContainer = $( e.target ).closest( '.donation-level-container' );
				$donationLevelContainer.addClass( 'selected' ).siblings( '.donation-level-container' ).removeClass( 'selected' );
				
				/*
				 * If text box for custom user amount is an available option...
				 * then we want to ensure it's pulled from the tab index unless...
				 * "Other Amount" is the selected radio button, in order to prevent...
				 * the user from tabbing to it and unexpectedly selecting "Other Amount".
				 */
				$userEnteredTextbox = $( '.donation-level-user-entered input[type=text]' );
				if ( ! $userEnteredTextbox.length ) {
					return;
				}
				if ( $donationLevelContainer.find( '.donation-level-user-entered' ).length ) {
					$userEnteredTextbox.attr( 'tabindex', '' );
					return;
				} else {
					$userEnteredTextbox.attr( 'tabindex', '-1' );
				}
			} );
			
		/*
		 * Want to ensure that the tab index is negative for the user donation level textfield.
		 * This conditional probably isn't necessary.
		 */
		if ( ! $donationLevels.find( 'input[type=radio]:checked' ).length ) {
			$donationLevels.find( 'input[type=radio]' ).first().trigger( 'change' );
		}
	}
	
	function donationTotalInit() {
		let $donationLevelTotalDefault;
		let $donationLevelTotalReplacement;
		
		$donationLevelTotalDefault = $( '.donation-level-total-amount' ).addClass( 'hidden' );
		$donationLevelTotalReplacement = $( '<span>' ).attr( 'id', 'donation-level-total-amount-replacement' );
		
		$donationLevelTotalDefault.after( $donationLevelTotalReplacement );
		
		let $giftTypeRadios;
		let $giftDurationDropdown;
		let $donationLevelRadios;
		let $donationLevelUserEntered;
		
		$giftTypeRadios = $( 'input[name=level_flexiblegift_type]' );
		$giftDurationDropdown = $( '#level_flexibleduration' );
		$donationLevelRadios = $( 'input[name=level_flexibleexpanded]' );
		$donationLevelUserEntered = $( '.donation-level-user-entered' ).children( 'input[type=text]' );
		
		$( 'body' ).on( 'change keyup', [ $giftTypeRadios, $giftDurationDropdown, $donationLevelRadios, $donationLevelUserEntered ], function( e ) {	
			let donationTotal;
			// Want to ignore keyup unless it's on the custom amount field
			if ( e.type === 'keyup' && ( ! e.target.type || e.target.type !== 'text' ) ) {
				return;
			}
			donationTotal = gwDonationsUtilities.calculateDonationTotal();
			$donationLevelTotalReplacement.html( 
				gwDonationsUtilities.formatDonationTotal( donationTotal )
			);
		} );
	}

	function handleDefaultState() {
		if ( defaultState.recurring ) {
			setFlexibleDuration( defaultState.frequency, defaultState.duration );
		}
	}
	
	/*
	 * handleQueryString should be called before handleDefaultState,
	 * because we want any URL parameters to override previously set
	 * default state property values
	 */
	function handleQueryString() {
		const optionalRepeat = GWUtilities.queryString.get( 'set.OptionalRepeat' );
		const flexibleDuration = GWUtilities.queryString.get( 'set.FlexibleDuration' );
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
		dependencies = dependencies || {};
		$ = dependencies.jQuery || jQuery;
		
		if ( $ === undefined ) {
			throw new Error( 'GWDonations failed to find an instance of jQuery' );
		} else if ( !$.fn.on ) {
			throw new Error( 'GWDonations requires jQuery v1.7 or greater. Found v' + $.fn.jquery );
		}
	
		// Second check is redundant, but leaving it for now
		if ( initialized || $( 'body' ).hasClass( 'gw-donations-ready' ) ) {
			return true;
		}

		gwDonationsUtilities = GWDonationsUtilities( { jQuery: $ } );
		
		// On document ready
		$( () => {
			// Total Price seems to be kind of laggy, so I'm just going to replace it
			attachHandlers();
			miscellaneousSetup();
			donationTotalInit();
			handleQueryString();
			handleDefaultState();
			miscellaneousCleanup();
			$( 'body' ).addClass( 'gw-donations-ready' );
		} );

		initialized = true;
		return true;
	}
	
	function miscellaneousCleanup() {
		let $giftTypeRow;
		
		if ( $( '#ProcessForm' ).length ) {
			$( 'nav ul' ).addClass( 'transparent' );
		}
		
		$giftTypeRow = $( '#level_flexiblegift_type_Row' );
		if ( $giftTypeRow.length ) {
			$giftTypeRow.removeClass( 'field-required' );
			$giftTypeRow.find( 'legend' ).prepend( '<span class="field-required"></span>' );
		}
		
	}
	
	function miscellaneousSetup() {
		let $billingAddressState;
		querystringSetComments();
		
		// Add checkbox to control State field for international addresses
		// Move this to a new function if you ever add anything else to this miscellaneous function
		$billingAddressState = $( '#billing_addr_state' );
		if ( ! $billingAddressState.length ) {
			return;
		}
		
		$( '<div id="billing_addr_outside_us" class="form-row"><input type="checkbox" id="international-address">My credit card / billing address is outside the U.S. or Canada</div>' )
			.insertBefore( '#billing_addr_state_row' );
		$( '#international-address' ).on( 'change', function() {
			let $internationalAddress;
			$internationalAddress = $( this );
			console.log( 'changed to value', $internationalAddress.prop( 'checked' ) );
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

	function set( property, value ) {
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

	function setMonthlyOngoing() {
		$( () => {
			console.log( 'setting monthly ongoing' );
		} );
	}
	
	return {
		init : init,
		set : set,
		setDefault : setDefault,
	};

} )();


function GWDonationsUtilities( dependencies ) {
	let $;
	
	dependencies = dependencies || {};
	$ = dependencies.jQuery || jQuery;
	
	if ( $ === undefined ) {
		throw new Error( 'GWDonationsUtilities failed to find an instance of jQuery' );
	}
	
	function calculateDonationTotal() {
		let $donationLevelInputContainer;
		let $donationLevelRadios;
		let $donationLevelSelected;
		//let $donationLevelUserEntered;
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
		//$donationLevelUserEntered = $( '.donation-level-user-entered' ).children( 'input[type=text]' );
		
		giftTypeValue = $giftTypeRadios.filter( ':checked' ).val();
		giftDurationValue = $giftDurationDropdown.val();
		giftAmount = 0;
		giftAmountFrequency = '';
		giftAmountMultiplier = 1;
		
		$donationLevelSelected = $donationLevelRadios.filter( ':checked' );
		if ( $donationLevelSelected.length ) {
			$donationLevelInputContainer = $donationLevelSelected.parent( '.donation-level-label-input-container' );
			if ( $donationLevelInputContainer.siblings( '.donation-level-user-entered' ).length ) {
				giftAmount = parseFloat( 
						$donationLevelInputContainer.parent().find( 'input[type=text]' ).val()
							.replace( /[$]/gi, '' ) 
					) || 0;
			} else {
				giftAmount = parseFloat( $donationLevelInputContainer.siblings( 'label' ).find( '.donation-level-amount-container' ).text().replace( /[$,]/gi, '' ) );
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
		let formatted;
		formatted = GWUtilities.formatMoney( donationTotal.amount ) 
		          + ( donationTotal.frequency !== '' ? '/' + donationTotal.frequency : '' );
		return formatted;
	}
	
	function setDonation( donation ) {
		//let $giftTypeRadios;
		let $giftDurationDropdown;
		let $donationLevelAmountContainers;
		//let $donationLevelRadios;
		let $donationLevelUserEnteredRadio;
		let $donationLevelUserEnteredText;
		
		let donationLevelRadioFound;
		
		//$giftTypeRadios = $( 'input[name=level_flexiblegift_type]' );
		$giftDurationDropdown = $( '#level_flexibleduration' );
		//$donationLevelRadios = $( 'input[name=level_flexibleexpanded]' );
		$donationLevelUserEnteredText = $( '.donation-level-user-entered' ).children( 'input[type=text]' );
		$donationLevelUserEnteredRadio = $donationLevelUserEnteredText.closest( '.donation-level-input-container' ).find( 'input[type=radio]' );
		$donationLevelAmountContainers = $( '.donation-level-amount-container' );
		
		if ( !$donationLevelAmountContainers.length ) {
			return;
		}
		
		donationLevelRadioFound = false;
		$donationLevelAmountContainers.each( function() {
			let thisAmount = parseFloat( $( this ).text().trim().replace( /[$,]/g, '' ) );
			if ( donation.amount === thisAmount ) {
				donationLevelRadioFound = true;
			}
		} );

		if ( ! donationLevelRadioFound ) {
			$donationLevelUserEnteredRadio.prop( 'checked', true ).trigger( 'change' );
			$donationLevelUserEnteredText.val( donation.amount ).trigger( 'change' );
		}
		
		if ( donation.frequency === '' ) {
			return;
		}
		$( '#level_flexiblegift_type2' ).prop( 'checked', true ).trigger( 'change' );
		if ( donation.frequency === 'monthly' ) {
			$giftDurationDropdown.val( 'M:0' );
		}
		$giftDurationDropdown.trigger( 'change' );
		
	}
	
	return {
		calculateDonationTotal: calculateDonationTotal,
		formatDonationTotal: formatDonationTotal,
		setDonation: setDonation
	};
	
}

function SustainingFocus( dependencies, options ) {
	let $;
	
	dependencies = dependencies || {};
	$ = dependencies.jQuery || jQuery;
	
	options = options || {};
	options.buttonizeGiftType = options.buttonizeGiftType || false;
	
	if ( $ === undefined ) {
		throw new Error( 'GWDonations failed to find an instance of jQuery' );
	} else if ( !$.fn.on ) {
		throw new Error( 'GWDonations requires jQuery v1.7 or greater. Found v' + $.fn.jquery );
	}
	
	function attachHandlers() {
		let $giftTypeRadios;
		let $giftDurationRow;
		
		$giftTypeRadios = $( 'input[name=level_flexiblegift_type]' );
		$giftDurationRow = $( '#level_flexibleduration_row' );
		
		$giftTypeRadios
			/* 
			 * Ensure that the recurring options dropdown is hidden when the user selects
			 * one-time gift--no need for him/her to see that
			 */
			.on( 'change', function() {
				if ( $( this ).val() === '1' ) {
					// one-time gift
					$giftDurationRow.addClass( 'hidden' );
					/* 
					 * Luminate has this on the click action, so it doesn't always trigger.
					 * Honestly, maybe it makes more sense for it to be triggered on click,
					 * but there's no point, really, in doing this stuff if the radio button
					 * is already selected
					 */
					$( '#level_flexibleduration' ).prop( 'disabled', true );
				} else if ( $( this ).val() === '2' ) {
					$giftDurationRow.removeClass( 'hidden' );
					$( '#level_flexibleduration' ).prop( 'disabled', false );
				}
				if ( $( this ).prop( 'checked' ) === false ) {
					$( this ).parent().removeClass( 'selected' );
				} else {
					$( this ).parent().addClass( 'selected' )
						.siblings( '.designated-giving-recurring-row' ).removeClass( 'selected' );
				}
			} )
			.filter( ':checked' ).trigger( 'change' );
	}
	
	
	function buttonizeGiftType() {
		$( '.designated-giving-recurring-row' )
			.addClass( 'button' )
			.on( 'click', function( e ) {
				if ( $( e.target ).hasClass( 'designated-giving-recurring-row' ) ) {
					$( e.target ).find( 'input[type=radio]' ).prop( 'checked', true ).trigger( 'change' );
				}
			} );
	}
	
	function init() {
		let $flexibleDurationRow;
		let $flexibleGiftTypeRow;
		let $levelFlexibleRow;
		let $oneTimeGiftType;
		let $recurringGiftType;
		
		$flexibleGiftTypeRow = $( '#level_flexiblegift_type_Row' );
		if ( ! $flexibleGiftTypeRow.length ) {
			return;
		}
		$flexibleDurationRow = $( '#level_flexibleduration_row' );
		$levelFlexibleRow = $( '#level_flexible_row' );
		
		/* 
		 * Detach gift type and duration sections and place them at the top of #level_flexible_row
		 * i.e., above the donation levels
		 */
		$flexibleDurationRow.detach().prependTo( $levelFlexibleRow );
		$flexibleGiftTypeRow.detach().prependTo( $levelFlexibleRow );
		
		// Change order of the gift type options such that recurring appears first
		$recurringGiftType = $( '#level_flexiblegift_type2' ).parent();
		$oneTimeGiftType = $( '#level_flexiblegift_type1' ).parent();
		$recurringGiftType.detach().insertBefore( $oneTimeGiftType );
		if ( options.buttonizeGiftType ) {
			buttonizeGiftType();
		}
		
		attachHandlers();
	}
	
	return {
		init : init
	};
}

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

		// We have all required fields, so make a new docfrag for streamlined display
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

let GWDefaultSteppedSingleDesignee = ( function() {
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
	
	function goToStep( stepNum ) {
		let currentStep;
		let destinationStep;
		
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
		scrollTo( '#step-navigator' );
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
	
	function init( dependencies ) {
		if ( initialized ) {
			console.log( 'GWDefaultSteppedSingleDesignee has already been initialized' );
			return false;
		}
		if ( document.readyState !== 'interactive' && document.readyState !== 'complete' ) {
			console.log( 'GWDefaultSteppedSingleDesignee.init() called before DOM ready. Please call from DOM ready handler.' );
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
		boxUpSteps();
		attachHandlers();
		initialized = true;
		return true;
	}
	
	function boxUpSteps( options ) {
		let $designeeSections;
		let $billingInfoSections;
		let $giftDetailsSections;
		let $additionalSections;
		let $paymentInfoSections;
		let allStepsDocFrag;
		let i;
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
		$additionalSections = $( '#tribute_show_honor_fields_row' )
			.add( 'div[id^=tribute]' )
			.add( '.matching-gift-container' );
		$paymentInfoSections = $( '.payment-type-element-container, .button-container' );

		i = 1;
		steps.push( {
			items: $designeeSections,
			heading: 'Your Designee'
		} );
		steps.push( {
			items: $giftDetailsSections,
			heading: 'Gift Details'
		} );
		steps.push( {
			items: $billingInfoSections,
			heading: 'Billing Information'
		} );
		if ( $additionalSections.length ) {
			steps.push( {
				items: $additionalSections,
				heading: 'Additional Information'
			} );
		}
		steps.push( {
			items: $paymentInfoSections,
			heading: 'Credit Card Information'
		} );
		
		allStepsDocFrag = document.createDocumentFragment();
		stepNavigator = makeStepNavigator( steps );
		allStepsDocFrag.appendChild( stepNavigator );
		for ( i = 0; i < steps.length; i++ ) {
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
		goToStep( options.activeStep );
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
		let gwDonationsUtilities;
		
		gwDonationsUtilities = GWDonationsUtilities( { jQuery: $ } );
		donationTotal = gwDonationsUtilities.calculateDonationTotal();
		$( '#step-navigator-gift-details' ).text( gwDonationsUtilities.formatDonationTotal( donationTotal ) );
	}
	
	return {
		init: init
	};
} )();


( function( $ ) {
	try {
		GWDonations.init( { jQuery : $ } );
	} catch( error ) {
		console.log( error );
	}

	// on document load
	$( function() {
		let $selects;
		let sustainingFocus;
		
		
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
		
		try {
			sustainingFocus = new SustainingFocus( 
				{ jQuery: $ }, 
				{ buttonizeGiftType: true } );
			sustainingFocus.init();
		} catch ( error ) {
			console.log( error );
		}
	} );
	
} )( jQuery );


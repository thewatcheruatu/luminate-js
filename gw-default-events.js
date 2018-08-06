var GWDefaultEvents = ( function() {
	var $;
	var initialized;
	
	initialized = false;
	
	function attachHandlersToReplacements() {
		$( 'body' ).on( 'change', 'input', function() {
			if ( $( this ).hasClass( 'fake-input' ) ) {
				var original = $( this ).data( 'original' );
				$( '#' + original ).val( $( this ).val() );
			}
		});
	}
	
	function cleanup() {
		//Asynchronous -- this is just housekeeping stuff that can really happen at any time
		setTimeout( function() {
			GeneralWrapper.Shared.ensureFirstHeadingIsH1();
			cleanupRequiredQuestions();
			DOMUtilities.convertTag( $( '.lo-EventSubHeaderBar' ), 'h3' );
			$( 'table#lo-ticket_class_list_user' ).addClass( 'bordered' );
			$( 'a, span, strong' ).css( 'font-size', '' );
		}, 50 );
	}
	
	function cleanupRequiredQuestions() {
		var requiredFields = $( '.field-required' );
		requiredFields.each( function() {
			var inputLabel;
			var inputLabelHtml;
			if ( $( this ).find( '.aural-only' ).html() === '' ) {
				return;
			}
			inputLabel = $( this ).find( '.input-label' );
			if ( ! inputLabel.length ) {
				return;
			}
			inputLabelHtml = inputLabel.html();
			if ( inputLabelHtml.indexOf( '*' ) === -1 ) {
				inputLabel.html( '* ' + inputLabelHtml );
			}
			
		} );
	}
	
	function init( dependencies ) {
		dependencies = dependencies || {};
		
		$ = dependencies.jQuery || jQuery;
		
		if ( $ === undefined ) {
			throw new Error( 'GWDefaultEvents failed to find an instance of jQuery' );
		} else if ( !$.fn.on ) {
			throw new Error( 'GWDefaultEvents requires jQuery v1.7 or greater. Found v' + $.fn.jquery );
		}
		
		if ( initialized ) {
			console.log( 'GWDefaultEvents has already been initialized' );
			return false;
		}
		
		if ( ! $( '#events-wrapper' ).length ) {
			return false;
		}
		
		if ( $( 'div.appArea' ).length ) {
			$( '#main-content' ).html( '<h3 style="text-align: center;">Error: Please ensure you set<br>"Configure Additional Information" &gt; "Registration Page Layout"<br>to "Modern".</h3>' );
		}
		GWUtilities.loadStylesheet( '/gwu_wrpr/gw-default-events.css' );
		cleanup();
		reconfigureTicketsTable();
		replaceAttendeeInformation();
		attachHandlersToReplacements();
		initialized = true;
		return true;
	}
	
	function reconfigureTicketsTable() {
		var ticketsTable = $( '#lo-ticket_class_list_user' );
		var numColumns = ticketsTable.find( '.lc_Heading' ).length;
		ticketsTable.find( 'tr' ).each( function() {
			var ticketClassDetails = $( this ).find( 'a' );
			$( this ).addClass( 'ticket-cost' );
			if ( ! ticketClassDetails.length ) {
				return;
			}
			var ticketClassDetailsId = ticketClassDetails.attr( 'id' );
			var html = "<tr class='ticket-class'><td colspan='" + numColumns + "'>"
			         + "<a href='#' data-original='" + ticketClassDetailsId + "'>" 
			         + ticketClassDetails.html() + "</a></td></tr>";
			$( this ).before( html );
		});
		ticketsTable
			.addClass( 'reconfigured' )
			.on( 'click', '.ticket-class a', function( e ) {
				e.preventDefault();
				var originalId = $( this ).data( 'original' );
				$( '#' + originalId ).click();
			});
	}
	
	/*
	 * replaceAttendeeInformation
	 * Hides the non-mobile-responsive table layout for attendee information
	 * and replaces it with mock versions of the text fields within responsive divs.
	 */
	function replaceAttendeeInformation() {
		var attendeeContainer;
		var html;
		
		attendeeContainer = $( '#lo-attendeeContainer' );
		if ( ! attendeeContainer.length ) {
			attendeeContainer = $( '#event_attendee_information' );
			if ( ! attendeeContainer.length ) {
				return;
			}
		}
		html = '';
		
		/*
		 * I'm a little confused here. I believe that the existence of #first_name means
		 * that the form is already mobile response (i.e., no table layout),
		 * so we can just return out of the function at this point.
		 */
		if ( attendeeContainer.find( '#first_name' ).length ) {
			return;
		}
		attendeeContainer.find( 'input[type=text]' ).each( function() {
			var realId = $( this ).attr( 'name' );
			if ( realId === 'rsvp_num_guests' ) {
				return;
			}
			var fakeId = realId + '-replacement';
			var originalValue = $( this ).val();
			html += "<div class='text-input-replacement'><label class='required'>";
			if ( realId.indexOf( 'first_name' ) >= 0 ) {
				html += 'First Name ';
			} else if ( realId.indexOf( 'last_name' ) >= 0 ) {
				html += 'Last Name ';
			} else if ( realId.indexOf( 'cons_email' ) >= 0 ) {
				html += 'Email ';
			}
			html += '</label><input type="text" id="' + fakeId + '" class="fake-input" data-original="' + realId + '" '
			      + 'size="' + $( this ).attr( 'size' ) + '" value="' + originalValue + '"'
				  + 'maxlength="' + $( this ).attr( 'maxlength' ) + '"></div>';
		});
		var errorMessages = '';
		var errorMessagesString = '';
		attendeeContainer.find( '.ErrorMessage' ).each( function() {
			if ( $( this ).text() === '*' ) {
				return;
			}
			var messages = $( this ).html().split( '<br>' );
			for ( var i = 0; i < messages.length; i++ ) {
				if ( messages[i].search( /\w/ ) >= 0 ) {
					errorMessages += "<p class='ErrorMessage'>" + messages[i] + "</p>";
				}
			}
		});
		
		var attendeeSectionHeading = attendeeContainer.find( '#lo-attendeeInfoTitle, .lo-EventSubHeaderBar' ).first();
		attendeeSectionHeading
		.after( html )
		.after( errorMessages );
		
		attendeeContainer.find( 'table' ).addClass( 'hidden' );
	}
	
	return {
		init : init
	}
} )();
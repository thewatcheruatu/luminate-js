'use strict';
/*
 * GWDesigneeSearch requires GWFormDesignees, which is just a custom
 * framework layer on top of Luminate Extend. Pass it in as a dependency.
 */

const GWDesigneeSearch = ( function() {
	let $;
	let apiConfig;
	let designationTypes = []; // From API
	let designees = []; // From API
	let donationFormId;
	let initialized = false;
	let GWFormDesignees;

	function init( dependencies, selectors ) {
		if ( initialized ) {
			console.log( 'GWDesigneeSearch has already been initialized.' );
			return this;
		}
		dependencies = dependencies || {};
		GWFormDesignees = dependencies.GWFormDesignees;
		$ = dependencies.jQuery || jQuery;
		
		if ( ! GWFormDesignees ) {
			console.log( 'GWFormDesignees is a required dependency.' );
			return false;
		}

		if ( ! $ || ! $.fn.on ) {
			console.log( 'jQuery version 1.7 or greater is a required dependency.' );
			return false;
		}

		_init();
		initialized = true;
		
		return this;

		function _init( donationFormId ) {
			// luminateExtend must have already been configured
			let foundDesignees = false;
			GWFormDesignees.getDesignees()
				.then( () => {
					foundDesignees = true;
					return GWFormDesignees.getDesignationTypes();
				} )
				.then( () => {
					if ( ! foundDesignees ) {
						return;
					}
					if ( selectors ) {
						attach( selectors );
					}
				} )
				.catch( ( _error ) => {
					console.log( _error );
				} );
		}
	}

	function attach( selectors ) {
		selectors = selectors || {
			searchBox : '#designee-search-box',
			searchSubmit : '#designee-search-submit',
			searchResults : '#designee-search-results',
		};

		attachSearchHandler( selectors, { autoSearch : true } );
	}

/* Begin: attachSearchHandler() */
	function attachSearchHandler( selectors, options ) {
		options = options || {};

		const $searchBox = $( selectors.searchBox );
		const $searchSubmit = $( selectors.searchSubmit );
		const $searchResults = $( selectors.searchResults );

		$searchSubmit.on( 'click', designeeSearchSubmit );

		if ( options.autoSearch === true ) {
			$searchBox.on( 'input', function( e ) {
				if ( $searchBox.val().trim().length >= 3 ) {
					return designeeSearchSubmit( e );
				}

				e.preventDefault();

				$searchResults.html( '' );
			} );
		}

		function designeeSearchSubmit( e ) {
			e.preventDefault();
			const designeeName = $searchBox.val().trim();
			const matchingIndexes = GWFormDesignees
				.findMatchingDesigneeIndexes( designeeName );
			const matchingDesigneesHtml = [];
			const dfId = GWUtilities.queryString.get( 'df_id' );
			GWFormDesignees.getDesignees()
				.then( ( designees ) => {
					for ( let i = 0; i < matchingIndexes.length; i++ ) {
						const thisIndex = matchingIndexes[i];
						matchingDesigneesHtml.push( makeDesigneeListItem( designees[thisIndex] ) );
					}

					$searchResults.html( 
						'<ul class="designee-search-results">' + 
						matchingDesigneesHtml.join( '\n' ) +
						'</ul>' 
					);

					/* Bonus results */
					const matchingTypes = GWFormDesignees
						.findMatchingDesignationTypes( designeeName );
					const matchingDesigneesFromTypes = [];
					for ( let i = 0; i < designees.length; i++ ) {
						if ( matchingTypes.indexOf( designees[i].typeId ) >= 0 ) {
							if ( matchingIndexes.indexOf( i ) === -1 ) {
								matchingDesigneesFromTypes.push(
									makeDesigneeListItem( designees[i] )
								);
							}
						}
					}

					$( '.designee-search-results' ).append( 
						matchingDesigneesFromTypes.join( '\n' )
					);

					if ( ! $( '.designee-search-results' ).children().length ) {
						$searchResults.html( 
							'<p id="no-designee-search-results">No results.</p>' );
					}
				} )

			function makeDesigneeListItem( designee ) {
				const designeeUrl = 'Donation2?df_id=' + dfId + '&' + dfId + 
					'.donation=form1' + '&set.SingleDesignee=' + designee.id;

				return '<li class="designee-search-result"><a href="' +
					designeeUrl + '" data-designee-id="' + designee.id + '">' + 
					designee.name + '</a></li>';
			}
		}
	}
/* End: attachSearchHandler() */

	return {
		attach : attach,
		init : init,
	}
} )();

/*
 * This script has Luminate Extend as a dependency
 * You can pass it in through the init function.
 */

const GWDesigneeSearch = ( function() {
	let $;
	let apiConfig;
	let designationTypes = []; // From API
	let designees = []; // From API
	let donationFormId;
	let initialized = false;
	let luminateExtend;

	function init( dependencies, config, selectors ) {
		dependencies = dependencies || {};
		config = config || {};
		luminateExtend = dependencies.luminateExtend;
		apiConfig = config.apiConfig;
		donationFormId = config.donationFormId;
		$ = dependencies.jQuery || jQuery;
		
		if ( ! luminateExtend ) {
			console.log( 'luminateExtend is a required dependency.' );
			return false;
		}

		if ( ! $ || ! $.fn.on ) {
			console.log( 'jQuery version 1.7 or greater is a required dependency.' );
			return false;
		}

		/*
			apiConfigExample = {
				apiKey : '[key]',
				path : {
					nonsecure : 'http://...',
					secure : 'https://...',
				},
			}
		*/

		if ( ! apiConfig ) {
			console.log( 'apiConfig is a required parameter.' );
			return false;
		}

		if ( ! donationFormId ) {
			console.log( 'donationFormId is a required parameter.' );
		}

		luminateExtend( apiConfig );
		searchThingy( donationFormId );

		function searchThingy( donationFormId ) {
			// luminateExtend must have already been configured
			getDesignees()
				.then( () => {
					return getDesignationTypes();
				} )
				.then( () => {
					if ( ! designees.length ) {
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
			const matchingIndexes = findMatchingDesigneeIndexes( designeeName, designees );
			const matchingDesigneesHtml = [];
			const dfId = GWUtilities.queryString.get( 'df_id' );
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
			const matchingTypes = findMatchingDesignationTypes( 
				designeeName, 
				designationTypes );
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

	function findMatchingDesigneeIndexes( designeeName, designees ) {
		designeeName = designeeName.toLowerCase();
		const matchingIndexes = [];
		for ( let i = 0; i < designees.length; i++ ) {
			const lcDesigneeName = designees[i].name.toLowerCase();
			const lcDesigneeText = typeof designees[i].description.text === 'string' ? 
				designees[i].description.text.toLowerCase() :
				'';

			if ( lcDesigneeName.indexOf( designeeName ) >= 0 ) {
				matchingIndexes.push( i );
			} else if ( lcDesigneeText.indexOf( designeeName ) >= 0 ) {
				matchingIndexes.push( i );
			}
		}
		
		return matchingIndexes;
	}

	function findMatchingDesignationTypes( designeeName, designationTypes ) {
		designeeName = designeeName.toLowerCase();
		const matchingTypes = [];
		for ( let i = 0; i < designationTypes.length; i++ ) {
			const desTypeName = designationTypes[i].name.toLowerCase();
			if ( desTypeName.indexOf( designeeName ) >= 0 ) {
				matchingTypes.push( designationTypes[i].id );
			}
		}

		return matchingTypes;
	}

	function getDesignees() {
		return new Promise( ( resolve, reject ) => {
			if ( designees.length ) {
				return resolve( designees );
			}

			luminateExtend.api( {
				api: 'donation', 
				data: 'method=getDesignees&form_id='+ donationFormId, 
				callback: {
					error: function(data) {
						reject( data.errorResponse );
					},
					success: function( data ) {
						// designees is global to GWDesigneeSearch closure
						designees = luminateExtend.utils.ensureArray( data.getDesigneesResponse.designee );
						designees.sort( function( a, b ){
							var aName = a.name.toLowerCase();
							var bName = b.name.toLowerCase();
							// Don't think these particularly need to be sorted within types
							//if (a.typeId != b.typeId) return parseInt(a.typeId) - parseInt(b.typeId);
							if ( aName < bName ) return -1;
							if ( aName > bName ) return 1;
							return 0;
						} );

						resolve( designees );
					}
				}
			} );
		} );
	}

	function getDesignationTypes() {
		return new Promise( ( resolve, reject ) => {
			if ( designationTypes.length ) {
				return resolve( designationTypes );
			}

			luminateExtend.api( {
				api : 'donation',
				data : 'method=getDesignationTypes&form_id=' + donationFormId,
				callback : {
					error : ( data ) => {
						reject( data.errorResponse );
					},
					success : ( data ) => {
						// designationTypes is global to GWDesigneeSearch closure
						designationTypes = luminateExtend.utils.ensureArray( data.getDesignationTypesResponse.type );
						if ( designationTypes.length ) {
							return resolve( designationTypes );
						} else {
							reject( new Error( 'No designation types retrieved' ) );
						}
					}
				},
			} );
		} );
	}


	return {
		attach : attach,
		getDesignees : getDesignees,
		getDesignationTypes : getDesignationTypes,
		init : init,
	}
} )();

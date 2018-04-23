/* 
 * Obviously, this requires including the luminateExtend script, though
 * that will get passed into the init function as a dependency. 
/*
	apiConfigExample = {
		apiKey : '[key]',
		path : {
			nonsecure : 'http://...',
			secure : 'https://...',
		},
	}
*/

const GWFormDesignees = ( () => {
	let apiConfig;
	let designationTypes = []; // From API
	let designees = []; // From API
	let donationFormId;
	let initialized = false;
	let luminateExtend;

	function init( dependencies, config, selectors ) {
		if ( initialized ) {
			console.log( 'GWFormDesignees has already been initialized.' );
			return this;
		}

		dependencies = dependencies || {};
		config = config || {};
		luminateExtend = dependencies.luminateExtend;
		apiConfig = config.apiConfig;
		donationFormId = config.donationFormId;
		
		if ( ! luminateExtend ) {
			console.log( 'luminateExtend is a required dependency.' );
			return false;
		}

		if ( ! apiConfig ) {
			console.log( 'apiConfig is a required parameter.' );
			return false;
		}

		if ( ! donationFormId ) {
			console.log( 'donationFormId is a required parameter.' );
		}

		luminateExtend( apiConfig );
		initialized = true;

		return this;
	}


	function findMatchingDesigneeIndexes( designeeName ) {
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

	function findMatchingDesignationTypes( designeeName ) {
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

	function getDesignees( designeeIds ) {
		// designeeIds is optional
		designeeIds = designeeIds || [];
		return new Promise( ( resolve, reject ) => {
			if ( designees.length ) {
				return resolve( getFiltered( designeeIds ) );
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

						resolve( getFiltered( designeeIds ) );
					}
				}
			} );
		} );

		function getFiltered( designeeIds ) {
			let filteredDesignees = [];
			if ( designeeIds.length === 0 ) {
				return designees;
			}

			for ( let i = 0; i < designees.length; i++ ) {
				if ( designeeIds.indexOf( parseInt( designees[i].id, 10 ) ) >= 0 ) {
					filteredDesignees.push( designees[i] );
				}
			}

			return filteredDesignees;
		}
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
		findMatchingDesigneeIndexes : findMatchingDesigneeIndexes,
		findMatchingDesignationTypes : findMatchingDesignationTypes,
		getDesignees : getDesignees,
		getDesignationTypes : getDesignationTypes,
		init : init,
	}
} )();

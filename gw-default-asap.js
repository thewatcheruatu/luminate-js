/*
 * Assume jQuery is not available
 */
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj, start) {
         for (var i = (start || 0), j = this.length; i < j; i++) {
             if (this[i] === obj) { return i; }
         }
         return -1;
    }
}
( function() {
	'use strict';
	var docHead;
	var docStyles;
	var i;
	var thisLink;
	var sheetName;
	var purgeList = [
		'default.css',
		'CalendarEvent.css',
		'ConsProfile.css',
		'DirectoryStyle.css',
		'DonFormResponsive.css',
		'EventResponsive.css',
		'DonationFormV2.css',
		'ResponsiveBase.css',
		'UserGlobalStyle.css',
		'CustomStyle.css',
		'CustomWysiwygStyle.css',
		'V2Base.css'
	];	
	
	docHead = document.getElementsByTagName( 'head' );
	if ( ! docHead.length ) {
		return;
	}
	docStyles = docHead[0].getElementsByTagName( 'link' );
	for ( i = docStyles.length -1; i >= 0; i-- ) {
		thisLink = docStyles[i];
		sheetName = thisLink.href.substr( thisLink.href.lastIndexOf( '/' ) ).replace( '/', '' );
		if ( sheetName === 'ConsProfile.css' || sheetName === 'DirectoryStyle.css' ) {
			document.getElementsByTagName( 'body' )[0].classList.add( 'cons-profile' );
		}
		if ( sheetName === 'DirectoryStyle.css' ) {
			document.getElementsByTagName( 'body' )[0].classList.add( 'directory' );
		}
		if ( thisLink.rel == 'stylesheet' && purgeList.indexOf( sheetName ) >= 0 ) {
			thisLink.parentNode.removeChild( thisLink );
		}
	}
} )();
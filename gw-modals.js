'use strict';

var GWModals = ( function() {
	var $;
	var initialized;
	var numModalsCreated;
	
	initialized = false;
	numModalsCreated = 0;
	
	function init( dependencies ) {
		var jQueryVersion;
		
		dependencies = dependencies || {};
		
		$ = dependencies.jQuery || jQuery;
		
		if ( $ === undefined ) {
			throw new Error( 'GWModals failed to find an instance of jQuery' );
		} else if ( !$.fn.on ) {
			throw new Error( 'GWModals requires jQuery v1.7 or greater. Found v' + $.fn.jquery );
		}
		initialized = true;
	};
	
	
	function attachEventHandlers() {
		$( 'body' ).on( 'keydown', function( e ) {
			if ( e.keyDown === 27 ) {
				closeModalMasterContainer();
			}
		} );
		$( '#modal-master-container' )
			.on( 'click', '.close-modal', function( e ) {
				closeModalMasterContainer();
			} )
			.on( 'click', '.modal-window', function( e ) {
				e.stopImmediatePropagation();
			} )
			.on( 'click', function() {
				closeModalMasterContainer();
			} );
	}
	
	function closeModalMasterContainer() {
		$( 'body' ).removeClass( 'modal-open' );
	}
	
	/*
	 * params:
	 * - id (optional, but really should be sent)
	 * - html (optional--I guess you might want to dynamically add content later)
	 */
	function createModal( params ) {
		var id;
		var htmlString;
		if ( params.id && $( '#' + params.id ).length ) {
			console.log( 'Cannot open modal window with duplicate id: ' + params.id );
		}
		if ( ! ensureModalContainerExists() ) {
			return false;
		}
		id = void( 0 ) === params.id ? 'gwu-modal-' + numModalsCreated : params.id;
		htmlString = '<div id="' + id + '" class="modal-window hidden"><span class="close-modal"></span><div class="modal-content">' + params.htmlString + '</div></div>';
		$( '#modal-master-container' ).append( htmlString );
		numModalsCreated++;
		return true;
	}
	
	function createModalFromDivWithId( id ) {
		var $content;
		var contentHtml;
		
		$content = $( '#' + id );
		if ( ! $content.length || $content.length > 1 ) {
			return false;
		}
		if ( ! ensureModalContainerExists() ) {
			return false;
		}
		contentHtml = $content.html();
		$content
			.addClass( 'modal-window' )
			.addClass( 'hidden' )
			.html( '<div class="modal-content">' + contentHtml + '</div>' )
			.prepend( '<span class="close-modal"></span>' )
			.detach()
			.appendTo( '#modal-master-container' );
		numModalsCreated++;
		return true;
	}
	
	function ensureModalContainerExists() {
		if ( ! initialized ) {
			console.log( 'GWModals was never initialized!' );
			return false;
		}
		if ( ! $( '#modal-master-container' ).length ) {
			initEnvironment();
		}
		return true;
	}
	
	function updateModalHtml( id, htmlString ) {
		return $( '#' + id ).find( '.modal-content' ).html( html );
	}
	
	/* Going to make this lazy--will get called when first attempting to create a modal window */
	function initEnvironment() {
		$( 'body' ).append( '<div id="modal-master-container"></div>' );
		$( '<link>' )
			.attr( 'id', 'gw-modal-css' )
			.attr( 'type', 'text/css' )
			.attr( 'rel', 'stylesheet' )
			.attr( 'href', '../css/gwu_wrpr/gw-modal.css' )
			.appendTo( 'head' );
		attachEventHandlers();
	}
	
	function showModal( id ) {
		var modalWindow = $( '#' + id );
		if ( ! modalWindow.length ) {
			return;
		}
		$( '.modal-window' ).addClass( 'hidden' );
		$( 'body' ).addClass( 'modal-open' );
		modalWindow.removeClass( 'hidden' );
	};	
	
	return {
		create: createModal,
		createFromDiv: createModalFromDivWithId,
		hide: closeModalMasterContainer,
		html: updateModalHtml,
		init: init,
		show: showModal
	};
	
} )();
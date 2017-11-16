(function(gwuWrapper, $, undefined) {
	gwuWrapper.initialized = false;
	
	gwuWrapper.settings = {
		hideNavBar: false,
		themeName: 'default'
	};
	
	gwuWrapper.appendPageBottomNavBar = function( html ) {
		$( 'footer' ).before( '<div class="page-bottom-nav-bar">' + html + '</div>' );
	};
	
	gwuWrapper.finalize = function() {
		$('body').addClass('wrapper-finalized');
	};
	
	gwuWrapper.init = function() {
		if (gwuWrapper.initialized) { return; }
		/*
		 * Mostly just concerned with hiding the initial flicker that results from purging all the Luminate styles.
		 * square-one.css sets the default opactiy of the body element to 0
		*/
		setTimeout( function() {
			$( 'body' ).fadeTo( 0, 1 );
		}, 300 );
		gwuWrapper.themes.getTheme();
		gwuWrapper.universal.init();
		gwuWrapper.campaign.init();
		gwuWrapper.themes.setTheme(gwuWrapper.settings.themeName);
		
		$.fn.insertSocialSharingLink = function() {
			var url = encodeURIComponent($(this).attr('href'));
			var message = $('<textarea>').html($(this).html()).text();
			message = encodeURIComponent(message);
			var platform;
			var href;
			var src;
			if ($(this).hasClass('twitter')) {
				platform = "Twitter";
				href = "https://twitter.com/intent/tweet?text=" + message + "&url=" + url;
				src = "../images/gwu_wrpr/icons/icon-twitter-flat-72.png";
			} else if ($(this).hasClass('facebook')) {
				platform = "Facebook";

				href = "https://www.facebook.com/sharer/sharer.php?u=" + url;
				src = "../images/gwu_wrpr/icons/icon-facebook-flat-72.png";	
			} else if ($(this).hasClass('google-plus')) {
				platform = "Google Plus";
				href = "https://plus.google.com/share?url=" + url;
				src = "../images/gwu_wrpr/icons/icon-google-plus-flat-72.png";	;
			}
			$(this).attr('href', href);
			$(this).html("<img src='" + src + "' alt='" + platform + " logo'>");
			
		};
		
		$('.social-sharing-links a').each(function() {
			if ($(this).children('img').length) { 
				return;
			}
			$(this).insertSocialSharingLink();
		});
	
		gwuWrapper.initialized = true;
	};
	
	gwuWrapper.campaign = {};
	gwuWrapper.campaign.init = function() {
		gwuWrapper.utilities.purgeExternalStyles();
		gwuWrapper.utilities.attachBodyStyleLinksToHead();
		gwuWrapper.utilities.attachCustomInPageStylesToHead();
		gwuWrapper.utilities.purgeInBodyStyles();
		
		/* Ensure link row attaches to top of browser when scrolled */
		$(window).on('scroll resize', function() {
			if ( $('#nav-bar').length && !$('#nav-bar').hasClass('hidden') && $(window).scrollTop() > $('header').offset().top + $('header').outerHeight()) {
				$('body').addClass('fixed-navbar');
				$('#main-content').css('margin-top', $('#nav-bar').outerHeight() + 'px');
			} else {
				$('body').removeClass('fixed-navbar');
				$('#main-content').css('margin-top', '0');
			}
		});
	};
	
	gwuWrapper.themes = {};
	gwuWrapper.themes.getTheme = function() {
		var headTitle = $('head title').text().toLowerCase();
		if ( headTitle.indexOf( 'birthday' ) != -1 ) {
			gwuWrapper.settings.themeName = 'gw birthday';
			gwuWrapper.settings.hideNavBar = true;
		} else if ( headTitle.indexOf( 'blue fund challenge' ) != -1 ) {
			gwuWrapper.settings.themeName = 'bbf';
			gwuWrapper.settings.hideNavBar = true;
		} else if ( headTitle.indexOf( 'career access network' ) !== -1 ) {
			gwuWrapper.settings.themeName = 'career access network';
			gwuWrapper.settings.hideNavBar = true;
		} else if ( headTitle.indexOf( 'elliott school' ) !== -1 ) {
			gwuWrapper.settings.themeName = 'esia';
			gwuWrapper.settings.hideNavBar = true;
		} else if (headTitle.indexOf('giving tuesday') != -1) {
			gwuWrapper.settings.themeName = 'giving tuesday';
			gwuWrapper.settings.hideNavBar = true;
		} else if (headTitle.indexOf('give the gift of education') != -1) {
			gwuWrapper.settings.hideNavBar = true;
		} else if (headTitle.indexOf('gw museum') != -1) {
			gwuWrapper.settings.themeName = 'gw museum';
			gwuWrapper.settings.hideNavBar = true;
		} else if ( headTitle.indexOf( 'june 2016' ) !== -1 ) {
			gwuWrapper.settings.themeName = 'june 2016';
			gwuWrapper.settings.hideNavBar = true;
		} else if (headTitle.indexOf('myers award') != -1) {
			gwuWrapper.settings.themeName = 'myers award';
		} else if (headTitle.indexOf('payroll deduction form') != -1) {
			gwuWrapper.settings.themeName = 'payroll deduction';
		} else if (headTitle.indexOf('rally the troops') != -1) {
			gwuWrapper.settings.themeName = 'rally';
		} else if ( headTitle.indexOf( 'red/blue challenge' ) != -1 ) {
			gwuWrapper.settings.themeName = 'red/blue challenge';
			gwuWrapper.settings.hideNavBar = true;
		} else if (headTitle.indexOf('gw libraries') != -1) {
			gwuWrapper.settings.hideNavBar = true;
			gwuWrapper.settings.themeName = 'libraries';
		} else if (headTitle.indexOf('gw athletics - raise high') != -1) {
			gwuWrapper.settings.themeName = 'athletics';
		} else if ( headTitle.indexOf( 'crowdfunding' ) != -1) {
			gwuWrapper.settings.themeName = 'crowdfunding';
			gwuWrapper.settings.hideNavBar = true;
		} else if ( headTitle.indexOf( 'vascular institute' ) !== -1 ) {
			gwuWrapper.settings.themeName = 'vascular institute';
			gwuWrapper.settings.hideNavBar = true;
		} else if ( headTitle.indexOf( 'senior class' ) !== -1 ) {
			gwuWrapper.settings.themeName = 'senior class gift';
			gwuWrapper.settings.hideNavBar = true;
		} else if ( headTitle.indexOf( 'reunion challenge' ) !== -1 ) {
			gwuWrapper.settings.themeName = 'alumni weekend';
			gwuWrapper.settings.hideNavBar = true;
		} else if ( headTitle.indexOf( 'support gw students' ) !== -1 ) {
			gwuWrapper.settings.themeName = 'dsa';
			gwuWrapper.settings.hideNavBar = true;
		}
	};
	
	gwuWrapper.themes.setTheme = function(themeName) {
		/*
		$( '#secondary-logo-link' )
			.attr( 'href', 'https://secure2.convio.net/gwu/site/Donation2?df_id=3141&3141.donation=landing' )
			.find( '#secondary-logo' ).attr( 'src', '../images/gwu_wrpr/logos/gt-2016-no-gw.png' );
			*/
			
		//$( 'header' ).before( '<header style="border-bottom: .2em solid #fff;"><div class="full-width-wrapper" style="padding: .5em 0;"><a href="https://secure2.convio.net/gwu/site/Donation2?df_id=3141&amp;3141.donation=landing" style="display: block; height: 2.5em; text-align: center;"><img src="../images/gwu_wrpr/logos/gt-2016-no-gw.png" style="height: 100%; width: auto;"></a></div></header>' );
		
		switch(themeName) {
			case 'alumni weekend':
				$('#logo-making-history-link').css('float', 'right').addClass('non-primary');
				$('#secondary-logo-link').attr('href', 'http://alumniweekend.gwu.edu').removeClass('non-primary');
				$('#secondary-logo').attr('src', '../images/gwu_wrpr/logos/alumni-weekend-2016-mono-reverse.png').attr('alt', 'Alumni Weekend 2016');
				break;
			case 'athletics':
				$('<link>').appendTo('head').attr({type : 'text/css', rel : 'stylesheet'}).attr('href', '../css/gwu_wrpr/athletics.css');
				$('<link>').appendTo('head').attr({type : 'text/css', rel : 'stylesheet'}).attr('href', '../css/gwu_wrpr/recurring-callout.css');
				$.getScript('../js/gwu_wrpr/recurring-callout.js');
				$('header, #nav-bar').addClass('hidden');
				$.getScript('../js/gwu_wrpr/unrestricted-replacement.js');
				$( 'header' ).last().after('<div id="athletics-luminate-header"><div id="athletics-luminate-header-main-wrapper-left"><div id="athletics-luminate-header-main-wrapper-right"><div id="athletics-luminate-header-main"><div id="champions-container"><img src="../images/gwu_wrpr/athletics/champions.png" alt="Champions"></div><div id="raise-high-container"><a href="http://www.gwsports.com/raisehigh"><img src="../images/gwu_wrpr/athletics/raise-high.png" alt="Raise High"></a></div><div id="athletics-main-logo-container"><a href="http://www.gwsports.com/"><img src="../images/gwu_wrpr/athletics/gw-athletics-logo.png" alt="GW Athletics"></a></div></div></div></div></div>');
				break;
			case 'bbf':
				$.getScript('../js/gwu_wrpr/unrestricted-replacement.js');
				$('#secondary-logo-link').attr('href', 'http://buffandbluefund.com/').css( 'float', 'right' );
				$('#secondary-logo').attr('src', '../images/gwu_wrpr/logos/bbf-challenge.png').attr('alt', 'Buff & Blue Fund');
				$('<link>').appendTo('head').attr({type : 'text/css', rel : 'stylesheet'}).attr('href', '../css/gwu_wrpr/recurring-callout.css');
				$.getScript('../js/gwu_wrpr/recurring-callout.js');
				break;
			case 'career access network':
				$.getScript( '../js/gwu_wrpr/unrestricted-replacement.js' );
				break;
			case 'crowdfunding':
				gwuWrapper.utilities.attachGoogleFontToHead( 'Open Sans Condensed', [300, 700] );
				gwuWrapper.utilities.attachGoogleFontToHead( 'Oswald' );
				gwuWrapper.utilities.attachExternalStylesheetToHead( '../css/gwu_wrpr/crowdfunding-legacy.css' );
				if ( $( 'head title' ).text().indexOf( 'Hillel' ) === -1 ) {
					$( '#logo-making-history-link' ).attr( 'href', 'http://go.gwu.edu/crowdfunding' ).find( 'img' ).attr( 'src', '../images/gwu_wrpr/logos/colonial-crowdfunding-reverse.png' );
					gwuWrapper.appendPageBottomNavBar( "<ul><li><a href='https://orgsync.com/login/george-washington-university?redirect_to=%2F101123%2Fnews_posts%2F199772'>Apply</a></li><li><a href='http://connect.gwu.edu/site/PageNavigator/colonial_crowdfunding_faqs.html'>FAQs</a></li><li><a href='https://secure2.convio.net/gwu/site/SPageNavigator/colonial_crowdfunding_past_projects.html'>Past Projects</a></li></ul>" );
				}
				$.getScript('../js/gwu_wrpr/crowdfunding-legacy.min.js');
				break; 
			case 'dsa' :
				if ( $( '#single_designee_unrestricted' ).length ) {
					$( '.unrestricted-option' ).addClass( 'hidden' );
					$( '#single_designee_designated' )
						.prop( 'checked', true )
						.trigger( 'change' );
					$( 'form' ).on( 'submit', function( e ) {
						if ( $( '#single_designee_unrestricted' ).prop( 'checked' ) ) {
							e.preventDefault();
							alert( 'Please ensure you have chosen a designee for your gift.' );
						}
						
					} );
					$.getScript('../js/gwu_wrpr/recurring-callout.js');
					$('<link>').appendTo('head').attr({type : 'text/css', rel : 'stylesheet'}).attr('href', '../css/gwu_wrpr/recurring-callout.css');		
				}
				break;
			case 'esia':
				$('#logo-making-history-link')
					.attr('href', 'http://esia.gwu.edu/')
					.children('img').attr('src', '../images/gwu_wrpr/logos/gw-monogram-esia.png').attr('alt', 'Elliott School of International Affairs');
				$('<link>').appendTo('head').attr({type : 'text/css', rel : 'stylesheet'}).attr('href', '../css/gwu_wrpr/recurring-callout.css');
				$.getScript('../js/gwu_wrpr/recurring-callout.js');
				if ( $( 'title' ).text().toLowerCase().indexOf( 'elliott school - make a difference' ) >= 0 ) {
					$.getScript( '../js/gwu_wrpr/unrestricted-replacement.js' );
				}
				break;
			case 'giving tuesday':
				$.getScript('../js/gwu_wrpr/giving-tuesday-scripts.js');
				break;
			case 'gw birthday' :
				$( '<link>' )
					.attr( 'href', '../css/gwu_wrpr/gw-birthday.css' )
					.attr( 'type', 'text/css' )
					.attr( 'rel', 'stylesheet' )
					.appendTo( 'head' );
				var headerHtml = "<div id='gw-birthday-284-header'><div></div><div>George's <span>284<sup>th</sup></span> Birthday</div><div></div></div>";
				$( '#header-wrapper' ).html( headerHtml );
				
				var footerHtml = "<a href='http://www.gwu.edu/' class='gwu'><img src='../images/gwu_wrpr/logos/gw_txt_2cs_rev_90px.png' alt='The George Washington University'></a>"
				               + "<a href='http://campaign.gwu.edu/' class='making-history'><img src='../images/gwu_wrpr/logos/making-history-white-reverse-154x90.png' "
							   + "alt='Making History: The Campaign for GW'></a>";
				$( '#footer-wrapper' ).html( footerHtml );
				break;
			case 'gw museum':
				$('#logo-making-history-link').attr('href', 'http://museum.gwu.edu/')
				.children('img').attr('src', '../images/gwu_wrpr/logos/museums.png').attr('alt', 'GW Museums');
				break;
			case 'june 2016' :
				$( '#secondary-logo-link' )
					.attr( 'href', 'https://secure2.convio.net/gwu/site/Donation2?df_id=3141&3141.donation=landing' )
					.find( '#secondary-logo' ).attr( 'src', '../images/gwu_wrpr/logos/gt-2016-no-gw.png' );
				$.getScript( '../js/gwu_wrpr/sustaining-focus.js' );
				$( '<link>' )
					.appendTo( 'head' )
					.attr( {type : 'text/css', rel : 'stylesheet'} )
					.attr( 'href', '../css/gwu_wrpr/recurring-callout.css' );
				$.getScript('../js/gwu_wrpr/recurring-callout.js');
				$( 'footer' ).first()
					.before( '<div style="background-color: #004065; text-align: center;"><img src="../images/donation_forms/misc/dc-monuments-398x150.jpg" alt="DC Monuments"></div>' );
				break;
			case 'libraries':
				//$('#nav-bar').addClass('hidden').after('<div id="libraries-secondary-header" style="padding: .5em 0;"><a href="http://library.gwu.edu" style="display: block; text-align: center;"><img src="../images/gwu_wrpr/libraries/imagebar_960_v5_1.png" alt="GWU Libraries" title="GWU Libraries" style="max-width: 960px; width: 100%;"></a></div>');
				$( '#logo-making-history-link' ).attr( 'href', 'https://lai.gwu.edu/' );
				$( '#logo-making-history' ).attr( 'src', '../images/gwu_wrpr/logos/gw-libraries-academic-innovation-2c-rev.png' );
				$.getScript('../js/gwu_wrpr/unrestricted-replacement.js');
				break;
			case 'mssc':
				$('header, footer, h2').css('background-color', '#e31937');
				$('#nav-bar').css('background-color', '#ffc82e');
				$('h1').css('color', '#e31937');
				break;
			case 'myers award':
				$('#logo-making-history-link').attr('href', 'http://museum.gwu.edu/')
				.children('img').attr('src', '../images/gwu_wrpr/logos/museums.png').attr('alt', 'GW Museums');
				$('#nav-bar').addClass('hidden').after("<div id='myers-award-banner' style='background: url(../images/donation_forms/myers-award/2017-background.jpg) no-repeat center center; background-size: cover; border-top: 2px solid #ffffff; height: 80px;'>&nbsp;</div>");
				console.log( 'added 2017 background' );
				break;
			case 'payroll deduction':
				$('head').append("<link href='../css/gwu_wrpr/payroll-deduction-style.css' rel='stylesheet' type='text/css'>");
				$.getScript('../js/gwu_wrpr/payroll-deduction-scripts.js');
				break;
			case 'rally':
				$('#nav-bar').after("<div id='rally-the-troops-banner' style='background: #01385e url(../images/donation_forms/flag-day/rally-the-troops-banner.png) no-repeat center center; background-size: contain; border-top: 2px solid #ffffff; height: 60px;'>&nbsp;</div>");
				break;
			case 'red/blue challenge':
				$( '#header-wrapper' ).css( 'text-align', 'center' ).html( "<a href='http://gspm.gwu.edu/'><img src='../images/gwu_wrpr/logos/gspm-chal-h.png' alt='GSPM' style='display: block; margin: 0 auto; max-height: 100%; max-width: 100%; width: auto;'></a>" );
				$( 'header' ).css( 'background-color', '#ffffff' );
				$( '#footer-wrapper' ).html( "<img src='../images/content/pagebuilder/gspm-chal-f2.png' alt='Red/Blue Challenge divider' style='display: block; margin: 0 auto; max-width: 100%;'><img src='../images/content/pagebuilder/gspm-mh3.png' alt='The George Washington University' style='display: block; margin: 0 auto; max-width: 100%;' >" );
				$( 'footer' ).css( 'background-color', '#ffffff' );
				break;
			case 'vascular institute':
				$( 'header' ).css( 'background-color', 'transparent' );
				$( '#logo-making-history-link' ).attr( 'href', 'http://www.gwheartandvascular.org/' );
				$( '#logo-making-history' )
					.attr( 'src', '../images/gwu_wrpr/logos/heart-and-vascular-institute.png' )
					.attr( 'alt', 'GW Heart and Vascular Institute logo' )
					.attr( 'title', '' );
				$( '#main-content' )
					.css( 'background', '#ccc url(../images/gwu_wrpr/backgrounds/heart-and-vascular-institute-background.png ) repeat-x' )
					.css( 'padding-bottom', '0' );
				$( '#main-content-wrapper' )
					.css( 'background-color', '#fff' )
					.css( 'padding-bottom', '2em' );
				$('<link>').appendTo('head').attr({type : 'text/css', rel : 'stylesheet'}).attr('href', '../css/gwu_wrpr/recurring-callout.css');
				$.getScript('../js/gwu_wrpr/recurring-callout.js');
				break;
			default:

				break;
		}
	};
	
	gwuWrapper.universal = {};
	gwuWrapper.universal.init = function() {
		/* Process settings that may have been set on page */
		if (gwuWrapper.settings.hideNavBar) {
			$('#nav-bar').addClass('hidden');
		}
		
		/* Set relevant classes */
		/* Marks page as a Thank You page if the transaction summary entries table is found */
		if ($('.transaction-summary-entries').length) {
			$('body').addClass('thank-you-page');
			$('td.FormSectionHeader').each(function() {
				if ($(this).html().toLowerCase().indexOf('transaction summary') != -1) {
					$(this).parents('table').addClass('transaction-summary-header-table').addClass('collapsed').attr('width', '').attr('border', '');
				}
			});
		}
		
		/* General clean-up of bad server-side Luminate stuff */
		/* Luminate sometimes puts line breaks in inline rows and sometimes not */
		if ($('#donate_form_body').length) {
			$('.inlineRow br').remove();
		}
		
		/* Deal with faux required fields (e.g., company name on matching gift section) */
		/* Some fields aren't actually required unless you want to use them--Luminate puts asterisks next to them instead of the standard style */
		$('label').each(function() {
			if ($(this).html().charAt(0) == '*') {
				$(this).before('<span class="field-required"></span>');
				$(this).html($(this).html().replace('* ', ''));
			}
		});
		/* Also need to set the position of their parents, whatever they are, to relative, because field-required is absolutely positioned */
		$('span.field-required').parent().css('position', 'relative');
		
		/* Toggle the employer matching section so it's visible only if the user intends to use it */
		if ($('#matching_eligible').length) {
			$('#employerInfo').slideUp(0);
			$('#matching_eligible').on('change', function() {
				if ($(this).prop('checked')) {
					$('#employerInfo').slideDown();
				} else {
					$('#employerInfo').slideUp();
				}
			});
		}
		
		/* Various layout adjustments */
		$('h1,h2').first().css('margin-top', '0');
		
		/* Include Any Required Scripts */
		if ($('#custom-fill-thermometer').length) {
			$('head').append("<link rel='stylesheet' type='text/css' class='do-not-purge' href='../css/gwu_wrpr/custom-fill-thermometer.css'>");
			if ($('.custom-fill-thermometer-june-challenge').length) {
				$.getScript('../js/gwu_wrpr/custom-fill-thermometer-june-challenge-final.js');
			} else if ($('.custom-fill-thermometer-test').length) {
				$.getScript('../js/gwu_wrpr/custom-fill-thermometer-test.js');
			} else {
				$.getScript('../js/gwu_wrpr/custom-fill-thermometer.js');
			}
		}
		
		if ($('.thermometer-and-readout-container').length) {
			$('head').append("<link rel='stylesheet' type='text/css' class='do-not-purge' href='../css/gwu_wrpr/custom-fill-thermometer.css'>");
			$.getScript('../js/gwu_wrpr/custom-fill-thermometer-test.js');
		}
	};
	
	gwuWrapper.utilities = {};
	
	gwuWrapper.utilities.attachCustomInPageStylesToHead = function() {
		$('body .custom-style').each(function() {
			$('head').append($(this).html());
		});
		$('body .custom-style').remove();
	};
	
	gwuWrapper.utilities.attachBodyStyleLinksToHead = function() {
		$('body link').each(function() {
			$('head').append($(this).detach());
		});
	};
	
	gwuWrapper.utilities.attachExternalStylesheetToHead = function( url ) {
		$( '<link>' ).attr( 'rel', 'stylesheet' )
		.attr( 'type', 'text/css' )
		.attr( 'href', url )
		.appendTo( 'head' );
	};
	
	gwuWrapper.utilities.attachFirstInPageStyleToHead = function() {
		$('body style').first().detach().appendTo('head');
	};
	
	gwuWrapper.utilities.attachGoogleFontToHead  = function( fontName, weights ) {
		weights = void(0) === weights ? [] : weights;
		var url = '//fonts.googleapis.com/css?family=' + fontName.replace(/\s/g, '+')
		        + ':' + weights.join( ',' );
		this.attachExternalStylesheetToHead( url );
	};
	
	gwuWrapper.utilities.purgeExternalStyles = function(allSheets) {
		allSheets = allSheets === void(0) ? true : allSheets;
		/* Get rid of some problematic stylesheets */
		$('head link[rel="stylesheet"]').each(function() {
			if ($(this).attr('href') == void(0) || $(this).hasClass('do-not-purge')) {
				return;
			}
			var styleURL = $(this).attr('href');
			if (!allSheets && (styleURL.indexOf('DonFormResponsive.css') != -1
				|| styleURL.indexOf('CustomStyle.css') != -1)) {
				$(this).remove();
			} else if (allSheets) {
				$(this).remove();
			}
		});
	};
	
	gwuWrapper.utilities.purgeInBodyStyles = function() {
		$('body style').remove();

	};
})(window.gwuWrapper = window.gwuWrapper || {}, jQuery);

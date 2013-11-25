var Const =
{
	FONT_SIZES:[13, 15, 17],
	SLIDE_INTERVAL:15,
	SLIDE_FRAME:9,
	FADE_SPEED:0.2,
	ELLIPSIS_BREAD:35,
	ELLIPSIS_LABEL:70,
	ELLIPSIS_LOADING:25,
	ELLIPSIS_TITLE:60,
	DEVICE_IPHONE:'ios',
	DEVICE_BLACKBERRY:'blackberry',
	DEVICE_DESKTOP:'desktop',

  TERM_DATA_NAME:'term_data_name', // workaround value: 'tdn',
	
	IPHONE:
	{
		SLIDE_INTERVAL:85,
		SLIDE_FRAME:3,
		FADE_SPEED:0.6,
		NETWORK_TIMEOUT_DURATION:20000
	},
	
	BLACKBERRY:
	{
		NETWORK_TIMEOUT_DURATION:60000
	},
	
	// in millisecond
	NETWORK_TIMEOUT_DURATION:15000,
    // DOMAIN:'http://pda.rnao-dev.org',
    DOMAIN:'http://pda.rnao.ca',
	// DOMAIN:'http://10.0.1.14:8088',
	// DOMAIN:'http://192.168.2.7:8088',
	URL_HOME:'/services/json/?sessid=36475b3012af98851b74e4f5251d183f&method=views.get&view_name=all_guidelines_available',
	URL_VIEW2:'/services/json/?sessid=36475b3012af98851b74e4f5251d183f&method=views.get&view_name=guideline_content_types&args=',
	URL_PAGE:'/services/json/?sessid=16f5b876d0a2b0195840cf64482519c5&method=node.get&fields=title,body,taxonomy,changed&nid=',
	URL_SEARCH:'/services/json/?sessid=16f5b876d0a2b0195840cf64482519c5&method=search.nodes&simple=true&search_keys=',
	URL_NODE_TIMESTAMPS:'/services/json/?sessid=16f5b876d0a2b0195840cf64482519c5&method=node_resource.index&fields=changed,nid',
	URL_VIEW_GLOBAL:'/services/json/?sessid=36475b3012af98851b74e4f5251d183f&method=pda.timestamp.global',
	URL_VIEW_TIMESTAMPS:'/services/json/?sessid=36475b3012af98851b74e4f5251d183f&method=pda.timestamp.list',
	
	MIN_VIEW_COUNT:46,
	MAX_VIEW_OVERFLOW:10,
	MAX_XHR_FAILURE:3,
	
	// TEMPLATES
	TMP_DETAIL:'<div class="detail">TEXT</div>',
	TMP_LABEL:'<div class="label">TEXT</div>',
	TMP_BREAD:'<a href="#" class="CLASS_NAME" id="bt-home">Home</a>',
	TMP_NAV:'<div class="bt-container"><a class="bt arrow left" href="#" id="bt-left"></a></div><div class="bt-container right"><a class="bt arrow right" href="#" id="bt-right"></a></div><div id="title">TEXT</div>',
	TMP_BACK_TO_TOP:'<div class="item back" onclick="App.backToTop();">Back to Top</div>',
	TMP_MESSAGE:'<div class="message">TEXT</div>',
	TMP_ERROR_NETWORK:'<div class="float-modal"><a href="#" id="bt-retry-close" class="bt round close"></a><p><b>Network is unavailable.</b></p><a id="bt-retry" href="#" class="bt-modal">Retry</a></div>',
	TMP_ERROR_INITIAL:'<div class="float-modal tall"><h2>Network Error</h2><p><b>Please make sure you have an internet connection when running this application for the first time.</b></p><a id="bt-retry" href="#" class="bt-modal">Retry</a></div>',
	TMP_PROGRESS:'<div class="float-modal large"><a href="#" id="progress-close" class="bt round close"></a><p id="progress_message">Finding outdated items...</p><div class="progress-bar-container"><div class="progress-bar"></div></div><div class="progress-status">0%</div><div class="progress-description">Downloading new and updated articles for offline viewing.<br />This can take <span class="emphasis">5 - 10 minutes</span>.</div><a id="bt-pause" href="#" class="bt-modal" onclick="ProgressModal.onPauseClick();return false;">Pause</a><a id="bt-cancel" href="#" class="bt-modal" onclick="ProgressModal.onCancelClick();return false;">Cancel</a><a id="bt-resume" href="#" class="bt-modal" style="display:none;" onclick="ProgressModal.onResumeClick();return false;">Resume</a></div>',
	TMP_WRAP_INNER:
	'<div id="new-header" class="header" ontouchmove="preventMove(event);"><div id="new-bread" class="bread"></div><div class="right right-edge"><a class="bt left update" href="#" id="bt-update"></a><a class="bt left font" href="#" id="bt-font"></a><a class="bt left search" href="#" id="bt-search"></a></div><div id="new-nav" class="nav"></div></div>' + 
	'<div id="new-list" class="list" ontouchmove="listTouchMove(event)" ontouchstart="listTouchStart(event);" ontouchend="touchEnd(event);"></div>' +
	'<div id="modal" style="display:none"><div id="search-header" class="header"><div class="left left-edge"><a class="bt right close round" href="#" id="bt-close-search"></a>' +
	'</div><input id="search-input" type="text" value="" /><div class="right right-edge"><a class="bt left search" href="#" id="bt-start-search"></a></div>' +
	'</div><div id="result" class="list" ontouchmove="resultTouchMove(event)" ontouchstart="resultTouchStart(event);" ontouchend="touchEnd(event);"></div></div>',
	TMP_OFFLINE_ONCLICK: ' onclick="navigator.notification.alert(\'Sorry, the link cannot be opened because there is no network connection.\', function() {}, \'Cannot Open Page\'); return false;" ',
	
	// PROGRESS MESSAGES
	PROGRESS_MSG_INVENTORY_NODES: 'Finding outdated guides...',
	PROGRESS_MSG_INVENTORY_VIEWS: 'Finding outdated lists...',
	PROGRESS_MSG_BB_FIND_EXPIRED: 'Organizing the guides...',
	PROGRESS_MSG_NODES:           'Downloading guides...',
	PROGRESS_MSG_VIEWS:           'Downloading lists...',
	
	// ALERT MESSAGES
	MSG_CANNOT_UPDATE:   'Sorry, you need a network connection to run the updater.',
	TITLE_CANNOT_UPDATE: 'No Network',

	MSG_INSTALL_DB:   'The database is about to be installed.\n\nThis can take up to 10 minutes, depending on the device.',
	TITLE_INSTALL_DB: 'Install Database',

	MSG_NO_RESULTS:   'Search returned no results.',

	MSG_CANNOT_OPEN_PAGE:       'Sorry, the link cannot be opened because there is no network connection.',
	MSG_CANNOT_OPEN_PAGE_TITLE: 'Cannot open page',

	MSG_SYNC_COMPLETE:   'Update complete!',
	TITLE_SYNC_COMPLETE: 'Update Complete',

	MSG_SYNC_NO_DATABASE:   'Sorry, update cannot be used on your device because there is no external storage.',
	TITLE_SYNC_NO_DATABASE: 'No Database',

	// DATABASE
	DB_INFO: 'internal_info'
};

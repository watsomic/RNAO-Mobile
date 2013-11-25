if ( navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i) ) {
}
else if ( navigator.userAgent.match(/browzr/i) ) {
	var SplashScreen = function() {
	};
	
	SplashScreen.prototype.hide = function() {
		return PhoneGap.execAsync(function(args) {
		},
		function(args) {
		},
		'ca.rnao.bpg.plugins.SplashScreen', 'hide', []);
	};
	
	PhoneGap.addPlugin('splashScreen', new SplashScreen());
}

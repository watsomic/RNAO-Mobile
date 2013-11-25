
package ca.rnao.bpg;

public class RNAO extends com.phonegap.PhoneGap {
	public static void main(String[] args) {
		RNAO bridge = args.length > 0 ? new RNAO(args[0]) : new RNAO();
		bridge.enterEventDispatcher();
	}
	
	public RNAO() {
		super();
	}

	public RNAO(final String url) {
		super(url);
	}
}
		
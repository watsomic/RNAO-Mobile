package ca.rnao.bpg.plugins;

import org.json.me.JSONArray;
import org.json.me.JSONException;

import com.phonegap.PhoneGap;
import com.phonegap.api.CommandResult;
import com.phonegap.api.PluginCommand;

public final class SplashScreen implements PluginCommand {
	private PhoneGap app;
	
	public void setContext(PhoneGap app) {
		this.app = app;
	}
	
	public CommandResult execute(String action, JSONArray args) {
		CommandResult.Status status = CommandResult.Status.OK;
		String result = "";

		if (action != null && action.equals("hide")) {
			app.hideLoadingScreen();
		}
		else {
			status = CommandResult.Status.INVALID_ACTION;
			result = "{ message: \"InvalidAction\", status: "+status.ordinal()+" }";
		}
		
		return new CommandResult(status, result);
	}
}

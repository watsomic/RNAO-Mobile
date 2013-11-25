package ca.rnao.bpg.plugins;

import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Vector;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import javax.microedition.io.Connector;
import javax.microedition.io.file.FileConnection;

import net.rim.device.api.system.PersistentObject;
import net.rim.device.api.system.PersistentStore;

import org.json.me.JSONArray;
import org.json.me.JSONObject;
import org.json.me.JSONException;

import com.phonegap.PhoneGap;
import com.phonegap.api.CommandResult;
import com.phonegap.api.PluginCommand;

public final class Update implements PluginCommand {
	private PhoneGap app;
	
	private static final long PERSISTENT_STORE_KEY = 0x4a9ab8d0f0147f4cL;
	
	public void setContext(PhoneGap app) {
		this.app = app;
	}
	
	public CommandResult execute(String action, JSONArray args) {
		CommandResult.Status status = CommandResult.Status.OK;
		CommandResult result = null;

		if (action != null && action.equals("findExpired")) {
			return findExpiredAction(args);
		}
		else {
			status = CommandResult.Status.INVALID_ACTION;
			result = new CommandResult(status, "{ message: \"InvalidAction\", status: "+status.ordinal()+" }");
		}
		
		return result;
	}
	
	protected CommandResult findExpiredAction(final JSONArray args) {
		CommandResult.Status status = CommandResult.Status.OK;
		JSONObject response  = new JSONObject();
		
		try {
			JSONArray jsonArray = new JSONArray();
			
			String nodeUrl = (String)args.get(0);
			String stringifiedTimestamps = (String)args.get(1);
			
			JSONObject jsonTimestamps = new JSONObject(stringifiedTimestamps);
			JSONArray  timestamps     = jsonTimestamps.getJSONArray("data");
			
			Hashtable  hash    = this.getHash();
			int        count   = timestamps.length();
			
			for(int i = 0; i < count; i++) {
				JSONObject element = (JSONObject)timestamps.get(i);
				String     key     = nodeUrl + element.getString("nid");
				
				String stringValue = (String)hash.get(key);
				if (stringValue == null) {
					jsonArray.put(element);
					continue;
				}
				
				JSONObject jsonValue = new JSONObject(stringValue);
				jsonValue = jsonValue.getJSONObject("data").getJSONObject("data");
				
				int remoteChanged = Integer.parseInt(element.getString("changed"));
				int localChanged  = Integer.parseInt(jsonValue.getString("changed"));
				
				if (remoteChanged > localChanged) {
					jsonArray.put(element);
				}
			}
			
			response.put("data", jsonArray);
		}
		catch(JSONException e) {
			status   = CommandResult.Status.JSON_EXCEPTION;
			response = null;
		}
		
		return new CommandResult(status, response);
	}
	
	private Hashtable getHash() {
		PersistentObject persistentObject = PersistentStore.getPersistentObject(PERSISTENT_STORE_KEY);
		Hashtable hash = null;
		
		try {
			Object storeObject = null;
			
			synchronized(persistentObject) {
				storeObject = persistentObject.getContents();
			}
			
			if (storeObject != null) {
				hash = (Hashtable)storeObject;
			}
		}
		catch (Exception e) {
			hash = null;
		}
		
		return hash;
	}
}

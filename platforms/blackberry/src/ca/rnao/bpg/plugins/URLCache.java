package ca.rnao.bpg.plugins;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.util.Vector;

import javax.microedition.io.Connector;
import javax.microedition.io.StreamConnection;
import javax.microedition.io.file.FileConnection;
import javax.microedition.io.file.IllegalModeException;

import net.rim.device.api.system.CoverageInfo;
import net.rim.device.api.system.DeviceInfo;
import net.rim.device.api.system.EventLogger;
import net.rim.device.api.system.RadioInfo;

import org.json.me.JSONArray;
import org.json.me.JSONException;

import com.phonegap.PhoneGap;
import com.phonegap.api.CommandResult;
import com.phonegap.api.PluginCommand;
import com.phonegap.util.MD5;

public final class URLCache implements PluginCommand {
	
	private PhoneGap app;
	public static final long   eventLogId = 0xd80d08d0154d42d5L;
	public static final String appName	  = "Generic";
	
	public void setContext(PhoneGap app) {
		this.app = app;
	}
	
	public CommandResult execute(String action, JSONArray args) {
		
/*		EventLogger.register(eventLogId,"LMLogger",EventLogger.VIEWER_STRING);
		EventLogger.logEvent(eventLogId,"App Launch".getBytes());
		EventLogger.startEventLogViewer();
*/
		
		CommandResult.Status status = CommandResult.Status.OK;
		String result = "";

		if (action != null && action.equals("getCachedPathForURI") && args != null && args.length() >= 1)
		{
			String uri = null;
			String fileName = null;
			String fileDir = null;
			
			// Determine the requested URL, output filename, and output directory
			//
			try {
				uri = args.getString(0);
				fileName = MD5.hash(uri);
				
				//fileDir = args.getString(1);
				fileDir = System.getProperty("fileconn.dir.memorycard");
				fileDir += (args.isNull(1)) ? appName : args.getString(1);
			} catch (JSONException e) { }

			if (uri != null && !uri.equals("") && fileDir != null && !fileDir.equals("")) {

				FileConnection fc = null;
	
				// First check if the file exists already
				String filePath = fileDir + System.getProperty("file.separator") + fileName;

				if (createDir(fileDir + System.getProperty("file.separator"))) {
				
					DataInputStream dis = null;
					DataOutputStream out = null;
					StreamConnection c = null;
					byte[] buffer = new byte[1024];
					int length = -1;
	
					try {
						fc = (FileConnection)Connector.open(filePath, Connector.READ_WRITE);
	
						if (fc.exists()) {
							result = "{ \"file\": \""+filePath+"\", \"status\": 0 }";
						} else {
							// Something that is used by the BlackBerry Enterprise Server for the BES Push apps. We want to initiate a direct TCP connection, so this parameter needs to be specified. 
							if (!DeviceInfo.isSimulator()) {
								uri += ";deviceside=true";
							}
							// Check for WIFI connectivity, optionally append the interface=wifi parameter to the end of URL.
							// If you have data disabled and WIFI enabled, but you cannot access the network, then check that
							// the device is not configured to connect to a VPN network.
							// WIFI Connection > WIFI Options > Select the active network > Edit > Set VPN to None
							if ((RadioInfo.getActiveWAFs() & RadioInfo.WAF_WLAN) != 0) {
								if (CoverageInfo.isCoverageSufficient(CoverageInfo.COVERAGE_DIRECT, RadioInfo.WAF_WLAN, true)) {
									uri += ";interface=wifi";
								}
							}
							
							c = (StreamConnection)Connector.open(uri);
							dis = c.openDataInputStream();
							
							// Create the file after the data has been successfully downloaded
							fc.create();
							
							out = fc.openDataOutputStream();
							while ((length = dis.read(buffer)) != -1) {
								out.write(buffer, 0, length);
							}
							out.flush();
							result = "{ \"file\": \""+filePath+"\", \"status\": 0 }";
						}
					} catch (SecurityException e) {
						status = CommandResult.Status.IO_EXCEPTION;
						result = "{ message: \"SecurityException creating cache file "+e.getMessage()+"\", status: "+status.ordinal()+" }";
					} catch (IllegalModeException e) {
						status = CommandResult.Status.IO_EXCEPTION;
						result = "{ message: \"IllegalModeException creating cache file "+e.getMessage()+"\", status: "+status.ordinal()+" }";
					} catch (IOException e) {
						status = CommandResult.Status.IO_EXCEPTION;
						result = "{ message: \"IOException creating cache file "+e.getMessage()+"\", status: "+status.ordinal()+" }";
					} finally {
						try {
							if (dis != null) {
								dis.close();
							}
							if (c != null) {
								c.close();
							}
							if (out != null) {
								out.close();
							}
							if (fc != null) {
								fc.close();
							}
						} catch (IOException e) {
							status = CommandResult.Status.IO_EXCEPTION;
							result = "{ message: \"IOException\", status: "+status.ordinal()+" }";
						}
					}
				} else {
					status = CommandResult.Status.IO_EXCEPTION;
					result = "{ message: \"IOException. Could not created directory " + fileDir + "\", status: "+status.ordinal()+" }";
				}
			} else {
				status = CommandResult.Status.JSON_EXCEPTION;
				result = "{ message: \"JSONException. Could not parse file path or name args.\", status: "+status.ordinal()+" }";
			}
		} else {
			status = CommandResult.Status.INVALID_ACTION;
			result = "{ message: \"InvalidAction\", status: "+status.ordinal()+" }";
		}
		return new CommandResult(status, result);
	}
	
	protected boolean createDir(String dir) {
		try {
			FileConnection fc;
			String[] path = splitString(dir, '/', false);
			String tempDir = "file:///" + path[1];
			for (int i=2; i<path.length; i++) {
				tempDir += System.getProperty("file.separator") + path[i];
				fc = (FileConnection)Connector.open(tempDir + System.getProperty("file.separator"));
				if (!fc.exists()) {
					fc.mkdir();
				}
				fc.close();
			}
		} catch(IOException e) {
			return false;
		}
		return true;
	}
	
	public static final String[] splitString(final String data, final char splitChar, final boolean allowEmpty)
	{
		Vector v = new Vector();

		int indexStart = 0;
		int indexEnd = data.indexOf(splitChar);
		if (indexEnd != -1)
		{
			while (indexEnd != -1)
			{
				String s = data.substring(indexStart, indexEnd);
				if (allowEmpty || s.length() > 0)
				{
					v.addElement(s);
				}
				indexStart = indexEnd + 1;
				indexEnd = data.indexOf(splitChar, indexStart);
			}

			if (indexStart != data.length())
			{
				// Add the rest of the string
				String s = data.substring(indexStart);
				if (allowEmpty || s.length() > 0)
				{
					v.addElement(s);
				}
			}
		}
		else
		{
			if (allowEmpty || data.length() > 0)
			{
				v.addElement(data);
			}
		}

		String[] result = new String[v.size()];
		v.copyInto(result);
		return result;
	}
}

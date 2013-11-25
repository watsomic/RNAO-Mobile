package ca.rnao.bpg.plugins;

import java.lang.StringBuffer;

import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Vector;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;

import javax.microedition.io.Connector;
import javax.microedition.io.file.FileConnection;

import net.rim.device.api.compress.GZIPInputStream;
import net.rim.device.api.compress.GZIPOutputStream;
import net.rim.device.api.system.Application;
import net.rim.device.api.system.PersistentObject;
import net.rim.device.api.system.PersistentStore;

import org.json.me.JSONArray;
import org.json.me.JSONObject;
import org.json.me.JSONException;

import com.phonegap.PhoneGap;
import com.phonegap.api.CommandResult;
import com.phonegap.api.PluginCommand;

public final class Store implements PluginCommand {
	private PhoneGap app;
	
	private static final long   PERSISTENT_STORE_KEY = 0x4a9ab8d0f0147f4cL;
	private static final String EXPORT_FILENAME      = "database.json.gzip";
	private static final String EXPORT_URI           = System.getProperty("fileconn.dir.memorycard") + "RNAO" + System.getProperty("file.separator") + EXPORT_FILENAME;
	private static final String IMPORT_URI           = "/www/database/" + EXPORT_FILENAME;
	private static final String IMAGES_SOURCE        = "/www/database/images/";
	private static final String IMAGES_DESTINATION   = System.getProperty("fileconn.dir.memorycard") + "RNAO" + System.getProperty("file.separator");
	private static final String IMAGES_JSON_LIST     = "/www/database/images.json";
	
	public void setContext(PhoneGap app) {
		this.app = app;
	}
	
	public CommandResult execute(String action, JSONArray args) {
		CommandResult.Status status = CommandResult.Status.OK;
		CommandResult result = null;

		if (action != null && action.equals("backup")) {
			return backupAction();
		}
		else if (action != null && action.equals("restore")) {
			return restoreAction();
		}
		else if (action != null && action.equals("search")) {
			return searchAction(args);
		}
		else {
			status = CommandResult.Status.INVALID_ACTION;
			result = new CommandResult(status, "{ message: \"InvalidAction\", status: "+status.ordinal()+" }");
		}
		
		return result;
	}
	
	protected CommandResult backupAction() {
		CommandResult.Status status = CommandResult.Status.OK;
		
		JSONObject allRecords = findAllRecords();
		boolean    success    = backupRecords(allRecords); 
		JSONObject response   = new JSONObject();
		
		try {
			response.put("success",      success);
			response.put("record_count", (success) ? allRecords.length() : -1);
			response.put("uri",          EXPORT_URI);
		}
		catch(JSONException e) {
			status   = CommandResult.Status.JSON_EXCEPTION;
			response = null;
		}
		
		return new CommandResult(status, response);
	}
	
	protected CommandResult restoreAction() {
		CommandResult.Status status = CommandResult.Status.OK;
		
		JSONObject allRecords = readAllRecords();
		boolean    success    = restoreRecords(allRecords);
		
		if (success) {
			success = restoreImages(readAllImages());
		}
		
		JSONObject response   = new JSONObject();
		
		try {
			response.put("success",      success);
			response.put("record_count", (success) ? allRecords.length() : -1);
			response.put("uri",          IMPORT_URI);
		}
		catch (JSONException e) {
			status   = CommandResult.Status.JSON_EXCEPTION;
			response = null;
		}
		
		return new CommandResult(status, response);
	}
	
	protected CommandResult searchAction(final JSONArray request) {
		CommandResult.Status status = CommandResult.Status.OK;
		JSONObject response = new JSONObject();
		
		try {
			final String query = request.getString(0).toLowerCase();
			
			JSONObject allRecords     = findAllRecords();
			JSONArray  matchedRecords = matchRecords(query, allRecords);
			
			response.put("data", matchedRecords);
			response.put("error", false);
		}
		catch (JSONException e) {
			status = CommandResult.Status.JSON_EXCEPTION;
			response = null;
		}
		
		return new CommandResult(status, response);
	}
	
	private JSONObject findAllRecords() {
		PersistentObject persistentObject = PersistentStore.getPersistentObject(PERSISTENT_STORE_KEY);
		JSONObject       jsonRecords      = new JSONObject();
		
		try {
			Object storeObject = null;
			
			synchronized(persistentObject) {
				storeObject = persistentObject.getContents();
			}
			
			if (storeObject != null) {
				Hashtable hash = (Hashtable)storeObject;
				Enumeration e  = hash.keys();
				String key     = "";
				String value   = "";
				
				while (e.hasMoreElements()) {
					key   = (String)e.nextElement();
					value = (String)hash.get(key);
					
					jsonRecords.put(key, value);
				}
			}
		}
		catch (Exception e) {
			jsonRecords = null;
		}
		
		return jsonRecords;
	}
	
	private boolean backupRecords(final JSONObject allRecords) {
		boolean success = false;
		
		if (allRecords == null) {
			return false;
		}
		
		try {
			FileConnection jsonFile = (FileConnection)Connector.open(EXPORT_URI, Connector.READ_WRITE);
			
			if (jsonFile.exists()) {
				jsonFile.delete();
			}
			
			jsonFile.create();

			OutputStreamWriter out = new OutputStreamWriter(new GZIPOutputStream(jsonFile.openOutputStream(), GZIPOutputStream.COMPRESSION_BEST), "UTF-8");
//			OutputStream out = jsonFile.openOutputStream();
			out.write(allRecords.toString());
			out.flush();
			out.close();
			
			jsonFile.close();
			
			success = true;
		}
		catch(IOException e){
			success = false;
		}
		
		return success;
	}
	
	
	private JSONObject readAllRecords() {
		JSONObject jsonRecords = null;
		
		try {
			InputStream in = Application.class.getResourceAsStream(IMPORT_URI);
			InputStreamReader inFile = new InputStreamReader(new GZIPInputStream(in), "UTF-8");
			
			try {
				int ch;
				StringBuffer buffer = new StringBuffer();
				while ((ch = inFile.read()) > -1) {
					buffer.append((char)ch);
				}
				
				jsonRecords = new JSONObject(buffer.toString());
			}
			catch (JSONException e) {
				jsonRecords = null;
			}
			
			inFile.close();
			in.close();
		}
		catch(IOException e){
			jsonRecords = null;
		}
		
		return jsonRecords;
	}
	
	private JSONArray readAllImages() {
		JSONArray jsonArray = null;
		
		try {
			InputStream inFile = Application.class.getResourceAsStream(IMAGES_JSON_LIST);
			
			try {
				jsonArray = new JSONArray(read(inFile));
			}
			catch (JSONException e) {
				jsonArray = null;
			}
			
			inFile.close();
		}
		catch(IOException e){
			jsonArray = null;
		}
		
		return jsonArray;
	}

	private boolean restoreRecords(final JSONObject allRecords) {
		boolean success = false;
				
		try {
			PersistentObject persistentStore = PersistentStore.getPersistentObject(PERSISTENT_STORE_KEY);
			Object storeObject = null;
			
			synchronized(persistentStore) {
				storeObject = persistentStore.getContents();
			}
			
			if (storeObject != null) {
				Hashtable hash = (Hashtable)storeObject;
				Enumeration e  = allRecords.keys();
				String key     = "";
				String value   = "";
				
				while (e.hasMoreElements()) {
					key   = (String)e.nextElement();
					value = (String)allRecords.get(key);
					
					hash.put(key, value);
				}
				
				synchronized(persistentStore) {
					persistentStore.setContents(hash);
					persistentStore.commit();
				}
				
				success = true;
			}
		}
		catch (Exception e) {
			success = false;
		}
		
		return success;
	}
	
	private boolean restoreImages(final JSONArray jsonImages) {
		if (jsonImages == null) {
			return false;
		}
		
		if (this.mkdir(IMAGES_DESTINATION) == false) {
			return false;
		}
		
		try {
			int count = jsonImages.length();
			for (int i = 0; i < count; i++) {
				String filename   = jsonImages.getString(i);
				String inputPath  = IMAGES_SOURCE + filename;
				String outputPath = IMAGES_DESTINATION + filename;
				
				FileConnection outputImage = (FileConnection)Connector.open(outputPath, Connector.READ_WRITE);
				if (outputImage.exists()) {
					outputImage.delete();
				}
				outputImage.create();
				
				InputStream  is = Application.class.getResourceAsStream(inputPath);
				OutputStream os = outputImage.openOutputStream();
				
				os.write(read(is).getBytes());
				
				os.close();
				is.close();
				outputImage.close();
			}
		}
		catch (IOException e) {
			return false;
		}
		catch (JSONException e) {
			return false;
		}
		
		return true;
	}
	
	private JSONArray matchRecords(final String query, final JSONObject allRecords) {
		JSONArray matches = new JSONArray();
		
		try {
			// Loop over the records
			Enumeration e  = allRecords.keys();
			
			while (e.hasMoreElements()) {
				String key   = (String)e.nextElement();
				String value = (String)allRecords.get(key);
				
				// Search {data: {data: {title: "...", body: "..." } } }
				JSONObject record = new JSONObject(value);
				
				record = record.optJSONObject("data");
				if (record == null) continue;
				
				record = record.optJSONObject("data");
				if (record == null) continue;
				
				// Check title first, since it is shorter
				String title = record.getString("title");
				int index = title.toLowerCase().indexOf(query);
				
				// If there was no match, try the body
				// if (index < 0) {
				// 	String body = record.getString("body");
				// 	index = body.toLowerCase().indexOf(query);
				// }
				
				if (index >= 0) {
					JSONObject match = new JSONObject();
					match.put("title", title);
					match.put("node", this.getNodeId(key));
					matches.put(match);
				}
			}
		}
		catch (JSONException e) {
			matches = null;
		}
		
		return matches;
	}
	
	private String getNodeId(final String encodedUrl) {
		// The node ID is the last parameter of the URL string.
		// Since the URL string is encoded, "=" is %3D
		int index = encodedUrl.lastIndexOf('D') + 1;
		return encodedUrl.substring(index);
	}
	
	public static String read(InputStream input) throws IOException {
		ByteArrayOutputStream bytes = new ByteArrayOutputStream();
		try {
			int bytesRead = -1;
			byte[] buffer = new byte[1024];
			while ((bytesRead = input.read(buffer)) != -1) bytes.write(buffer, 0, bytesRead);
		} finally {
			try {
				input.close();
			} catch (IOException ex) {}
		}
		return bytes.toString();
	}
	
	protected boolean mkdir(String dir) {
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

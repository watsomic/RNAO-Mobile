Registered Nurses' Association of Ontario (RNAO)
================================================

Supported PhoneGap Platforms
----------------------------

- Android
- BlackBerry
- iOS
  
Directory Structure
--------------------

    assets/ ..................... All icons / loading screens
    platforms/ .................. Native projects
    tests/ ...................... JavaScript tests
    tests/features/ ............. Use Cases
    www/ ........................ Common application
    
Build Script
------------

Easily compile a platform specific:

    rake desktop
    rake blackberry
    rake ios
    
Dependencies:

    gem install rake
    gem install mustache
    gem install json

Creating a new Database Snapshot
================================

BlackBerry 4.6
--------------

### Prepare for the Backup

1. `app.database.js`
    - Replace `migrate.completed()` -> `migrate.using(migrate.completed);`
    - Replace `window.plugins.store.restore(addTimestamp, addTimestamp);` -> `addTimestamp();`
2. `app.cache.js`
    - Uncomment `window.plugins.store.backup`
3. `app.const.js`
    - Use correct `DOMAIN`
4. Delete RNAO directory on SDCard
5. Unplug device before beginning backup to unmount the SDCard

### After the Backup

1. Undo steps 1 and 2
2. Delete `www/database`
3. Copy `SDCard/RNAO` -> `www/database`
    - Move images to `www/database/images`
4. Run `rake imagelist`
5. Update database timestamp
    - `new Date().getTime();`
    - set `app.please.js` -> `Application.settings.database.created`

### Verify Backup

1. Delete `SDCard/RNAO`
2. Compile and run
    - Disable network/wifi
    - You should see the database restoration message because the timestamp will force an update

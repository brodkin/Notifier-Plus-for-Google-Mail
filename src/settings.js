var Settings = function() {

   var prefix = 'mailchecker_';

   var defaults = {
      "poll": 15000,
      "dn_timeout": 15000,
      "language": "en",
      "sn_audio": "chime.mp3",
      "check_label": "",
      "open_label": "#inbox",
      "icon_set": "set1",
      "preview_setting": 2,
      "show_notification": true,
      "check_gmail_off": false,
      "hide_count": false,
      "sound_off": false,
      "show_notification": true,
      "showfull_read": false,
      "animate_off": false,
      "open_tabs": false,
      "no_mailto": false,
      "archive_read": true,
   };

   Settings.reset = function () {
      localStorage.clear();
      console.log('Cleared local storage.');
   };

   Settings.read = function (key) {

      var value = localStorage.getItem(prefix + key);

      if (value != null) {
         //console.log('Read: ' + key + '=' + value);
         // Return value
         if (value == 'true') return true;
         else if (value == 'false') return false;
         else return value;
      } else {
         // Key not found, store default value
         if (defaults[key] != null) {
            //console.log('Default: ' + key + '=' + defaults[key]);
            this.store(key, defaults[key]);
            return defaults[key];
         }
      }

      return null;
   };

   Settings.store = function (key, value) {
      localStorage.setItem(prefix + key, value);
      console.log('Stored: ' + key + '=' + value);
   };
}

Settings();
var Settings = function() {

   var prefix = 'brodkinca_notifier_';

   var defaults = {
      "animate_off": 'false',
      "archive_read": 'true',
      "check_label": "",
      "dn_timeout": 15000,
      "hide_count": 'false',
      "icon_set": "set1",
      "language": "en",
      "no_mailto": 'false',
      "open_label": "#inbox",
      "open_tabs": 'false',
      "poll": 15000,
      "preview_setting": 2,
      "show_notification": 'true',
      "showfull_read": 'true',
      "sn_audio": "chime.mp3",
      "sound_off": 'false'
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
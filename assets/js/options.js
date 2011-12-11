var backgroundPage = chrome.extension.getBackgroundPage();
var Settings = backgroundPage.getSettings();
var extVersion = chrome.app.getDetails().version;
var hash; 

// Google Analytics Tracking Code
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-27460318-2']);
_gaq.push(['_trackPageview']);

(function() {
 var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
 ga.src = 'https://ssl.google-analytics.com/ga.js';
 var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

function reset_options() {
    Settings.reset();
    backgroundPage.reloadSettings();
}

function checkHash(){
    if (window.location.hash == '') {
        processHash('#general');
    } else if (window.location.hash != hash) { 
        hash = window.location.hash; 
        processHash(hash); 
    } t=setTimeout("checkHash()",200); 
}

function processHash(hash){
  // Hide All Sections and Show Requested
  $('[id^="tab"]').hide();
  $('#tab_' + hash.substring(1)).show();

  // Deactivate All Menu Items and Reactivate Clicked
  $('#menu a').each(function () {
      var menuItem = $(this);
      menuItem.removeClass('active');
      if (menuItem.attr('href') == hash) menuItem.addClass('active');
  });
}

// Restores input states to saved values from stored settings.
function restore_options() {

   // Restore Form Field Values
   $('#main [name]').each(function () {
     var field = $(this);
     var name = field.attr('name');
     var value = Settings.read(name);
     field.val([value]);
   });

   // Icon Sets
   spawnIconRow("set1", "Default");
   spawnIconRow("set2", "Default Grey");
   spawnIconRow("set3", "Default White");
   spawnIconRow("set11", "Native");
   spawnIconRow("set12", "Native Grey");
   spawnIconRow("set8", "Gmail Glossy");
   spawnIconRow("set9", "Gmail Mini");
   spawnIconRow("set10", "Gmail Monochrome");
   spawnIconRow("set4", "Alternative 1");
   spawnIconRow("set5", "Alternative 2");
   spawnIconRow("set6", "Chromified Classic");
   spawnIconRow("set7", "Chromified Grey");
   spawnIconRow("set13", "OSX");

   var iconRadios = document.forms[0].icon_set;
   var iconFound = false;
   for (var i in iconRadios) {
      if (iconRadios[i].value == Settings.read("icon_set")) {
         iconRadios[i].checked = true;
         iconFound = true;
         break;
      }
   }
   if (!iconFound) {
      iconRadios[0].checked = true;
   }

   var previewRadios = document.forms[0].preview_setting;
   for (var i in previewRadios) {
      if (previewRadios[i].value == Number(Settings.read("preview_setting"))) {
         previewRadios[i].checked = true;
         break;
      }
   }

   // Populate Languages
   var langSel = document.getElementById("languages");
   for (var i in languages) {
      langSel.add(new Option(languages[i].what, languages[i].id), languages[i].id);
   }
   langSel.value = Settings.read("language");
   sortlist(langSel);

   // Load Raw Audio
   //$('#sn_audio_enc').val(Settings.read("sn_audio_raw"));

   // Hide Upload Field Unless Custom Selected
   if (Settings.read("sn_audio") != "custom") {
      $('#sn_audio_src').hide();
   }
}

function spawnIconRow(value, description) {
    var selectionElement = document.getElementById("icon_selection");
    selectionElement.innerHTML += '<span><input type="radio" name="icon_set" value="' + value + '" id="icon_set' + value + '" /><label for="icon_set' + value + '"><img src="icons/' + value + '/not_logged_in.png" /><img src="icons/' + value + '/no_new.png" /><img src="icons/' + value + '/new.png" /> <small>' + description + '</small></span></label><br />';
}

function requestUserPermission() {
    try {
        var radio = $('#show_notification');
            if (checkUserPermission())
                return;

            if (typeof webkitNotifications != "undefined") {
                webkitNotifications.requestPermission(function () {
                    var permissionGranted = checkUserPermission();
                });
            }
    } catch (e) { radio.val(false); }
}

function checkUserPermission() {
    try {
        return (webkitNotifications.checkPermission() == 0);
    } catch (e) { return false; }
  }

function handleAudioFile(fileList) {
   var file = fileList[0];
   var fileReader = new FileReader();

   fileReader.onloadend = function () {
	   try {
		   localStorage["temp"] = this.result;
	   } catch(e) {
		   alert("The file you have chosen is too large, please select a shorter sound alert.");
		   return;
	   } finally {		   
		   localStorage["temp"] = null;
		   delete localStorage["temp"];
	   }		
	   
      $('#sn_audio_enc').val(this.result);
	   
	   
	  $('#submit').val('Save &amp; Reload');
	  $('#submit').removeAttr('disabled');
   }

   fileReader.onabort = fileReader.onerror = function () {
      switch (this.error.code) {
         case FileError.NOT_FOUND_ERR:
            alert("File not found!");
            break;
         case FileError.SECURITY_ERR:
            alert("Security error!");
            break;
         case FileError.NOT_READABLE_ERR:
            alert("File not readable!");
            break;
         case FileError.ENCODING_ERR:
            alert("Encoding error in file!");
            break;
         default:
            alert("An error occured while reading the file!");
            break;
      }
   }
   
   fileReader.readAsDataURL(file);
}

function playNotificationSound() {
   var source;

   if (document.getElementById("sn_audio").value == "custom") {
      if (document.getElementById("sn_audio_enc").value) {
         source = document.getElementById("sn_audio_enc").value;
      } else {
         source = Settings.read("sn_audio_raw");
      }
   } else {
      source = document.getElementById("sn_audio").value;
   }

   try {
      var audioElement = new Audio();
      audioElement.src = "assets/audio/" + source;
      audioElement.play();
   } catch (e) {
      console.error(e);
   }
}

$(function() {
  restore_options();
  checkHash();

  $('.options_header').prependTo('.options');

  $("select, input:checkbox, input:radio, input:file").uniform().change(function () {
    var selector = $(this);
    Settings.store(selector.attr('name'), selector.val());

    if (selector.attr('name') == 'sn_audio') {
      $('#sound_off_false').click();
      playNotificationSound();

      if (selector.val() == "custom") {
         $('#sn_audio_src').show();
      } else {
         $('#sn_audio_src').hide();
      }
    }
  });

  $(window).unload(function() {
    backgroundPage.reloadSettings();
  });

});
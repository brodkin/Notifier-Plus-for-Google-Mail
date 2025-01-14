var backgroundPage = chrome.extension.getBackgroundPage();
var Settings = backgroundPage.getSettings();
var mailAccounts = backgroundPage.accounts;
var mailCount = 0;
var mailCache = new Array();
var allMailMap;
var allMailArray;
var scrollbar;
var unreadCount = 0;

var tooltips = {
   position: {
      my: 'top center', 
      at: 'bottom center',
      viewport: $(window)
   },
   style: {
      tip: true,
      classes: 'ui-tooltip-tipsy'
   }
};

// Redirect Console Output to BG Window
window._console = window.console;
window.console = {
    log: function(data) {
        backgroundPage.console.log(data);
    }
};

// Google Analytics Tracking Code
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-27460318-2']);
_gaq.push(['_trackPageview']);

(function() {
 var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
 ga.src = 'https://ssl.google-analytics.com/ga.js';
 var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

$.each(mailAccounts, function (i, account) {
   unreadCount += account.getUnreadCount();
});

var previewSetting = Settings.read("preview_setting");

if (previewSetting === 0) {
   // Preview setting set to "Always off" =
   // Go to first mail inbox with unread items
   openInbox(0);
} else if (previewSetting === 1 && unreadCount === 0) {
   // Preview setting set to "Automatic" + no unread mail =
   // Go to first mail inbox
   openInbox(0);
}

function hideElement(id) {
   var element = document.getElementById(id);
   if (element != null) {
      element.style.display = 'none';
   }
}

function showElement(id) {
   var element = document.getElementById(id);
   if (element != null) {
      element.style.display = 'inline';
   }
}

// Opens a mail and closes this window
function openMail(accountId, mailid) {
   mailAccounts[accountId].openThread(mailid);
   //window.close();
}

function openInbox(accountId) {
   if (accountId == null) {
      accountId = 0;
      // Open first inbox with unread items
      $.each(mailAccounts, function (i, account) {
         if (account.getUnreadCount() > 0) {
            accountId = account.id;
            return false;
         }
      });
   }

   if(mailAccounts == null || mailAccounts[accountId] == null) {
      console.error("No mailaccount(s) found with account id " + accountId);
      return;
   }

   mailAccounts[accountId].openInbox();
   window.close();
}

function composeNew(accountId) {
   mailAccounts[accountId].composeNew();
   window.close();
}

function sendPage(accountId) {
   chrome.tabs.getSelected(null, function (tab) {
      mailAccounts[accountId].sendPage(tab);
      window.close();
   });
}

function showLoading(mailid) {
   $('[data-mail-id="' + mailid + '"] .loading').fadeIn(100);
}

function hideLoading(mailid) {
   $("#loadingBox_" + mailid).hide();
}

function readThread(accountId, mailid, stayOpen) {
   showLoading(mailid);
   mailAccounts[accountId].readThread(mailid, function() { hideMail(accountId, mailid, stayOpen); });
}

function unreadThread(accountId, mailid) {
   mailAccounts[accountId].unreadThread(mailid);
   var mailElement = document.getElementById(mailid);
   if (mailElement != null) {
      var mailHeaderReadLink = document.getElementById(mailid + "_read-link");
      if (mailHeaderReadLink != null) {
         mailHeaderReadLink.href = "javascript:readThread('" + accountId + "', '" + mailid + "');";
         mailHeaderReadLink.innerHTML = i18n.get('readLink');
         mailHeaderReadLink.title = i18n.get('readLinkTitle');
      }
   }
}

function archiveThread(accountId, mailid) {
   showLoading(mailid);
   mailAccounts[accountId].archiveThread(mailid, function() { hideMail(accountId, mailid); });
}

function deleteThread(accountId, mailid) {
   showLoading(mailid);
   mailAccounts[accountId].deleteThread(mailid, function() { hideMail(accountId, mailid); });
}

function spamThread(accountId, mailid) {
   showLoading(mailid);
   mailAccounts[accountId].spamThread(mailid, function() { hideMail(accountId, mailid); });
}

function starThread(accountId, mailid, value, callback) {
   mailAccounts[accountId].starThread(mailid, value, callback);
}

function importanceThread(accountId, mailid, value, callback) {
   mailAccounts[accountId].importanceThread(mailid, value, callback);
}

function applyLabelToThread(accountId, mailId, label) {
   mailAccounts[accountId].applyLabel(mailId, label);
}

function replyTo(accountId, mailid) {
   mailAccounts[accountId].replyTo(allMailMap[mailid]);
}

function showReply(mailid) {
   var replyBox = document.getElementById(mailid + "_reply");
   //replyBox.style.display = 'block';
}

function hideReply(mailid) {
   var replyBox = document.getElementById(mailid + "_reply");
   //replyBox.style.display = 'none';
}

function sendReply(mailid) {
   var replyTextArea = document.getElementById(mailid + "_replytext");
   var replyText = replyTextArea.value;
   hideReply(mailid);
   mailAccount.replyToThread({ "id": mailid, "body": replyText });
}

function getThread(accountId, mailid) {

   if (Settings.read("showfull_read")) {
	  readThread(accountId, mailid, true);
   }

   if (mailCache[mailid] != null) {
      // Mail already fetched, read from cache instead
      showBody(accountId, mailid, mailCache[mailid]);
      return false;
   }

   if (accountId != null) {
      showLoading(mailid);
      mailAccounts[accountId].getThread(accountId, mailid, showBody);  
   }
}

function showBody(accountid, mailid, mailbody) {
   hideLoading(mailid);
   //   showElement(mailid + "_less-link");
   //   hideElement(mailid + "_more-link");

   if (mailbody != null) {

      var previousMail = null;
      var nextMail = null;
      var currentMail = allMailMap[mailid];
      var currentMailIndex = 0;
      
      $.each(allMailArray, function(index, _mail) {
         if(_mail.id === mailid) {
            currentMailIndex = index + 1;
            if(index > 0) {
               previousMail = allMailArray[index - 1];
            }
            if(index + 1 < allMailArray.length) {
               nextMail = allMailArray[index + 1];
            }
            // Break loop
            return false;
         }
      });

      var nextPreviousOrHide = function() {
         if(nextMail) {            
            getThread(nextMail.accountId, nextMail.id);
         } else if(previousMail) {         
            getThread(previousMail.accountId, previousMail.id);
         } else {
            hideBody();
         }
      }

      var fullscreenContainer = $("#fullscreenContainer");
      var fullscreenContent = $("#fullscreenContent");
      var fullscreenControl = $("#fullscreenControls");

      fullscreenControl.find('.openLink').html(currentMail.shortTitle);
      fullscreenControl.find('.openLink').attr('title', Encoder.htmlDecode(currentMail.title));
      fullscreenControl.find('.authorLink').html(currentMail.authorName);
      fullscreenControl.find('.authorLink').attr('title', Encoder.htmlDecode(currentMail.authorMail));
      fullscreenControl.find('.issuedLink').html(formatDateTime(currentMail.issued, i18n.selected_lang.months, true));
      fullscreenControl.find('.issuedLink').attr('title', currentMail.issued);

      fullscreenControl.find('.readLink').text(i18n.get('readLink'));
      fullscreenControl.find('.deleteLink').text(i18n.get('deleteLink'));
      fullscreenControl.find('.spamLink').text(i18n.get('spamLink'));
      fullscreenControl.find('.archiveLink').text(i18n.get('archiveLink'));
      fullscreenControl.find('.countLabel').text(currentMailIndex + ' of ' + allMailArray.length);
      fullscreenControl.find('.starLink').attr('title', i18n.get('starLinkTitle'));
      fullscreenControl.find('.replyLink').attr('title', i18n.get('replyLinkTitle'));
      fullscreenControl.find('.readLink').attr('title', i18n.get('readLinkTitle'));
      fullscreenControl.find('.deleteLink').attr('title', i18n.get('deleteLinkTitle'));
      fullscreenControl.find('.spamLink').attr('title', i18n.get('spamLinkTitle'));
      fullscreenControl.find('.archiveLink').attr('title', i18n.get('archiveLinkTitle'));


      // Insert the full mail body and full screen controls
      fullscreenContent.empty();
      fullscreenContent.html(mailbody);

      fullscreenContainer.empty();
      fullscreenContainer.append(fullscreenControl);
      fullscreenContainer.append(fullscreenContent);

      // Set event handlers

      if(previousMail) {
         fullscreenControl.find('.previousLink').css('visibility','visible');
         fullscreenControl.find('.previousLink').on('click', function () {
            getThread(previousMail.accountId, previousMail.id);
         });
      } else {
         fullscreenControl.find('.previousLink').css('visibility','hidden');
      }

      if(nextMail) {
         fullscreenControl.find('.nextLink').css('visibility','visible');
         fullscreenControl.find('.nextLink').on('click', function () {
            getThread(nextMail.accountId, nextMail.id);
         });
      } else {
         fullscreenControl.find('.nextLink').css('visibility','hidden');
      }

      fullscreenControl.find('.closeLink').on('click', function () {
         window.close();
      });
      fullscreenControl.find('.hideLink').on('click', function () {
         hideBody();
      });

      fullscreenControl.find('.readLink').on('click', function () {
         readThread(accountid, mailid);
         nextPreviousOrHide();
      });
      fullscreenControl.find('.replyLink').on('click', function () {
         replyTo(accountid, mailid);
         nextPreviousOrHide();
      });
      fullscreenControl.find('.deleteLink').on('click', function () {
         deleteThread(accountid, mailid);
         nextPreviousOrHide();
      });
      fullscreenControl.find('.spamLink').on('click', function () {
         spamThread(accountid, mailid);
         nextPreviousOrHide();
      });
      fullscreenControl.find('.archiveLink').on('click', function () {
         archiveThread(accountid, mailid);
         nextPreviousOrHide();
      });

      fullscreenControl.find('.openLink').on('click', function () {
         openMail(accountid, mailid);
         hideBody();
      });

      fullscreenControl.find('.starLink').on('click', function () {
         $(this).css('opacity', '1');
         starThread(accountid, mailid);
      });

      // Display full screen container
      fullscreenContainer.css("display", "block");

      // Save this mail in the cache
      mailCache[mailid] = mailbody;

      // Toggle the size of the window
      expandWindow();
   }
}

function hideBody() {
   // Hide full screen
   $("#fullscreenContainer").css("display", "none");

   // Toggle the size of the window
   contractWindow();
}

// Hides a mail in the mailbox
function hideMail(accountId, mailid, stayOpen) {
   var accountElement = $('[data-account-id="' + accountId + '"]');

   $('[data-mail-id="' + mailid + '"]').remove();

   delete allMailMap[mailid];

   $.each(allMailArray, function(_index, _mail) {
      if(_mail.id === mailid) {
         delete allMailArray[_index];
         allMailArray.splice(_index,1);
         return false;
      }
   });

   var unreadCount = allMailArray.length;

   if (unreadCount == 0) {
      accountElement.find('.toggleLink').hide('fast');
      accountElement.find('.unreadCount').fadeOut('fast');
	
	  if(!stayOpen) { 
         window.close();
	  }
   } else {
      if (parseInt(unreadCount) >= 20) {
         accountElement.find('.unreadCount').text(unreadCount + "+");
      } else {
         accountElement.find('.unreadCount').text(unreadCount);
      }
   }
}

// Shows a hidden mail in the mailbox
function showMail(mailid) {
   var mailElement = document.getElementById(mailid);
   if (mailElement != null) {
      mailElement.style.display = 'block';
   }

}

function replyTextKeyPress(event, mailid) {
   if (event.shiftKey == 1 && event.keyCode == 13) {
      // User pressed shift-enter inside textarea
      sendReply(mailid);
   }
}

function refreshMail() {   
   $.each(mailAccounts, function (i, account) {
      account.refreshInbox(function () {
         renderAccount(account);         
      });
   });
}

function openOptions() {
   chrome.tabs.create({ url: "options.html" });
   window.close();
}

function resizeWindow() {
   var isExpanded = $('html').width() != 500;

   if (isExpanded)
      contractWindow();
   else
      expandWindow();
}


var animationSpeed = 250;
var previousHeight;
function expandWindow() {
   previousHeight = $('body').height();

   $('html').animate({
      width: [750, 'swing'],
      //height: [500, 'swing']
   }, animationSpeed);

   $('.account').slideUp();
}

function contractWindow() {
   $('html').animate({
      width: [500, 'swing'],
      //height: [previousHeight, 'swing']
   }, animationSpeed);

   $('.account').slideDown();
   previousHeight = 0;
}

function renderMail() {
   // Clear previous content
   $('#content').empty();

   // Loop through each account and render it on the page
   $.each(mailAccounts, function (i, account) {
      account.id = i;
      renderAccount(account);
   });
}

function renderAccount(account) {
   // Remove Existing Entry for Account
   $('[data-account-id="' + account.id + '"]').remove();
   account.getNewAt();

   // Load Account Data
   if (account.getMail() != null) {
      account.unreadCount = account.getMail().length;
   }

   // Append Account to Dropdown Menu
   var sectionAccount = $('#account.template').find('section.account').clone();
   sectionAccount.attr('data-account-id',account.id);
   sectionAccount.find('.inboxLink').text(account.getAddress());
   sectionAccount.find('.unreadCount').text(account.unreadCount);
   sectionAccount.find('.composeLink').attr('title',i18n.get('composeLinkTitle'));
   sectionAccount.find('.sendpageLink').attr('title',i18n.get('sendPageLinkTitle'));
   $("#content").append(sectionAccount);

   // Account Event handlers
   sectionAccount.find(".inboxLink").on('click', function () { 
      openInbox(account.id); 
   });
   sectionAccount.find(".composeLink").on('click', function () { 
      composeNew(account.id); 
   });
   sectionAccount.find(".sendpageLink").on('click', function () { 
      sendPage(account.id); 
   });

   var inboxElement = sectionAccount.find('.container_mail');
   var labels = account.getLabels();

   if (account.getMail() != null) {
      $.each(account.getMail(), function (j, mail) {

         mail.accountId = account.id;

         allMailMap[mail.id] = mail;
         allMailArray.push(mail);

         // Render mail
         var sectionMail = $("#mail.template").find('section.mail').clone();
         sectionMail.attr('data-mail-id',mail.id);
         sectionMail.find('.starLink').attr('title',i18n.get('starLinkTitle'));
         sectionMail.find('.openLink').append(mail.title);
         sectionMail.find('.replyLink').attr('title',i18n.get('replyLinkTitle'));
         sectionMail.find('.archiveLink').attr('title',i18n.get('archiveLinkTitle'));
         sectionMail.find('.deleteLink').attr('title',i18n.get('deleteLink'));
         sectionMail.find('.spamLink').attr('title',i18n.get('spamLink'));
         sectionMail.find('.labelLink').attr('title',i18n.get('showLabelsTitle'));
         sectionMail.find('.importanceLink').attr('title',i18n.get('importanceLinkTitle'));
         sectionMail.find('.author').attr('title',mail.authorName).text(mail.authorName);
         sectionMail.find('dt').attr('title',mail.issued).text(formatDateTime(mail.issued, i18n.selected_lang.months));
         sectionMail.find('.summary .trim').append(mail.summary);

         // Starred Thread
         if (mail.isStarred) {
            sectionMail.find('.starLink .sprite').addClass('active');
         }

         // Important Thread
         if (mail.isImportant) {
            sectionMail.find('.importanceLink .sprite').addClass('active');
         }
         // Add to account element
         inboxElement.append(sectionMail);

         // Mail Event Handlers
         sectionMail.find(".readLink").on('click', function () { 
            readThread(account.id, mail.id); 
         });
         sectionMail.find(".deleteLink").on('click', function () { 
            deleteThread(account.id, mail.id); 
         });
         sectionMail.find(".spamLink").on('click', function () { 
            spamThread(account.id, mail.id); 
         });
         sectionMail.find(".archiveLink").on('click', function () { 
            archiveThread(account.id, mail.id); 
         });
         sectionMail.find(".fullLink").on('click', function () { 
            getThread(account.id, mail.id); 
         });
         sectionMail.find(".summary").on('click', function () { 
            getThread(account.id, mail.id); 
         });
         sectionMail.find(".replyLink").on('click', function () { 
            replyTo(account.id, mail.id); 
         });
         sectionMail.find(".openLink").on('click', function () { 
            openMail(account.id, mail.id); 
         });
         sectionMail.find(".labelLink").on('click',function () { 
            var labelLink = this;
            var labelList = $('<ul>');
            labelList.addClass('labels');
            labelList.prepend('<li><strong>' + i18n.get('showLabelsTitle') + '</strong></li>');

            $.each(labels, function(index, value) {
               var labelElement = $('<li>');
               labelElement.text(value);
               labelElement.on('click', function () {
                  applyLabelToThread(account.id, mail.id, value);
                  $(labelLink).qtip('api').hide();
               });
               labelList.append(labelElement);
            });

            $(this).qtip( $.extend({}, tooltips, { 
               content: labelList,
               show: {
                  ready: true,
                  event: 'click'
               },
               hide: {
                  event: 'click mouseleave'
               }
            }));
         });
         sectionMail.find(".starLink").on('click',function () { 
            sprite_star = $(this).find(".sprite");
            if (sprite_star.hasClass('active')) {
               starThread(account.id, mail.id, false, function () {
                  sprite_star.removeClass('active');
               });
            } else {
               starThread(account.id, mail.id, true, function () {
                  sprite_star.addClass('active');
               });
            }      
         });
         sectionMail.find(".importanceLink").on('click',function () { 
            sprite_importance = $(this).find(".sprite");
            if (sprite_importance.hasClass('active')) {
               importanceThread(account.id, mail.id, false, function () {
                  sprite_importance.removeClass('active');
               });
            } else {
               importanceThread(account.id, mail.id, true, function () {
                  sprite_importance.addClass('active');
               });
            }      
         });
         
      });

      // Account Toggle Arrows
      if (account.getMail().length == 0)
         inboxElement.find(".toggleLink").hide();

      inboxElement.find(".toggleLink").on('click', function () {
         inboxElement.find('.mail').slideToggle('fast');

         if ($(this).find('img').attr('src') == 'assets/img/arrow_right.png') {
            $(this).find('img').attr('src', 'assets/img/arrow_down.png')
         } else {
            $(this).find('img').attr('src', 'assets/img/arrow_right.png')
         }
      });
   }
}

$(document).ready(function () {
   var unreadCount = 0;
   allMailMap = {};
   allMailArray = new Array();

   $.each(mailAccounts, function (i, account) {
      unreadCount += account.getUnreadCount();
   });

   backgroundPage.stopAnimateLoop();

   renderMail();

   $('#refresh').attr('title', i18n.get('refreshLinkTitle')).on('click', function () {
      refreshMail();
   });
   $('#options').attr('title', i18n.get('optionsLinkTitle')).on('click', function () {
      openOptions();
   });

   // Tooltips
   $('a[title]').qtip(tooltips);
});
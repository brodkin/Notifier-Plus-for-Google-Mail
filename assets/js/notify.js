var mailAccount;
var backgroundPage = chrome.extension.getBackgroundPage();
var Settings = backgroundPage.getSettings();

$(document).ready(function () {
   mailAccount = backgroundPage.accountWithNewestMail;
   mailAccount.id = backgroundPage.accounts.indexOf(mailAccount);
   var mail = backgroundPage.accountWithNewestMail.getNewestMail();
   var mailURL = backgroundPage.accountWithNewestMail.getURL();
   var profilePhotos = backgroundPage.profilePhotos;

   var fullDateTime = mail.issued.toLocaleString();
   var datetime = formatDateTime(mail.issued, i18n.selected_lang.months);

   var sectionMail = $('section.mail');

   // Mail Data
   $(".inboxLink").text(mailAccount.getAddress());
   sectionMail.find(".openLink").append(mail.title);
   sectionMail.find(".author").text(mail.authorName);
   sectionMail.find("dt").text(formatDateTime(mail.issued, i18n.selected_lang.months));
   sectionMail.find(".summary .trim").append(mail.summary);

   // Mail Event Handlers
   sectionMail.find(".deleteLink").on('click', function () { 
      deleteMail(); 
   });
   sectionMail.find(".spamLink").on('click', function () { 
      spamMail(); 
   });
   sectionMail.find(".archiveLink").on('click', function () { 
      archiveMail(); 
   });
   sectionMail.find(".summary").on('click', function () { 
      openMail();
   });
   sectionMail.find(".openLink").on('click', function () { 
      openMail(); 
   });
});

// Opens a mail and closes this window
function openMail() {
   window.close();
   mailAccount.openNewestMail();
}
// Marks mail as read and closes this window
function readMail() {
   window.close();
   mailAccount.readNewestMail();
}
// Deletes mail and closes this window
function deleteMail() {
   window.close();
   mailAccount.deleteNewestMail();
}
// Marks mail as spam and closes this window
function spamMail() {
   window.close();
   mailAccount.spamNewestMail();
}
// Archives mail and closes this window
function archiveMail() {
   window.close();
   mailAccount.archiveNewestMail();
}
// Star mail
function starMail() {
   mailAccount.starNewestMail();
}
// Star mail
function openInbox() {
   mailAccount.openInbox();
}
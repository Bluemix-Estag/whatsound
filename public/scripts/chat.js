//var isOpen = false;
//function popupToggle(){
//    var popup = document.getElementById("chat-popup");
//    if(isOpen){
//        popup.style.animationName = "popup_close";
//        isOpen = false;
//    }else{
//        popup.style.animationName = "popup_open";
//        isOpen = true;
//    }
//}
$(document).ready(function () {
    var message = $('#message');
    var isOpen = false;
    $('.chat-header').click(function () {
        if (isOpen) {
            isOpen = false;
            $('.chat-popup').css({
                "animation-name": "popup_close"
            });
            $('.chat-body').css({
                "animation-name": "hide_chat"
            });
            $('.chat-footer').css({
                "animation-name": "hide_chat"
            });
        }
        else {
            isOpen = true;
            $('.chat-popup').css({
                "animation-name": "popup_open"
            });
            $('.chat-body').css({
                "animation-name": "show_chat"
            });
            $('.chat-footer').css({
                "animation-name": "show_chat"
            });
        }
    });

    message.focus();
});


var params = {},
    watson = 'Watson',
    context;

function userMessage(message) {

    params.text = message;
    if (context) {
        params.context = context;
    }
    var xhr = new XMLHttpRequest();
    // var uri = 'https://whatsound-orchestrator.mybluemix.net/WhatSound';
    var uri = 'https://whatsound-orchestrator.mybluemix.net/WhatSound';
    xhr.open('POST', uri, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
        // Verify if there is a success code response and some text was sent
        if (xhr.status === 200 && xhr.responseText) {
            var response = JSON.parse(xhr.responseText);
            text = response.output.text; // Only display the first response
            context = response.context; // Store the context for next round of questions
            console.log("Got response from Ana: ", JSON.stringify(response));

            if (context.clipeID) {
              displayMessage('', watson);
            }
            for (var txt in text) {
                displayMessage(text[txt], watson);
            }

        }
        else {
            console.error('Server error for Conversation. Return status of: ', xhr.statusText);
            displayMessage("Putz, deu um tilt aqui.", watson);
        }
    };
    xhr.onerror = function () {
        console.error('Network error trying to send message!');
        context= {};
        // userMessage('');
        displayMessage("Ops, acho que meu cérebro está offline. Espera um minutinho para continuarmos por favor.", watson);
    };
    console.log(JSON.stringify(params));
    xhr.send(JSON.stringify(params));
}

function newEvent(event) {
    // Only check for a return/enter press - Event 13
    if (event.which === 13 || event.keyCode === 13) {
        var userInput = document.getElementById('message');
        text = userInput.value; // Using text as a recurring variable through functions
        text = text.replace(/(\r\n|\n|\r)/gm, ""); // Remove erroneous characters
        // If there is any input then check if this is a claim step
        // Some claim steps are handled in newEvent and others are handled in userMessage
        if (text) {
            // Display the user's text in the chat box and null out input box
            //            userMessage(text);
            displayMessage(text, 'user');
            userInput.value = '';
            userMessage(text);
        }
        else {
            // Blank user message. Do nothing.
            console.error("No message.");
            userInput.value = '';
            return false;
        }
    }
}

var count = 1;
function appendHTMLWithScroll(parent, html) {
  parent.css('height', 'auto');
  parent.append($(html));
  parent.css('height', parent.height() + 'px');

  var maxHeight = $('#video-background').height();
  maxHeight -= 240;
  parent.css('max-height', maxHeight + 'px');

  var obj = document.getElementById(parent.attr('id'));
  parent.animate({scrollTop: obj.scrollHeight}, 400);
}

function spotifyTrackHTML(uri) {
  var actions = $('#actions');
  var html = '<div class="actions-content last-action animated lightSpeedIn">';

  uri = 'https://open.spotify.com/embed?uri=' + uri;
  html += '<div class="track">';
  html += '<iframe src="' + uri + '" width="300" height="80" frameborder="0" allowtransparency="true"></iframe>';

  html += '</div>';
  html += '</div>';

  return html;
}

function spotifyArtistHTML(id, topTrackURI) {
  var actions = $('#actions');
  var html = '<div class="actions-content last-action animated lightSpeedIn">';

  var uri = 'https://embed.spotify.com/follow/1/?uri=spotify:artist:' + id + '&size=detail&theme=dark';
  html += '<div class="artist">';
  html += '<iframe src="' + uri + '" width="300" height="56" scrolling="no" frameborder="0" style="border:none; overflow:hidden;" allowtransparency="true"></iframe>';

  var uriTrack = 'https://open.spotify.com/embed?uri=' + topTrackURI;
  html += '<iframe class="toptrack" src="' + uriTrack + '" width="300" height="80" frameborder="0" allowtransparency="true"></iframe>';

  html += '</div>';
  html += '</div>';

  return html;
}

function spotifyAlbumHTML(id) {
  var actions = $('#actions');
  var html = '<div class="actions-content last-action animated lightSpeedIn">';

  var uri = 'https://open.spotify.com/embed?uri=spotify:album' + id;
  html += '<div class="album">';
  html += '<iframe src="' + uri + '" width="300" height="380" frameborder="0" allowtransparency="true"></iframe>';

  html += '</div>';
  html += '</div>';

  return html;
}

function vagalumeHTML(track) {
  var html = '<div class="actions-content last-action animated lightSpeedIn">';
  html += '<div class="lyric">';
  html += track;
  html += '</div>';
  html += '</div>';
  return html;
}

function messageHTML(text, user) {
  var date = new Date();
  var html = '<div class="chat-content">';

  if (user == "user") {
    count += 1;
    html += '<div class="user animated fadeInUp">';
  }else {
    html += '<div class="watson animated fadeInUp">';
  }
      html += '<div class="chat-message">';
        html += text;
      html += '</div>';
      html += '<div class="chat-date">';
        html += date.getHours() + ':' + date.getMinutes();
      html += '</div>';
    html += '</div>';
  html += '</div>';

  return html;
}

function actionAppended() {
  $('#actions').css('width', ($('body').width() - $('#chat').width()) + 'px');
  $('.last-action').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    $('#actions').css('width', '350px');
  });
}

function youtubeHTML(src) {
  $('#clip').css('display', 'block');

  $('#clip').removeClass('animated fadeIn100');
  $('#clip').addClass('animated fadeOut');

  $('#clip').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    $('#clip').removeClass('animated fadeOut');

    $('#clip').attr('src', 'about:blank');

    $('#clip').attr('src', src);

    $('#clip').load(function() {
      $('#clip').addClass('animated fadeIn100');
    });
  });

  $('#video-background video').addClass('animated fadeOut');
  $('#video-background video').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    $('#video-background video').css('display', 'none');
  });
}

function displayMessage(text, user) {
  if (context != null) {
    if (context.iframeTrack) {
      console.log("ENTROUUUUUUU AQUIIIIIII BOA");
      $('.last-action').first().removeClass('last-action');

      var actions = $('#actions');
      var html = spotifyTrackHTML(context.trackURI);
      appendHTMLWithScroll(actions, html);
      actionAppended();

      delete context.iframeTrack;
    }

    if (context.clipeID) {
      var clipeID = context.clipeID;
      delete context.clipeID;
      youtubeHTML('https://www.youtube.com/embed/' + clipeID + '?autoplay=1&showinfo=0&controls=0');
    }

    if (context.albumTracks && context.isAlbum) {
      $('.last-action').first().removeClass('last-action');

      var id = context.albumID;
      var actions = $('#actions');
      var html = spotifyAlbumHTML(id);
      appendHTMLWithScroll(actions, html);
      actionAppended();

      delete context.isAlbum;
    }

    if (context.artistAlbums && context.isArtist) {
      $('.last-action').first().removeClass('last-action');

      var actions = $('#actions');
      var html = spotifyArtistHTML(context.artistID, context.artistTopTracks[0].uri);

      appendHTMLWithScroll(actions, html);
      actionAppended();

      delete context.isArtist;
    }

    if (context.showLyrics) {
        var actions = $('#actions');
        var html = vagalumeHTML(context.showLyrics);
        context = {};
        appendHTMLWithScroll(actions, html);
        actionAppended();


    }

    if (context.suggestion) {
      youtubeHTML('https://www.youtube.com/embed/?listType=search&list=' + context.showSuggestions[Math.floor((Math.random()*4)+1)] + '&autoplay=1&showinfo=0&controls=0');
      context = {};
    }

    if (context.video && context.videoSearch) {
      youtubeHTML('https://www.youtube.com/embed/?listType=search&list=' + context.videoSearch + '&autoplay=1&showinfo=0&controls=0');
      context = {};
    }
  }

  if(text != ''){
    var chat = $('#chat-body');
    var html = messageHTML(text, user)
    appendHTMLWithScroll(chat, html);
  }
}


userMessage('');

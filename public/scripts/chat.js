$(document).ready(function() {
    let WEBSOCKET_URL = 'ws://red-orchestrator.mybluemix.net/ws/chat';
    let WATSON = 'watson';
    let USER = 'user';
    let ChatProcedures = {
        SHOW_TRACK: 'SHOW_TRACK',
        SHOW_ARTIST: 'SHOW_ARTIST',
        SHOW_ALBUM: 'SHOW_ALBUM',
        SHOW_CLIP: 'SHOW_CLIP',
        SHOW_LYRIC: 'SHOW_LYRIC',
        SHOW_PLAYLIST: 'SHOW_PLAYLIST',
        SHOW_TEXT: 'SHOW_TEXT',
        SHOW_BANNER: 'SHOW_BANNER'
    };

    /* INTERFACE OBJECT */
    var message = $('#message');
    var chat = $('#chat');
    var chatBody = $('#chat-body');
    var actions = $('#actions');

    $(window).resize(function() {
        updateConstraints();
    })

    /* CLASSES */
    function Procedure(name, params) {
        this.name = name;
        this.params = params;
    }

    /* INIT WEBSOCKET */
    var websocket = new WebSocket(WEBSOCKET_URL);
    websocket.onopen = function(ev) {
        websocket.send('oi');

        /*** FIX ME - DEV ONLY ***/
        $.getJSON('/stub/show_album.json', function(data) {
            // displayContentFromData(data);
            //
            // displayContentFromData('{"text": ["Lorem ipsum.", "Lorem ipsum dolor sit amet, porro.", "Lorem ipsum dolor sit amet, ut vim veniam recusabo partiendo. Ad etiam efficiantur ius. Vis tota instructior ea, wisi tibique delicata no sed. Ullum utroque denique ad vim."],"procedures": [{"name": "SHOW_TRACK","params": {"name": "Shape of You","artist": "Ed Sheeran","album": "Shape of You","uri": "spotify:track:0FE9t6xYkqWXU2ahLh6D8X","url":"https://open.spotify.com/track/0FE9t6xYkqWXU2ahLh6D8X","genres": ["pop"]}}]}');
            //
            // $.getJSON('/stub/show_lyric.json', function(data) {
            //     displayContentFromData(data);
            // });
            //
            // $.getJSON('/stub/show_artist.json', function(data) {
            //     displayContentFromData(data);
            // });
            //
            // $.getJSON('/stub/show_clip.json', function(data) {
            //     displayContentFromData(data);
            // });
        });
    }

    websocket.onclose = function(event) {}

    websocket.onmessage = function(event) {
        console.log(event.data);
        displayContentFromData(event.data);
    }

    /* EVENTS */
    message.keypress(function(event) {
        if (event.which === 13 || event.keyCode === 13) {
            event.preventDefault();

            var userInput = document.getElementById(message.attr("id"));
            text = userInput.value; // Using text as a recurring variable through functions
            text = text.replace(/(\r\n|\n|\r)/gm, ""); // Remove erroneous characters
            // If there is any input then check if this is a claim step
            // Some claim steps are handled in newEvent and others are handled in userMessage
            if (text) {
                // Display the user's text in the chat box and null out input box

                var procedure = new Procedure(ChatProcedures.SHOW_TEXT, {
                    text: text
                });
                displayContent(USER, procedure);
                userInput.value = '';
                websocket.send(text);
            } else {
                // Blank user message. Do nothing.
                console.error("No message.");
                userInput.value = '';
                return false;
            }
        }
    });

    /* CHAT */
    function displayContentFromData(data) {
        var json = data;
        if (typeof data == 'string') {
            json = JSON.parse(data);
        }

        for (var i = 0; i < json.text.length; i++) {
            var text = json.text[i];
            var procedure = new Procedure(ChatProcedures.SHOW_TEXT, {
                text: text
            });
            displayContent(WATSON, procedure);
        }

        if (json.procedures != null) {
          for (var i = 0; i < json.procedures.length; i++) {
              var procedure = json.procedures[i];
              displayContent(WATSON, procedure);
          }
        }
    }

    function displayContent(source, procedure) {
        if (source == WATSON) {
            switch (procedure.name) {
                case ChatProcedures.SHOW_TRACK:
                    showTrack(procedure.params)
                    break;
                case ChatProcedures.SHOW_ARTIST:
                    showArtist(procedure.params)
                    break;
                case ChatProcedures.SHOW_ALBUM:
                    showAlbum(procedure.params)
                    break;
                case ChatProcedures.SHOW_CLIP:
                    showClip(procedure.params)
                    break;
                case ChatProcedures.SHOW_LYRIC:
                    showLyric(procedure.params)
                    break;
                case ChatProcedures.SHOW_PLAYLIST:
                    showPlaylist(procedure.params)
                    break;
                case ChatProcedures.SHOW_TEXT:
                    showText(source, procedure.params)
                    break;
                case ChatProcedures.SHOW_BANNER:
                    showBanner(procedure.params)
                    break;
                default:
                    break;
            }
        } else {
            showText(source, procedure.params)
        }
    }

    function showTrack(params) {
        $('.last-action').first().removeClass('last-action');
        var actions = $('#actions');
        var html = spotifyTrackHTML(params.uri);
        appendHTMLWithScroll(actions, html);
    }

    function showArtist(params) {
        $('.last-action').first().removeClass('last-action');

        var actions = $('#actions');
        var html;
        if (params.topTracks.length > 0) {
            html = spotifyArtistHTML(params.id, params.topTracks[0].uri);
        } else {
            html = spotifyArtistHTML(params.id, null);
        }

        appendHTMLWithScroll(actions, html);
    }

    function showAlbum(params) {
        $('.last-action').first().removeClass('last-action');

        var actions = $('#actions');
        var html = spotifyAlbumHTML(params.id);
        appendHTMLWithScroll(actions, html);
    }

    function showClip(params) {
        var url = 'https://www.youtube.com/embed/' + params[0].id + '?autoplay=1&showinfo=0&controls=0';
        youtubeHTML(url);
    }

    function showLyric(params) {
        var actions = $('#actions');
        var html = vagalumeHTML(params.lyrics.track);
        appendHTMLWithScroll(actions, html);
    }

    function showText(source, params) {
        if (params.text != '') {
            var chat = $('#chat-body');
            var html = messageHTML(params.text, source)
            appendHTMLWithScroll(chat, html);
            updateConstraints();
        }
    }

    function showPlaylist(params) {}

    function showBanner(params) {}

    /* INTERFACE FUNCTIONS */
    function appendHTMLWithScroll(element, html) {
        element.append($(html));

        var obj = document.getElementById(element.attr('id'));
        element.animate({
            scrollTop: obj.scrollHeight
        }, 400);
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

        if (topTrackURI != null) {
            var uriTrack = 'https://open.spotify.com/embed?uri=' + topTrackURI;
            html += '<iframe class="toptrack" src="' + uriTrack + '" width="300" height="80" frameborder="0" allowtransparency="true"></iframe>';
        }

        html += '</div>';
        html += '</div>';

        return html;
    }

    function spotifyAlbumHTML(id) {
        var actions = $('#actions');
        var html = '<div class="actions-content last-action animated lightSpeedIn">';

        var uri = 'https://open.spotify.com/embed?uri=spotify:album:' + id;
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
            html += '<div class="user animated fadeInUp">';
        } else {
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

    function updateConstraints() {
        actions.height($('#container').height());
        if (chat.height() <= $('#container').height()) {
          chat.css('margin-top', 'auto');
        }else {
          chat.height($('#container').height());
          chatBody.css('max-height', (chat.height() - 59) + 'px');
          chat.css('margin-top', '0');
        }
    }

    message.focus();
    updateConstraints();
});

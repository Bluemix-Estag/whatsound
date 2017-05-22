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
    var container = $('#container');
    var message = $('#message');
    var chat = $('#chat');
    var chatBody = $('#chat-body');
    var actions = $('#actions');

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
        //         $.getJSON('/stub/show_album.json', function(data) {
        //             displayContentFromData(data);
        //
        //             displayContentFromData('{"text": ["Lorem ipsum.", "Lorem ipsum dolor sit amet, porro.", "Lorem ipsum dolor sit amet, ut vim veniam recusabo partiendo. Ad etiam efficiantur ius. Vis tota instructior ea, wisi tibique delicata no sed. Ullum utroque denique ad vim."],"procedures": [{"name": "SHOW_TRACK","params": {"name": "Shape of You","artist": "Ed Sheeran","album": "Shape of You","uri": "spotify:track:0FE9t6xYkqWXU2ahLh6D8X","url":"https://open.spotify.com/track/0FE9t6xYkqWXU2ahLh6D8X","genres": ["pop"]}}]}');
        //
        //             $.getJSON('/stub/show_lyric.json', function(data) {
        //                 displayContentFromData(data);
        //             });
        //
        //             $.getJSON('/stub/show_artist.json', function(data) {
        //                 displayContentFromData(data);
        //             });

        //             $.getJSON('/stub/show_clip.json', function(data) {
        //                displayContentFromData(data);
        //            });
        //         });
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
        $('.last-chat-action').first().removeClass('last-chat-action');

        var actions = $('#actions');
        var html = spotifyTrackHTML(params.uri);
        appendHTMLWithScroll(actions, html);

        var chat = $('#chat-body');
        html = spotifyTrackHTML(params.uri, 'actions-content chat-action last-chat-action animated fadeInUp');
        appendHTMLWithScroll(chat, html);
    }

    function showArtist(params) {
        $('.last-action').first().removeClass('last-action');
        $('.last-chat-action').first().removeClass('last-chat-action');

        var actions = $('#actions');
        var chat = $('#chat-body');

        var html;
        var htmlChat;
        if (params.topTracks.length > 0) {
            html = spotifyArtistHTML(params.id, params.topTracks[0].uri);
            htmlChat = spotifyArtistHTML(params.id, params.topTracks[0].uri, 'actions-content chat-action last-chat-action animated fadeInUp');
        } else {
            html = spotifyArtistHTML(params.id);
            htmlChat = spotifyArtistHTML(params.id, null, 'actions-content chat-action last-chat-action animated fadeInUp');
        }
        appendHTMLWithScroll(actions, html);
        appendHTMLWithScroll(chat, htmlChat);
    }

    function showAlbum(params) {
        $('.last-action').first().removeClass('last-action');
        $('.last-chat-action').first().removeClass('last-chat-action');

        var actions = $('#actions');
        var html = spotifyAlbumHTML(params.id);
        appendHTMLWithScroll(actions, html);

        var chat = $('#chat-body');
        html = spotifyAlbumHTML(params.id, 'actions-content chat-action last-chat-action animated fadeInUp');
        appendHTMLWithScroll(chat, html);
    }

    function showClip(params) {
        var url = 'https://www.youtube.com/embed/' + params[0].id + '?autoplay=1&showinfo=0&controls=0';
        youtubeHTML(url);
    }

    function showLyric(params) {
        var actions = $('#actions');
        var html = vagalumeHTML(params.lyrics.track);
        appendHTMLWithScroll(actions, html);

        var chat = $('#chat-body');
        html = vagalumeHTML(params.lyrics.track, 'actions-content chat-action animated fadeInUp');
        appendHTMLWithScroll(chat, html);
    }

    function showText(source, params) {
        if (params.text != '') {
            var chat = $('#chat-body');
            var html = messageHTML(params.text, source)
            appendHTMLWithScroll(chat, html);

            //            if ($('.last-action').attr('data-show') == null) {
            //                if (params.text == 'sim') {
            //                    $('.last-action').attr('data-show', 'yes');
            //
            //                    var actions = $('#actions');
            //                    var obj = document.getElementById(actions.attr('id'));
            //                    actions.stop();
            //                    actions.animate({
            //                        scrollTop: obj.scrollHeight
            //                    }, 400);
            //                } else if (params.text == 'nao' || params.text == 'não') {
            //                    $('.last-action').attr('data-show', 'no');
            //                }
            //            }
            //
            //            if ($('.last-chat-action').attr('data-show') == null) {
            //                if (params.text == 'sim') {
            //                    $('.last-chat-action').attr('data-show', 'no');
            //                } else if (params.text == 'nao' || params.text == 'não') {
            //                    $('.last-chat-action').attr('data-show', 'yes');
            //                }
            //            }
        }
    }

    function showPlaylist(params) {}

    function showBanner(params) {}

    /* INTERFACE FUNCTIONS */
    function appendHTMLWithScroll(element, html) {
        var child = $(html);
        element.append(child);

        var obj = document.getElementById(element.attr('id'));
        if (obj.clientHeight - obj.scrollHeight != 0) {
            element.stop().animate({
                scrollTop: obj.scrollHeight
            }, 250, 'swing');
        }
    }

    function spotifyTrackHTML(uri, attrClass) {
        var actions = $('#actions');

        var html = '<div class="actions-content last-action animated lightSpeedIn">';
        if (attrClass != null) {
            html = '<div class="' + attrClass + '">';
        }

        uri = 'https://open.spotify.com/embed?uri=' + uri;
        html += '<div class="track">';
        html += '<iframe src="' + uri + '" width="300" height="80" frameborder="0" allowtransparency="true"></iframe>';

        html += '</div>';
        html += '</div>';

        return html;
    }

    function spotifyArtistHTML(id, topTrackURI, attrClass) {
        var actions = $('#actions');
        var html = '<div class="actions-content last-action animated lightSpeedIn">';
        if (attrClass != null) {
            html = '<div class="' + attrClass + '">';
        }

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

    function spotifyAlbumHTML(id, attrClass) {
        var actions = $('#actions');
        var html = '<div class="actions-content last-action animated lightSpeedIn">';
        if (attrClass != null) {
            html = '<div class="' + attrClass + '">';
        }

        var uri = 'https://open.spotify.com/embed?uri=spotify:album:' + id;
        html += '<div class="album">';
        html += '<iframe src="' + uri + '" width="300" height="380" frameborder="0" allowtransparency="true"></iframe>';

        html += '</div>';
        html += '</div>';

        return html;
    }

    function vagalumeHTML(track, attrClass) {
        var html = '<div class="actions-content last-action animated lightSpeedIn">';
        if (attrClass != null) {
            html = '<div class="' + attrClass + '">';
        }
        html += '<div class="lyric">';
        html += track;
        html += '</div>';
        html += '</div>';
        return html;
    }

    function messageHTML(text, user) {
        var date = new Date();
        var html = '';

        if (user == "user") {
            html += '<div class="chat-content-user">';
            html += '<div class="user animated fadeIn">';
        } else {
            html += '<div class="chat-content-watson">';
            html += '<div class="watson animated fadeIn">';
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

    message.focus();
});

$(document).ready(function() {
    let location = window.location.href;
    let locationParams = getLocationParams()

    let MESSAGE_INVALID_URL = 'ALGO DE ERRADO NA URL NÃO ESTÁ CERTO!';

    let HASHTAG_IBM100ANOS = 'IBM100ANOS';
    let URL_100ANOS = 'https://whatsound-playlist.mybluemix.net/whatsound/api/v1/playlist/ranking';
    let URL_RESET_TRACK_RANKING = 'http://whatsound-playlist.mybluemix.net/whatsound/api/v1/ranking/update?query=';

    let HASHTAG_THESTREAM = 'THESTREAM';
    let URL_THESTREAM = 'https://whatsound-playlist.mybluemix.net/whatsound/api/v1/setlist';
    let URL_RESET_TRACK_SETLIST = 'http://whatsound-playlist.mybluemix.net/whatsound/api/v1/setlist/update?query=';

    var HASHTAG_PLAYLIST;
    if (locationParams.hashtag.toUpperCase() == HASHTAG_IBM100ANOS) {
        HASHTAG_PLAYLIST = HASHTAG_IBM100ANOS;
    } else if (locationParams.hashtag.toUpperCase() == HASHTAG_THESTREAM) {
        HASHTAG_PLAYLIST = HASHTAG_THESTREAM;
    }
    let URL_PLAYLIST = HASHTAG_PLAYLIST == HASHTAG_IBM100ANOS ? URL_100ANOS : URL_THESTREAM;
    let URL_RESET_TRACK = HASHTAG_PLAYLIST == HASHTAG_IBM100ANOS ? URL_RESET_TRACK_RANKING : URL_RESET_TRACK_SETLIST;

    let RANKING_TYPE = "RANKING";
    let SETLIST_TYPE = "SETLIST";
    var PLAYLIST_TYPE;
    if (locationParams.type.toUpperCase() == RANKING_TYPE) {
        PLAYLIST_TYPE = RANKING_TYPE;
    } else if (locationParams.type.toUpperCase() == SETLIST_TYPE) {
        PLAYLIST_TYPE = SETLIST_TYPE;
    }

    function isRanking() {
        return PLAYLIST_TYPE == RANKING_TYPE;
    }

    function isSetlist() {
        return PLAYLIST_TYPE == SETLIST_TYPE;
    }

    let APPID = '238762';
    let CHANNEL_URL = 'channel.html';
    let PLACEHOLDER_IMG_TWITTER = 'http://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png';

    function getTrackURL(id) {
        return 'https://musicdeezer-api.mybluemix.net/whatsound/api/v1/deezer/track/info/values?query=' + id;
    }

    /*** INTERFACE ***/
    var needLoadRanking = true;

    let playlistView = $('#playlist section');
    let maxHeight = ($('body').height() - 25 - playlistView.position().top - parseInt(playlistView.css('padding-top').replace('px', '')));
    if (maxHeight > $('body').height() - 50) {
        maxHeight = $('body').height() - 50;
    }
    playlistView.css('max-height', maxHeight + 'px');

    let loungeView = $('#lounge section');
    loungeView.css('max-height', ($('body').height() - 75 - loungeView.position().top - parseInt(loungeView.css('padding-top').replace('px', ''))) + 'px');

    let rankingView = $('#ranking section');

    let background = $('#background');
    let nowPlayingContent = $("#now-playing .content");
    let nowPlayingPlayer = $("#now-playing .content #player");

    let nextTrackView = $("#now-playing #next-track");

    /*** INVALID URL ***/
    if (HASHTAG_PLAYLIST == null || PLAYLIST_TYPE == null) {
        $('footer').html(MESSAGE_INVALID_URL);
        $('footer').css('background', 'rgba(220, 0, 0, 0.75)');
        return;
    }

    /*** TIMER ***/
    var firstUpdate = true;
    var timer;
    var delay = 10;

    /*** DATASOURCE ***/
    var updatingData = false;
    var firstRequest = true;
    var tracks;
    var tweets;

    /*** DEEZER ***/
    var firstTrack = true;
    var currentTrack;
    var nextTrack;

    DZ.init({
        appId: APPID,
        channelUrl: CHANNEL_URL,
        player: {
            container: 'player',
            cover: true,
            width: 380,
            height: 380,
            format: 'square',
            autoplay: true,
            playlist: false,
            color: 'ffffff',
            layout: 'dark',
            size: 'medium',
            type: 'tracks',
            onload: function() {
                if (isSetlist()) {
                    DZ.player.pause();
                } else {
                    DZ.player.play();
                }
            }
        }
    });

    DZ.Event.subscribe('player_play', function(evt_name) {
        console.log("Player is playing");
        if (isSetlist()) {
            DZ.player.setMute();
            DZ.player.pause();
        }
    });

    DZ.Event.subscribe('current_track', function(track, evt_name) {
        console.log("Currently playing track", track);

        showPlayer();
        if (firstTrack) {
            firstTrack = false;
            getDataFromTrackId(track.track.id);
        } else {
            hideBackground(function() {
                getDataFromTrackId(track.track.id);
            });
        }
    });

    DZ.Event.subscribe('track_end', function(track, evt_name) {
        console.log("Currently playing track (track_end)", track);
        popTrack();
    });

    function addFirstTracksWithIds(ids) {
        if (isSetlist()) {
            DZ.player.playTracks(ids, false);
        } else {
            DZ.player.playTracks(ids);
        }
    }

    function addTrackWithId(ids) {
        DZ.player.addToQueue(ids);
    }

    function popTrack(completion) {
        clearInterval(timer);

        let track = tracks.shift();
        currentTrack = nextTrack;
        nextTrack = track;
        addTrackWithId([nextTrack.id]);
        showNextTrackToId(nextTrack.id, false);
        resetTrack(nextTrack, function() {
            refreshData();
            startTimer();
        })
    }

    function resetTrack(track, completion) {
        $.post(URL_RESET_TRACK + track.id, function(data) {
            if (completion != null) {
                completion();
            }
        });
    }

    function getDataFromTrackId(id) {
        $.get(getTrackURL(id), function(data) {
            $('<img src="' + data.album.cover_xl + '">').one('load', function() {
                changeBackgroundToURL(data.album.cover_xl);
                showBackground();
            });
        });
    }

    /*** URL PARAMETERS ***/
    function getLocationParams() {
        var search = window.location.search.replace('?', '').split('&');
        var params = {};
        for (var i = 0; i < search.length; i++) {
            var key = search[i].split('=')[0];
            var value = search[i].split('=')[1];
            params[key] = value
        }
        return params;
    }

    /*** INTERFACE ***/
    function changeBackgroundToURL(url) {
        background.css('background', 'url(' + url + ') no-repeat center center fixed');
        background.css('-webkit-background-size', 'cover');
        background.css('-moz-background-size', 'cover');
        background.css('-o-background-size', 'cover');
        background.css('background-size', 'cover');
    }

    function update() {
        if (firstUpdate) {
            firstUpdate = false;
            refreshData();
            startTimer();
        } else {
            console.log('### update ###', new Date());
            clearInterval(timer);
            verifyData();
        }
    }

    function startTimer() {
        timer = setInterval(function() {
            update();
        }, delay * 1000);
    }

    function updateInterface() {
        playlistView.html('');
        for (var i = 0; i < tracks.length; i++) {
            var track = tracks[i];
            var html = htmlToTrack(track);

            var trackObj = $(html);
            trackObj.appendTo(playlistView);

            var playlistViewObj = playlistView.get(0);
            if (playlistViewObj.scrollHeight >= parseInt(playlistView.css('max-height').replace('px', ''))) {
                trackObj.remove();
                break;
            } else {
                showTrackPlaylist(trackObj)
                addFrameToIdAtTrackElement(track.id, trackObj);
            }
        }

        addMarquee();

        $('#playlist .playlist-track .track-frame .track-tweets img').on('error', function() {
            $(this).attr('src', PLACEHOLDER_IMG_TWITTER);
        })

        loungeView.html('');
        for (var i = 0; i < tweets.length; i++) {
            var tweet = tweets[i];
            console.log(tweet);
            var html = '';
            html += '<div class="tweet">';
            html += '<img src="' + tweet.photo + '" />';
            html += '<div class="tweet-info">';
            html += '<p class="tweet-username">' + tweet.nameDisplay + '</p>';
            html += '<p class="tweet-nickname">@' + tweet.nameUser + '</p>';
            html += '<p class="tweet-message">' + tweet.tweet + '</p>';
            html += '</div>';
            html += '</div>';

            var tweetObj = $(html);
            tweetObj.appendTo(loungeView);

            var loungeViewObj = loungeView.get(0);
            if (loungeViewObj.scrollHeight >= parseInt(loungeView.css('max-height').replace('px', ''))) {
                tweetObj.remove();
                break;
            }
        }
        showLounge();

        if (needLoadRanking) {
            needLoadRanking = false;

            var duration;
            rankingView.html('');
            for (var i = 0; i < tracks.length; i++) {
                var track = tracks[i];
                var htmlObj = $('<p>#' + (i + 1) + ' | ' + track.name + ' (' + track.votes + ' votos)</p>');
                rankingView.append(htmlObj);
                if (i == 50) {
                    break;
                }
                duration = 25000 - (i * 100);
            }

            rankingView.marquee({
                duration: duration,
                delayBeforeStart: 5000,
                gap: 0,
                duplicated: false
            });

            rankingView.bind('finished', function() {
                rankingView.marquee('pause');
                rankingView.html('');
                needLoadRanking = true;
            });
        }
    }

    /*** ANIMATIONS ***/
    function showBackground() {
        background.removeClass('animated fadeOut bounceOut');
        background.addClass('animated fadeIn bounceIn');
    }

    function hideBackground(completion) {
        background.removeClass('animated fadeIn bounceIn');
        background.addClass('animated fadeOut bounceOut');
        background.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
            if (completion != null) {
                completion();
            }
        });
    }

    function showPlayer() {
        nowPlayingPlayer.css('opacity', '1');

        nowPlayingContent.removeClass('animated fadeOut')
        nowPlayingContent.addClass('animated fadeIn');
    }

    function hidePlayer() {
        nowPlayingContent.removeClass('animated fadeIn')
        nowPlayingContent.addClass('animated fadeOut');
    }

    function showNextTrack() {
        nextTrackView.removeClass('animated bounceOutLeft');
        nextTrackView.addClass('animated bounceInLeft');
        addMarquee();
    }

    function hideNextTrack(completion) {
        nextTrackView.removeClass('animated bounceInLeft');
        nextTrackView.addClass('animated bounceOutLeft');
        nextTrackView.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
            if (completion != null) {
                completion();
            }
        });
    }

    function showTrackPlaylist(trackObj) {
        trackObj.removeClass('animated fadeOutDown');
        trackObj.addClass('animated fadeInUp');
    }

    function showPlaylist(completion) {
        $('#playlist section .playlist-track').removeClass('animated fadeOutDown');
        $('#playlist section .playlist-track').addClass('animated fadeInUp');
        $('#playlist section .playlist-track').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
            if (completion != null) {
                completion();
            }
        });
    }

    function hidePlaylist(completion) {
        $('#playlist section .playlist-track').removeClass('animated fadeInUp');
        $('#playlist section .playlist-track').addClass('animated fadeOutDown');
        $('#playlist section .playlist-track').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
            if (completion != null) {
                completion();
            }
        });
    }

    function showLounge(completion) {
        loungeView.removeClass('animated bounceOutRight');
        loungeView.addClass('animated bounceInRight');
        loungeView.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
            if (completion != null) {
                completion();
            }
        });
    }

    function hideLounge(completion) {
        loungeView.removeClass('animated bounceInRight');
        loungeView.addClass('animated bounceOutRight');
        loungeView.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
            if (completion != null) {
                completion();
            }
        });
    }

    function addMarquee() {
        var tweetsView = $('.playlist-track .track-frame .track-content .track-tweets');

        for (var i = 0; i < tweets.length; i++) {
            var tweetObj = tweetsView[i];

            var tweetsDiv = $(tweetObj).find('div');

            if ($(tweetsDiv).hasClass('js-marquee-wrapper') == false) {
                if ($(tweetObj).find('img').length >= 7) {
                    $(tweetObj).marquee({
                        duration: 10000,
                        delayBeforeStart: 0,
                        gap: 0,
                        startVisible: true
                    });
                }
            }
        }
    }

    /*** DATA REQUEST ***/
    function refreshData() {
        if (updatingData) {
            return;
        }
        updatingData = true;
        $('footer p').html(HASHTAG_PLAYLIST);

        $.getJSON(URL_PLAYLIST, function(data) {
            if (data.status) {
                updateData(data);
            }
        });
    }

    function verifyData() {
        $.getJSON(URL_PLAYLIST, function(data) {
            if (data.status) {
                var ranking;
                if (data.setlist != null) {
                    ranking = data.setlist;
                } else if (data.ranking != null) {
                    ranking = data.ranking;
                }

                var tempTracks = new Array();
                for (var i = 0; i < ranking.length; i++) {
                    var track = {
                        'name': ranking[i].track_name,
                        'votes': ranking[i].votes,
                        'id': ranking[i].uri,
                        'voters': ranking[i].voters,
                        'counter': ranking[i].counter,
                        'totalVoter': ranking[i].totalVoter,
                    };
                    tempTracks.push(track);
                }
                tempTracks = tempTracks.sort(compareByVotes);

                for (var i = 0; i < tempTracks.length; i++) {
                    var track = tempTracks[i];
                    if (track.id != tracks[i].id && track.id != currentTrack.id && track.id != nextTrack.id) {
                        refreshData();
                        break;
                    }
                    if (i == 10) {
                        break;
                    }
                }
                startTimer();
            }
        });
    }

    function updateData(data) {
        tracks = new Array();
        tweets = new Array();

        var ranking;
        if (data.setlist != null) {
            ranking = data.setlist;
        } else if (data.ranking != null) {
            ranking = data.ranking;
        }

        for (var i = 0; i < ranking.length; i++) {
            var track = {
                'name': ranking[i].track_name,
                'votes': ranking[i].votes,
                'id': ranking[i].uri,
                'voters': ranking[i].voters,
                'counter': ranking[i].counter,
                'totalVoter': ranking[i].totalVoter,
            };
            tracks.push(track);

            let voters = ranking[i].voters;
            for (var j = 0; j < voters.length; j++) {
                var voter = voters[j];
                tweets.push(voter);
            }
        }
        tracks = tracks.sort(compareByVotes);
        tweets = tweets.sort(compareByTimestamp);

        if (tracks[0].votes == 0) {
            tracks.sort(function() {
                return .5 - Math.random();
            });
        }

        if (firstRequest) {
            firstRequest = false;
            updatingData = false;

            currentTrack = tracks.shift();
            nextTrack = tracks.shift();
            resetTrack(currentTrack, function() {
                resetTrack(nextTrack);
            });
            addFirstTracksWithIds([currentTrack.id, nextTrack.id]);
            showNextTrackToId(nextTrack.id, true);
            updateInterface();
        } else {
            updatingData = false;
            hideLounge();
            hidePlaylist(function() {
                updateInterface();
            });
        }
    }

    function addFrameToIdAtTrackElement(id, element, completion) {
      $.get(getTrackURL(id), function(data) {
        $('<img src="' + data.album.cover_medium + '">').one('load', function() {

            let title = data.title_short;
            let artist = data.artist.name;

            let trackImage = element.find('.track-frame .track-image').first();
            let trackData = element.find('.track-frame .track-data').first();
            $(this).appendTo(trackImage);
            trackData.append('<p class="track-title">' + title + '</p><p class="track-text">por</p><p class="track-artist">' + artist + '</p>');

            if (completion != null) {
                completion();
            }
        });
      });
    }

    function updateFrameToIdAtTrackElement(id, element, completion) {
        $.get(getTrackURL(id), function(data) {
          $('<img src="' + data.album.cover_medium + '">').one('load', function() {

              let title = data.title_short;
              let artist = data.artist.name;

              let trackImage = element.find('.track-frame .track-image').first();
              let image = element.find('.track-frame .track-image img').first();
              let trackData = element.find('.track-frame .track-data').first();
              let trackTweets = element.find('.track-frame .track-content .track-tweets').first();

              image.remove();
              $(this).appendTo(trackImage);

              trackData.html('<p class="track-title">' + title + '</p><p class="track-text">por</p><p class="track-artist">' + artist + '</p>');

              var tweetsHTML = '';
              for (var j = 0; j < nextTrack.voters.length; j++) {
                  var voter = nextTrack.voters[j];
                  if (voter.photo.length > 0) {
                      tweetsHTML += '<img src="' + voter.photo + '" title="@' + voter.nameUser + '" />';
                  }
              }
              trackTweets.html(tweetsHTML);

              $('#now-playing .playlist-track .track-frame .track-tweets img').on('error', function() {
                  $(this).attr('src', PLACEHOLDER_IMG_TWITTER);
              })

              addMarquee();

              if (completion != null) {
                  completion();
              }
          });
        });
        // $.ajax({
        //     url: getTrackURL(id),
        //     dataType: "jsonp",
        //     data: {
        //         format: "json"
        //     },
        //     success: function(data, status) {
        //
        //     }
        // });
    }

    function showNextTrackToId(id, firstRequest) {
        if (firstRequest) {
            loadNextTrackDataToId(id);
        } else {
            hideNextTrack(function() {
                loadNextTrackDataToId(id);
            });
        }
    }

    function loadNextTrackDataToId(id) {
        $.get(getTrackURL(id), function(data) {
          $('<img src="' + data.album.cover_medium + '">').one('load', function() {
              if (nextTrackView.find('*').length == 0) {
                  var html = htmlToNextTrack(nextTrack);
                  var trackObj = $(html);
                  trackObj.appendTo(nextTrackView);

                  let nextButton = $('#next-button');
                  nextButton.click(function() {
                      if (isSetlist()) {
                          DZ.player.next(false);
                          DZ.player.setMute();
                          DZ.player.pause();
                      } else {
                          DZ.player.next();
                      }
                      popTrack();
                      return false;
                  });

                  addFrameToIdAtTrackElement(nextTrack.id, nextTrackView, showNextTrack());

                  $('#playlist .playlist-track .track-frame .track-tweets img').on('error', function() {
                      $(this).attr('src', PLACEHOLDER_IMG_TWITTER);
                  })
              } else {
                  updateFrameToIdAtTrackElement(nextTrack.id, nextTrackView, showNextTrack());
              }
          });
        });
    }

    /*** HTML ***/
    function htmlToTrack(track) {
        var html = '';
        html += '<div class="playlist-track" data-id="' + track.id + '">';
        html += '<div class="votes">';
        html += '<p class="vote">' + track.votes + '</p>';
        html += '</div>';
        html += '<div class="track-frame">';
        html += '<div class="track-image">';
        html += '</div>';
        html += '<div class="track-content">';
        html += '<div class="track-data">';
        html += '</div>';
        html += '<div class="track-tweets">';
        for (var j = 0; j < track.voters.length; j++) {
            var voter = track.voters[j];
            if (voter.photo.length > 0) {
                html += '<img src="' + voter.photo + '" title="@' + voter.nameUser + '" />';
            }
        }
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';

        return html;
    }

    function htmlToNextTrack(track) {
        var html = '';
        html += '<div class="playlist-track" data-id="' + track.id + '">';
        html += '<div class="votes">';
        html += '<p class="vote">' + track.votes + '</p>';
        html += '</div>';
        html += '<div class="track-frame">';
        html += '<div class="track-image">';
        html += '<button id="next-button" type="button" title="Seguinte" aria-label="Seguinte"><svg class="svg-icon svg-icon-next" viewBox="0 0 12 12" aria-hidden="true" height="20" width="20"><g><path d="M11,0.50035 L11,11.4996537 C11,11.7759879 10.768066,12 10.5,12 C10.223858,12 10,11.7710004 10,11.4996537 L10,7.08139 L1.5623435,11.9492662 C1.3123668,12.0934835 1,11.9130717 1,11.6244769 L1,0.37552 C1,0.08693 1.3123668,-0.09348 1.5623435,0.05073 L10,4.918612 L10,0.50035 C10,0.22401 10.231934,3.88578059e-16 10.5,3.88578059e-16 C10.776142,3.88578059e-16 11,0.229 11,0.50035 L11,0.50035 Z"></path></g></svg></button>';
        html += '</div>';
        html += '<div class="track-content">';
        html += '<div class="track-data">';
        html += '</div>';
        html += '<div class="track-tweets">';
        for (var j = 0; j < track.voters.length; j++) {
            var voter = track.voters[j];
            if (voter.photo.length > 0) {
                html += '<img src="' + voter.photo + '" title="@' + voter.nameUser + '" />';
            }
        }
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';

        return html;
    }

    /*** COMPARE ***/
    function compareByTotalVotes(a, b) {
        return (b.totalVoter - a.totalVoter);
    }

    function compareByVotes(a, b) {
        return (b.votes - a.votes);
    }

    function compareByCouter(a, b) {
        return (a.counter - b.counter);
    }

    function compareByTimestamp(a, b) {
        return (b.timeStamp - a.timeStamp);
    }

    update();
});

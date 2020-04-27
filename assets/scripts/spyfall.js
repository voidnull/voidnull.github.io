

var players = [];
var gameState = 'NOT-STARTED';
var gameInfo = {}
var roomName = null;
function onMessage(type,data,sender) {
	var newPlayer = isNewPlayer(sender);
	
	switch (type) {
    case 'player.join':
		if (!user.admin) return;
		//already joined
		if (!newPlayer) return;
		
		if (gameState != 'NOT-STARTED') {
			gameio.sendToUser(sender, 'error', 'Cannot join game anymore.  Game:' + gameState);
			return
		}
		
		// add the player
        onNewPlayer(sender)
        break;
        
    case 'player.list':
	    if (user.admin) return;
        if (players.length > 1) return;
        data;
        for(var i = 0 ; i < data.length; i++) {
            onNewPlayer(data[i])
        }
        break;
        
    case 'game.starting':
        // reconnect to the game
        if (user.admin) return;
        gameio.sendToRoom('player.join', {})
        break;
        
    case 'location.info' :
        console.log(data)
        // process the game location data
        onLocationInfo(data)
        
        // set the game as started
        gameState = 'STARTED'
    } // switch
}

function isNewPlayer(player) {
	for (var i = 0 ; i < player.length ; i++) {
		if (players[i].uuid == gameio.getUUID(player)) {
			return false;
		}
	}
    return true;
}

function joinRoom(room) {
	gameio.setRoom(room)
	gameio.sendToRoom('player.join', {})
}

function onLocationInfo(locInfo) {
    $('#locname').html(locInfo.location)
    $('#rolename').html(locInfo.role)
    $('#loc-info').collapse('show')
}

function startGame() {
	gameState = 'STARTED'
	var keys = Object.keys(locationsAndRoles);
	var location=keys[randomInt(keys.length)];
	
    var playerRoles = [];
    
    for (var i=0; i<players.length; i++) {
        playerRoles.push({'player': players[i], 'role' : ''})
    }
    
    // shuffle
	playerRoles = lodash.shuffle(playerRoles);
	var roles = Object.assign([], locationsAndRoles[location])
	
    // first fix the spy
    var n = 0
    playerRoles[n]['role'] = 'SPY'
    
    // assign unique roles
    n++;
    for (var i=0; i < roles.length && n < playerRoles.length; i++) {
        playerRoles[n++]['role'] = roles[i]
    }
    
    // assign random roles for extra playes
    for (;n < playerRoles.length; n++) {
        playerRoles[n]['role'] = roles[randomInt(roles.length)]
    }
    
    // shuffle again
    playerRoles = lodash.shuffle(playerRoles)
    
    // send message to everyone
    // player list to everyone
    gameio.sendToRoom('player.list', players)
    
    // send role info to each person
    console.log(playerRoles)
    for (var i=0; i<playerRoles.length; i++) {
        var locInfo = {'location' : location, 'role': playerRoles[i].role}
        if (locInfo.role == 'SPY') {
            locInfo.location = 'To be Guessed'
        }
       gameio.sendToUser(playerRoles[i].player, 'location.info', locInfo)
    }
}

function onNewPlayer(player) {
    console.log(player)
    if (!isNewPlayer(player)) {
        return;
    }
    
    players.push(player);
    var playerName = player.name
    if (player.uuid == user.uuid()) {
        playerName += ' ' + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 16" width="12" height="16"><path fill-rule="evenodd" d="M12 14.002a.998.998 0 01-.998.998H1.001A1 1 0 010 13.999V13c0-2.633 4-4 4-4s.229-.409 0-1c-.841-.62-.944-1.59-1-4 .173-2.413 1.867-3 3-3s2.827.586 3 3c-.056 2.41-.159 3.38-1 4-.229.59 0 1 0 1s4 1.367 4 4v1.002z"></path></svg>';
    }
	var html = '<button type="button" class="btn btn-light bt-sm btn-block">' + playerName + '</button>';
	$('#players').append(html)
}

function validateNames() {
	var ids = ['#roomname', '#username']
	var roomName = $('#roomname').val().trim();
	var userName = $('#username').val().trim();
	var success = true;
	
	for (var i = 0 ; i < ids.length ; i++) {
		var obj = $(ids[i]);
		var text = obj.val().trim();
		//obj.val(text)
		if (text.length > 3) {
			obj.removeClass('is-invalid')
			obj.addClass('is-valid')
		} else {
			obj.removeClass('is-valid')
			obj.addClass('is-invalid')
			success = false;
		}
	}
	
	if (success) {
		user.name(userName)
	}
	return success;
}


function showAllLocations() {
	// write the locations
	$('#locations').html('')
	var keys = Object.keys(locationsAndRoles);
	var html=''
	for (var i=0 ; i<keys.length ; i++) {
		html += '<button type="button" class="col btn btn-light bt-sm btn-block m-2">' + keys[i].replace(/ /g,'&nbsp;') + '</button>'
	}

	$('#locations').html(html)
}

function waitForPlayers() {
    if (user.admin) {
        // add self
        onNewPlayer(lodash.clone(user.obj()))
        gameio.sendToRoom('game.starting')
    } else {
        gameio.sendToRoom('player.join')
    }
    
	$('#gameboard').collapse('show')
	$('#nameform').collapse('hide')
    showAllLocations();
}

function resetGame() {
    $('#nameform').collapse('show')
    $('#gameboard').collapse('hide')
    players = [];
    gameState = 'NOT-STARTED';
    gameInfo = {}
    roomName = null;
    $('#locname').html('Not Set')
    $('#rolename').html('Not Set')
    $('#players').html('')
    $('#locations').html('')
}

/************************************
 * Main
 ************************************/
function main() {
    gameio.setName('spyfall')
    gameio.onMessage(onMessage);
    $('#username').val(user.name())


    // nav links
    $('#gamenav a.nav-link').on('click', function(event) {
        var role = $(event.target).attr('role');
        
        switch(role) {
        case 'join':
        case 'create':
            if (tryGetValue(roomName,'').length > 3) {
                showMessage('Please leave room[' + roomName + '] before joining/creating another')
                return
            }
            
            // set button text
            $('#room-btn').html(role == 'create' ? 'Create' : 'Join')
            $('#gamenav a.active').removeClass('active')
            $(event.target).addClass('active')
            resetGame();
            break;
            
        case 'leave':
            if (tryGetValue(roomName,'').length == 0) {
                showMessage('You need to join a room to leave :)')
                return
            }
            
            // set button text
            $('#room-btn').html('Join')
            $('#gamenav a[role="join"]').removeClass('active')
            resetGame();
            break
            
        case 'start':
            if (tryGetValue(roomName,'').length == 0) {
                showMessage('You need to first create a game room')
                return
            }
            
            if (!user.admin) {
                showMessage('Only the <em>Game admin</em> can start the game')
                return
            }
            
            if (players.length < 3) {
                showMessage('You need atleast <em>3</em> players to start the game')
                return
            }
            
            $('#gamenav a.active').removeClass('active')
            $(event.target).addClass('active')
            startGame();
        }
        
    })
    $('#room-btn').on('click', function(event) {
    	event.preventDefault();
    	if (!validateNames()) return;

        if ($(event.target).text() == 'Create') {
            user.admin = true;
        }
    
        gameio.setRoom($('#roomname').val().trim())
        roomName = $('#roomname').val().trim()
    	// wait for players to join
    	waitForPlayers();
    });
    
    // player/location buttons
	$('#locations').on('click', 'button',  function(event) {
		event.preventDefault();
		$(event.target).toggleClass('btn-outline-info btn-light')
	});
	
	$('#players').on('click', 'button', function(event) {
		event.preventDefault();
		$(event.target).toggleClass('btn-light btn-success')
	});
}


//last statement
$(document).ready(main);

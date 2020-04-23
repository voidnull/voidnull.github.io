

var players = [];
var gameState = 'NOT-STARTED';


function onMessage(type,data,sender) {
	var newPlayer = true;
	
	for (var i = 0 ; i < player.length ; i++) {
		if (players[i].uuid == sender.uuid) {
			newPlayer = false;
			break;
		}
	}
	
	if (type == 'player.join') {
		if (!user.admin) return;
		//already joined
		if (!newPlayer) return;
		
		if (gameState != 'NOTSTARTED') {
			gameio.sendToUser(sender, 'error', 'Cannot join game anymore.  Game:' + gameState);
			return
		}
		
		// add the player
		players.push(sender)
		
	}
	
}

function joinRoom(room) {
	gameio.setRoom(room)
	gameio.sendToRoom('player.join', {})
}

function createRoom(room) {
}

function startGame() {
	gameState = 'STARTED'
	var keys = Object.keys(locationsAndRoles);
	var location=keys[Math.ceil(Math.random() * 100000) % keys.length];
	
	players.sort(function() {return Math.random() - 0.5});
	var roles = Object.assign([], locationsAndRoles[location])
	
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
		if (text.length > 2) {
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


function waitForPlayers() {
	
	// write the locations
	$('#locations').html('')
	var keys = Object.keys(locationsAndRoles);
	var html=''
	for (var i=0 ; i<keys.length ; i++) {
		html += '<button type="button" class="col btn btn-light bt-sm btn-block m-2">' +keys[i].replace(/ /g,'&nbsp;')+ '</button>'
	}
	$('#locations').html(html)
	
	$('#gameboard').collapse('show')
	$('#nameform').collapse('hide')
	
	html=''
	for (var i=0 ; i< 5 ; i++) {
		html += '<button type="button" class="btn btn-light bt-sm btn-block">' +keys[i]+ '</button>'
	}
	$('#players').html(html)
	
	
	$('#locations button').on('click', function(event) {
		event.preventDefault();
		$(event.target).toggleClass('btn-outline-info btn-light')
	});
	
	$('#players button').on('click', function(event) {
		event.preventDefault();
		$(event.target).toggleClass('btn-light btn-success')
	});
}


/**
 * Main
 **/

gameio.setName('spyfall')
gameio.onMessage(onMessage);
$('#username').val(user.name())

$('#create-room-btn').on('click', function(event) {
	event.preventDefault();
	if (!validateNames()) return;
	
	// wait for players to join
	waitForPlayers();
});

$('#join-room-btn').on('click', function(event) {
	event.preventDefault();
	validateNames();
});

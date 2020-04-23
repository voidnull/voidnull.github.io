
function GameIO(name) {
	this.name = name;
	this.room = null;
	this.onPresenceFn =null;
	this.onMessageFn = function(type,data,sender) {
		console.log(type,data,sender)
	}
	this.ignoreOwnMessages = true;
	this.pubnub = new PubNub({
	  publishKey: "pub-c-6d28cfc6-0fb4-47fc-8ff8-b2a4dba3b012",
	  subscribeKey: "sub-c-dbf77c2a-8352-11ea-a186-ea4c470fc0eb",
	  uuid: user.uuid()
	});
	
	this.onMessage = function(fn) {
		this.onMessageFn = fn;
	}
	
	this.onPresence = function(fn) {
		this.onPresenceFn = fn;
	}
	
	this.getRoomChannel = function () {
		if (!this.name || !this.room) {
			return null;
		}
		return 'game:' +
				this.name.toLowerCase().trim() + 
				'-' + this.room.toLowerCase().trim()
	}
	
	this.getUserChannel = function (userid) {
		if (!this.getRoomChannel()) {
			return null;
		}
		if (typeof userid == 'undefined' || userid.length == 0) {
			userid = user.uuid()
		}
		return this.getRoomChannel() + ":" + userid;
	}
	
	this.connect = function () {
		if (this.getRoomChannel()) {
			this.disconnect();
			console.log('subscribing to ',  this.getRoomChannel())
			this.pubnub.subscribe({
			  channels: [this.getRoomChannel(), this.getUserChannel()]
			});
		} else {
			console.log('channel name not ready')
		}
	}
	
	this.disconnect = function () {
		this.pubnub.unsubscribeAll();
	}
	
	this.setName = function(n) {
		this.name = n
		this.connect();
	}
	
	this.setRoom = function(room) {
		if (room) {
			this.connect();
		} else {
			this.pubnub.unsubscribe({
			  channels: [this.getRoomChannel(), this.getUserChannel()]
			});
		}
		this.room = room
	}
	
	this.joinRoom = function (room) {
		this.setRoom(room)
		this.sendToRoom('player.join', {})
	}
	
	this.leaveRoom = function (room) {
		this.sendToRoom('player.leave', {})
		this.setRoom(null);		
	}
	
	this.sendToRoom = function(eventtype, data) {
		return this.publish(this.getRoomChannel(), eventtype, data)
	}
	
	this.sendToUser = function(userid, eventtype, data) {
		if (typeof userid != 'string') {
			if (!('uuid' in userid)) return false;
			if (typeof userid.uuid == 'function') {
				userid = userid.uuid()
			} else {
				userid = userid.uuid
			}
		}
		return this.publish(this.getUserChannel(userid), eventtype, data)
	}
	
	this.publish = function (channel, eventtype, data) {
		if (!channel) {
			console.log('channel not set.. not sending', eventtype, data)
			return false;
		}
		
		if (typeof eventtype == 'undefined' || typeof data == 'undefined') {
			console.log('both eventtype and data should be given',eventtype, data)
			return false
		}
		 
		this.pubnub.publish({
		    channel : channel,
		    message : {
				"sender": user.obj(), 
				"content": {type: eventtype, data: data}
			}
		}, function(status, response) {
			if (status.error || status.statusCode != 200) {
    			console.log(status, response);
			}
  	  	});
		return true;
	}
	
	this.setupListeners = function() {
		/* setup listeners*/
		var gio = this;
		this.pubnub.addListener({
			message:function(e) {
			  	//console.log(e);
				if (gio.ignoreOwnMessages && e.message.sender.uuid == user.uuid()) {
					console.log('ignoring own message', e);
				} else if (gio.onMessageFn) {
					var m = e.message;
					gio.onMessageFn(m.content.type, m.content.data, m.sender);
				}
			}
		});
	}
	
	//init
	this.setupListeners();
}
var gameio = new GameIO();





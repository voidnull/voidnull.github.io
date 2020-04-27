
function GameIO(name) {
	this._name = name;
	this._room = null;
	this.onPresenceFn =null;
	this._onMessageFn = {
        'default.func' : function(type ,data, sender) {
		    console.log(type,data,sender)
	    }}
	this.ignoreOwnMessages = false;
	this.pubnub = new PubNub({
	  publishKey: "pub-c-6d28cfc6-0fb4-47fc-8ff8-b2a4dba3b012",
	  subscribeKey: "sub-c-dbf77c2a-8352-11ea-a186-ea4c470fc0eb",
	  uuid: user.uuid()
	});
	
	this.onMessage = function(fn) {
		this.onMessageType('default.func',fn);
	}
    
	this.onMessageType = function(type, fn) {
		this._onMessageFn[type] = fn;
	}
	
	this.onPresence = function(fn) {
		this.onPresenceFn = fn;
	}
	
	this.getRoomChannel = function () {
		if (!this._name || !this._room) {
			return null;
		}
		return 'game:' +
				this._name.toLowerCase().trim() + 
				'-' + this._room.toLowerCase().trim()
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
			console.log('channel name not ready', this._name, this._room)
		}
	}
	
	this.disconnect = function () {
		this.pubnub.unsubscribeAll();
	}
	
	this.setName = function(n) {
		this._name = n
		this.connect();
	}
	
	this.setRoom = function(room) {
		if (!room){
			this.disconnect()
		}
		this._room = room
        this.connect();
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
	
    this.getUUID = function (player) {
        var uuid = ''
		if (typeof player != 'string') {
			if (!('uuid' in player)) return false;
			if (typeof player.uuid == 'function') {
				uuid = player.uuid()
			} else {
				uuid = player.uuid
			}
		} else {
		    uuid = player
		}
        return uuid
    }
    
	this.sendToUser = function(userid, eventtype, data) {
		return this.publish(this.getUserChannel(this.getUUID(userid)), eventtype, data)
	}
	
	this.publish = function (channel, eventtype, data) {
		if (!channel) {
			console.log('channel not set.. not sending', eventtype, data)
			return false;
		}
		
		if (!isDefined(eventtype) && !isDefined(data)) {
			console.log('either of eventtype or data should be given',eventtype, data)
			return false
		}
        
        eventtype = tryGetValue(eventtype, 'msg')
        data = tryGetValue(data, {})
		// console.log('to publish', channel, eventtype, data, user)
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
		this.pubnub.addListener({
			message:(function(e) {
			  	// console.log(e, this);
				if (this.ignoreOwnMessages && e.message.sender.uuid == user.uuid()) {
					console.log('ignoring own message', e);
				} else if (Object.keys(this._onMessageFn).length > 0) {
					var m = e.message;
                    if (m.content.type in this._onMessageFn) {
                        this._onMessageFn[m.content.type](m.content.data, m.sender)
                    } else {
					    this._onMessageFn['default.func'](m.content.type, m.content.data, m.sender);
                    }
				}
			}).bind(this)
		});
	}
	
	//init
	this.setupListeners();
}
var gameio = new GameIO();





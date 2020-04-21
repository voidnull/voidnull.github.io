/**********************
 * Common Functions
 **********************/

$('body').on('keyup', function(event) {
	if (event.key == '?') {
		$('#helpsection').modal();
	} 
});

function normalizeSessionKey(key) {
	key = key.toUpperCase();
	key = key.trim();
	key = key.replace(/I/g,'1').replace(/O/g,'0').replace(/ /g,'')
	return key
}

function generateSessionKey(length) {
	if ((typeof length == "undefined") || length == 0) {
		length = 4;
	}
	return normalizeSessionKey(Math.random().toString(36).substring(2, 2+length));
}

// https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
String.prototype.hashCode = function() {
    var rng = new Math.seedrandom(this);
    return rng.int32();
}
/**********************
 * Common Functions
 **********************/

$('body').on('keyup', function(event) {
	if (event.key == '?') {
		$('#helpsection').modal();
	} 
});

// https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
String.prototype.hashCode = function() {
    var rng = new Math.seedrandom(this);
    return rng.int32();
}
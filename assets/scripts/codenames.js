/**************************************
 * Game Data
 **/

// data from codenames.data.json
$.merge(data,data2)

var NUMWORDS=25;
// map of index->type[red,blue,noone,death]
var words = {}
var blueCount = 8, redCount = 8;
var spyMaster = false;
var currentSeed = "";

function createBoard() {
	var html = '';
	html = '<table class="tables"><tbody>'
	for ( var i=0 ; i < 5 ; i++) {
		html += '<tr>';
		for ( var j=0; j < 5 ; j++) {
			//  kcard align-middle align-self-center text-center 
			num = (i* 5 + j);
			c = 'unclicked';
			html += '<td class="align-middle">';
			html += '<div num="'+ num +'" class="kcard unclicked shadow-sm">';
			html += '<div class=""><span class="text-uppercase">' + num + '</span>';
			html += '</div></div></td>';
		}
		html += '</tr>';
	}

	html += '</tbody></table>';
	$('#board').html(html);
}

function onCardClick(target) {
	target = $(target);
	
	if (target.attr('num') == null) {
		console.log('unknown target:', target);
		return;
	}
	var num = parseInt(target.attr('num'));
	
	var count = false;
	if (!target.hasClass('clicked')) {
		target.addClass('clicked');
		target.addClass(words[num]['type']);
		target.removeClass('unclicked');
	
		// set the counts
		if (words[num]['type'] == 'red') {
			redCount--;
		} else if (words[num]['type'] == 'blue') {
			blueCount--;
		}
		$('#redcount').text(redCount);
		$('#bluecount').text(blueCount);
	}
	
	if (spyMaster) {
		target.addClass('spymaster');
	}
}

function spyMasterView() {
	spyMaster = true;
	var target;
	for (var i=0 ; i < NUMWORDS; i++) {
		target = $('div.kcard[num="' + i + '"]');
		target.removeClass('clicked');
		target.addClass('unclicked');
		target.addClass(words[i]['type']);
	}
}

function initGame() {
	var seed = $('#seedkey').val().trim();
	if ((typeof seed == "undefined") || seed.length == 0) {
		//set the seedkey
		seed = Math.random().toString(36).substring(2, 6).toUpperCase();
		$('#seedkey').val(seed);
	}
	currentSeed = seed;
	
	//disable spymaster view
	spyMaster = false;
	var prng = new Math.seedrandom(seed);

	var len = data.length;

	// select NUMWORDS
	var indices = [];
	var idx;
	while ( indices.length < NUMWORDS ) {
		idx = prng.int32() ;
		if (idx < 0) idx = idx *= -1;
		idx = idx % len
		if ($.inArray(idx, indices) == -1) {
			indices.push(idx);
		}
	}
	
	console.log(indices);
	
	// 7 - noone
	// 8,8 red/blue
	// 1, death
	// 1 red/blue
	// create an array with the above data
	var types = [];
	var i = 0;
	for (i=0 ; i < 7; i ++) {
		types.push('noone');
		types.push('red');
		types.push('blue');
	}
	types.push('red');
	types.push('blue');
	types.push('death');
	startColor = prng.int32()%2==0?'blue':'red'
	types.push(startColor);
	types.sort(function() {return prng.int32()});
	
	// set the counts
	blueCount = 8;
	redCount = 8;
	if (startColor == 'blue') {
		blueCount = 9;
	} else {
		redCount = 9;
	}
	
	$('#redcount').text(redCount);
	$('#bluecount').text(blueCount);
	
	
	// set the types
	for (i=0 ; i < NUMWORDS; i++) {
		words[i] = {'word' : data[indices[i]], 'type' : types[i] }
	}
	
	console.log(words);
	
	for (i=0 ; i < NUMWORDS; i++) {
		var target = $('div.kcard[num="' + i + '"]');
		target.removeClass('clicked red blue death noone spymaster');
		target.addClass('unclicked');
		$('div.kcard[num="' + i + '"] div span').text(words[i]['word']);
	}
	
	/**
	if (spyMaster) {
		spyMasterView();
	}
	**/
}

/****** Main ****/
function main() {
	createBoard();
	initGame();
	$('div.kcard').on('click', function(e) {
		onCardClick(e.currentTarget);
	});
	
	$('#seedkey').on('keyup', function() {
		var newSeed = $('#seedkey').val().trim()
		if (newSeed.length > 0 && currentSeed != newSeed) {
			initGame();
		}
	});
	
	$('#spymasterbtn').on('click', spyMasterView);
}
$(document).ready(main);
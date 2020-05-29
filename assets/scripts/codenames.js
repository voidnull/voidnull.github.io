/**************************************
 * Game Data
 **/

// data from codenames.data.json
// $.merge(data,data2)

var NUMWORDS=25;
// map of index->type[red,blue,noone,death]
var words = {}
var blueCount = 8, redCount = 8;
var spyMaster = false;
var currentSeed = "";
var clock = null;
var currentColor = 'none'
var gameOver = false;


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
	var fClickedNow = false;
	if (!target.hasClass('clicked')) {
		fClickedNow = true;
		target.addClass('clicked');
		target.addClass(words[num]['type']);
		target.removeClass('unclicked');
	
		// set the counts
		if (words[num]['type'] == 'red') {
			redCount--;
		} else if (words[num]['type'] == 'blue') {
			blueCount--;
		}
        
        // time display
        if (!spyMaster) {
            if (words[num]['type'] != currentColor) {
                currentColor = words[num]['type']
                if (currentColor != 'death') {
                    clock.reset()
                } else {
                    clock.stop()
                }
            }
            
            if (currentColor == 'noone') {
                clock.reset()
            }
            
            // check for game END
            if (!gameOver) {
                var text = ''
                if (currentColor == 'death') {
                    text = '<span class="badge badge-dark">Death word clicked !!!</span>'
                } else {
                    if (redCount == 0) {
                        text = '<span class="badge badge-danger">Red Wins !!!</span>'
                    } else if (blueCount == 0) {
                        text = '<span class="badge badge-primary">Blue Wins !!!</span>'
                    }
                }
                if (text.length > 0) {
                    gameOver = true;
                    clock.stop();
                    $('#endmusic')[0].play();
                    showNotification('<h3><span class="badge badge-warning">Game Over</span> - ' + text + '</h3>');
                }
            }
        }
        
		$('#redcount').text(redCount);
		$('#bluecount').text(blueCount);
	}
	
	if (spyMaster) {
		if (fClickedNow) {
			target.addClass('spymaster');
		} else {
			target.removeClass('clicked spymaster');
			target.addClass('unclicked');
		}
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
	var seed = normalizeSessionKey($('#seedkey').val());
	if ((typeof seed == "undefined") || seed.length == 0) {
		//set the seedkey
		seed = generateSessionKey(4);
		$('#seedkey').val(seed);
	}
	currentSeed = seed;
	console.log('seed is ' + seed);
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
	
	//console.log(indices);
	
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
	
    currentColor = 'none'
    gameOver = false;
    clock.reset();
    clock.start();
	
	// set the types
	for (i=0 ; i < NUMWORDS; i++) {
		words[i] = {'word' : data[indices[i]], 'type' : types[i] }
	}
	
	//console.log(words);
	
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

function showNotification(html) {
    $('#notificationtext').html(html)
    $('#notification').modal('show')
}

/****** Main ****/
function main() {
    clock = new StopWatch(function(val){
        $('#timerdisplay').html(toMMSS(val));
    });
	createBoard();
	initGame();
	$('div.kcard').on('click', function(e) {
		onCardClick(e.currentTarget);
	});
	
	$('#seedkey').on('keyup', function() {
		var newSeed = normalizeSessionKey($('#seedkey').val());
		if (newSeed.length > 0 && currentSeed != newSeed) {
			initGame();
		}
	});
	
	$('#spymasterbtn').on('click', spyMasterView);
    
    
    
    $('#timerdisplay').click(function() {
        if (clock.enabled()) {
            if (clock.running()) {
                clock.stop();
            } else {
                clock.reset();
                clock.start();
            }
        }
    })
    
    $('#timerdisplay').dblclick(function() {
        var enabled = clock.enabled();
        clock.stop(true);
        clock.enabled(!enabled)
        if (!enabled) {
            clock.start();
        }
    })
    
    fullScreenBoard = true;
}
$(document).ready(main);
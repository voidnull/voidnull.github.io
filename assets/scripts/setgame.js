/**************************************
 * Game Data
 **/


var clock = null;
var gameOver = false;
var game = null;
var rotated = false;
var foundSets = 0;
var numSets = 0;
/**
 * card = Num-Shape-Fill-Color
 * Num  : 1,2,3
 * Shape: d,o,s
 * Fill : e,s,t
 * Color: r,g,p
 */

var ATTRS = 'nsfc';
var Attributes = {
    n: { name:'Num',   values : {1:'One', 2:'Two', 3:'Three'}},
    s: { name:'Shape', values : {d:'Diamond', o:'Oval', s:'Sqiggle'}},
    f: { name:'Fill',  values : {e:'Empty', s:'Solid', t:'Stripe'}},
    c: { name:'Color', values : {r:'Red', g:'Green', p:'Purple'}},
}

function getAttribFull(attrib, val) {
    let a = Attributes[attrib]
    if (lodash.isUndefined(val)) {
        return a.name
    } else {
        return a.values[val]
    }
}

function Card(n,s,f,c) {
    this.attr = { n:lodash.toInteger(n), s:s, f:f, c:c }
    if (n.length == 4) {
      this.attr = { n:lodash.toInteger(n[0]), s:n[1], f:n[2], c:n[3] }  
    }
    
    this.getNum = function() {
        return getAttribFull('n', this.attr.n)
    }
    
    this.getShape = function() {
        return getAttribFull('s', this.attr.s)
    }
    
    this.getFill = function() {
        return getAttribFull('f', this.attr.f)
    }
    
    this.getColor = function() {
        return getAttribFull('c', this.attr.c)
    }
    

    this.short = function() {
        let s = ''
        for (var i=0 ; i < ATTRS.length ; i++) {
            s = s + this.attr[ATTRS[i]]
        }
        return s
    }
    
    this.full = function() {
        let s = ''
        for (var i=0 ; i < ATTRS.length ; i++) {
            s = s + getAttribFull(ATTRS[i], this.attr[ATTRS[i]]) + '-'
        }
        
        return s.splice(s.length-1,1)
    }
}

function SetGame() {
    this.deck = []
    this.hand = []
    this.discards = []
    
    this.isSet = function(cards) {
        // console.log(cards)
        if (cards.length != 3) {
            return false;
        }
        for(let i=0; i < ATTRS.length ; i++) {
            let counts = {}
            let attr = ATTRS[i]
            for(let j = 0 ; j < 3 ; j ++) {
                let k = cards[j][i];
                if (!lodash.has(counts, k)) counts[k] = 0;
                counts[k] ++;
            }
            // unique count has to be 1 or 3
            if (lodash.keys(counts).length == 2) {
                let attrstring = ""
                lodash.each(lodash.keys(counts), function(v) {
                    attrstring += getAttribFull(attr, v) + "(" + counts[v] + ") "
                });
                // failed
                return 'Mismatch in ' + getAttribFull(attr) + ' :  '  + attrstring
            }
        }
        return true
    }
    
    this.findSets = function(cards , maxSets) {
        cards = tryGetValue(cards, this.hand)
        maxSets = tryGetValue(maxSets, -1)
        let sets = [];
        for (let i = 0; i < cards.length - 2 ; i++) {
            for (let j = i + 1 ; j < cards.length - 1 ; j++) {
                for (let k = j + 1 ; k < cards.length ; k++) {
                    let setCheck = this.isSet([cards[i], cards[j], cards[k]])
                    if (lodash.isBoolean(setCheck) && setCheck) {
                        sets.push([cards[i], cards[j], cards[k]])
                        if (maxSets > 0 && sets.length >= maxSets) {
                            break;
                        }
                    }
                }
            }
        }
        return sets
    }
    
    this.hasSets = function(cards) {
        cards = tryGetValue(cards, this.hand)
        return this.findSets(cards, 1).length > 0
    }
    
    // fill the current hand (max 12)
    this.deal = function(n) {
        let cards = []
        let newhand  = lodash.concat(this.hand, cards)
        let count = 0;
        let rand = 0
        do {
            this.deck = lodash.concat(cards, this.deck)
            cards = []
            for (let i = this.hand.length; i < 12 &&  this.deck.length > 0; i++) {
                rand = lodash.random(0, this.deck.length-1)
                if (rand >= 0 && rand < this.deck.length) {
                    cards.push(this.deck[rand])
                    this.deck.splice(rand,1)
                } else {
                    console.log('rand' , rand, this.hand.length, this.deck.length)
                }
            }
            
            newhand = lodash.concat(this.hand, cards)
            count++;
        } while (!this.hasSets(newhand) && count < 20 && this.deck.length > 0) 
        this.hand = newhand
        return cards;
    }

    this.remove = function(cards , discard) {
        let removed = []
        for (let i = 0 ; i < this.hand.length; i++) {
            for (let j = 0; j < cards.length ; j++) {
                if (this.hand[i] == cards[j]) {
                    this.hand.splice(i, 1)
                    i--;
                    removed.push(cards[j]);
                    cards.splice(j,1)
                    j = -1;
                }
            }
        }
        this.discards.push(removed)
    }
    
    // ctor
    // initialize the deck
    let keys = lodash.keys;
    for (var i = 0; i < 3 ; i++)
        for (var j = 0; j < 3 ; j++)
            for (var k = 0; k < 3 ; k++)
                for (var l = 0; l < 3 ; l++) {
                    let c = '' + 
                            keys(Attributes.n.values)[i] +
                            keys(Attributes.s.values)[j] +
                            keys(Attributes.f.values)[k] +
                            keys(Attributes.c.values)[l]
                    this.deck.push(c)
                }
    
    this.deck = lodash.shuffle(this.deck)
    this.deal()
}

function getSvg(card) {
    if (lodash.isString(card)) {
        card = new Card(card);
    }
    
    let id = 's-' + card.short();
    function stripe(cls) {
        return  '<pattern id="stripe-'+cls+'" width="5" height="3" patternUnits="userSpaceOnUse">' +
                '<line class="' + cls + '" x1="0" y1="0" x2="0" y2="10" stroke-width="2"></line>' +
                '</pattern>'
    }
    
    function squiggle(cls) {
        return '<path class="setshape ' + cls + '" id="' + id + '" d="m 33,180 c 6,-13 11,-23 26,-28 15,-5 31,-1 58,7 23,7 36,0 43,-3 7,-4 17,-9 30,-9 13,0 18,21 12,33 -5,11 -14,23 -26,28 -12,5 -32,1 -59,-7 -17,-5 -29,-3 -42,3 -9,4 -18,10 -30,9 -13,0 -19,-18 -12,-33 z"></path>'
    }
    
    function diamond(cls) {
        return '<polygon id="' + id + '" class="setshape ' + cls + '" points="30,180 117,145 205,180 117,215"></polygon>'
    }
    
    function oval(cls) {
        return '<rect id="' + id + '" class="setshape ' + cls + '" x="30" y="145" width="175" height="70" rx="35"></rect>'
    }
    
    // main
    let viewBox = "0 0 235 360";
    let transform = "";
    if (rotated) {
        viewBox =  "0 0 360 235";
        transform =  "translate(360, 0) rotate(90)";
    }
    
    let fillClass = lodash.toLower(card.getFill())
    let colorClass = lodash.toLower(card.getColor())
    let cls = fillClass + ' ' + colorClass;
    
    let svg = '<svg class="scard" viewBox="' + viewBox + '" cardinfo="' + card.short() + '">';
    svg += '<defs>'
    
    if (card.getFill() == 'Stripe') {
        svg += stripe(colorClass)
        cls = cls + ' stripe-' + colorClass;
    }
    
    let shape = card.getShape();
    if (shape == 'Diamond') {
        svg += diamond(cls)
    } else if (shape == 'Sqiggle') {
        svg += squiggle(cls)
    } else {
        svg += oval(cls)
    }
    
    svg += '</defs>'
    svg += '<g transform="' + transform + '">'
    svg += '<rect class="border" x="5" y="5" height="350" width="225" rx="10" ry="10" fill="white" stroke="grey" stroke-width="2"></rect>'
    switch(card.attr.n) {
    case 1:
        svg += '<use xlink:href="#' + id + '"></use>'
        break;
    case 2:
        svg += '<use y="-50" xlink:href="#' + id + '"></use>'
        svg += '<use y="50" xlink:href="#' + id + '"></use>'
        break;
    case 3:
      svg += '<use y="-100" xlink:href="#' + id + '"></use>'
      svg += '<use xlink:href="#' + id + '"></use>'
      svg += '<use y="100" xlink:href="#' + id + '"></use>'
    }
    svg += '</g>'
    svg += '</svg>'
    return svg;
}

function rotate() {
    rotated = !rotated;
    
    if (rotated) {
        $('svg.scard').attr('viewBox', "0 0 360 235")
        $('svg.scard g').attr('transform', "translate(360, 0) rotate(90)");
    } else {
        $('svg.scard').attr('viewBox', "0 0 235 360")
        $('svg.scard g').attr('transform', "");
    }
}


function createBoard() {
	var html = '';
	html = '<table><tbody>'
	for ( var i=0 ; i < 3 ; i++) {
        html += '<tr>'
        for ( var j=0 ; j < 4 ; j++) {
            html += '<td><div>'
		    html += getSvg(game.hand[i*4+j])
            html += '</div>';
            // html += '<div class="number rounded-circle"><span class="badge badge-primary">' + (i*3+ j + 1) + '</span></div>'
            html += '</td>';
        }
        html += '</tr>'
	}
    html += '</tbody></table>'
	$('#gameboard').html(html);
}

function onCardClick(e) {
    if (gameOver) {
        showNotification('<h3><span class="badge badge-danger">Game Over</span></h3>');
        return;
    }
    
	let target = $(e.currentTarget);
    if ($(target).hasClass('selected')) {
        $(target).removeClass('selected')
        $('rect.border', target).removeClass('selected-border')
        return;
    }
    $(target).addClass('selected')
    $('rect.border', e.currentTarget).addClass('selected-border')
    let cards = $('svg.selected')
    if (cards.length > 3) {
        console.log('more than 3 cards selected ..')
        // reset the selection
        cards.removeClass('selected')
        $('.selected-border').removeClass('selected-border')
    } else if (cards.length == 3) {
        let infos = []
        let parents = []
        $(cards).each(function() {
            infos.push($(this).attr('cardinfo'))
            parents.push($($(this).parent()))
        })
        
        let setCheck = game.isSet(infos)
        
        // check if they are a set
        if (lodash.isBoolean(setCheck) && setCheck) {
            console.log('The selected cards are a set' , infos)
            game.remove(infos)
            $(cards).remove();
            
            // new cards
            infos = game.deal()

            // update the board
            for(let i=0 ; i < infos.length && parents.length; i++) {
                parents[i].append(getSvg(infos[i]));
            }
            
            foundSets += 1 ;
            numSets = game.findSets().length;
            $('#foundsets').html(foundSets)
            $('#numsets').html(numSets)
            
            if (!game.hasSets()) {
                gameOver=true;
                let text = '<span class="badge badge-primary">' + foundSets +' - sets found. No more sets</span>'
                clock.stop();
                $('#endmusic')[0].play();
                showNotification('<h3><span class="badge badge-warning">Game Over</span> - ' + text + '</h3>');
            } else {
                $('#successmusic')[0].play();
            }
        } else {
             $('#failuremusic')[0].play();
            console.log('The selected cards are NOT a set', infos , setCheck)
        }
        
        // reset the selection
        cards.removeClass('selected')
        $('.selected-border').removeClass('selected-border')
    }
}


function initGame() {
	game = new SetGame();
    gameOver = false;
    createBoard();
    rotate();
    fopundSets = 0;
    numSets = game.findSets().length;
    $('#foundsets').html(foundSets)
    $('#numsets').html(numSets)
    clock.reset();
    clock.start();
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
    
    initGame();
    
    $('#gameboard').on('mouseenter', 'svg' , function(e){
        $('rect.border', e.currentTarget).addClass('hover')
    });
    $('#gameboard').on('mouseleave', 'svg' , function(e){
        $('rect.border', e.currentTarget).removeClass('hover')
    });
    
    $('#gameboard').on('click', 'svg' , function(e) {
        onCardClick(e);
    });
    
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
}
$(document).ready(main);
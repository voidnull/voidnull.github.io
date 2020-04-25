/**********************
 * Common Functions
 **********************/

function commonInit() {
    $('body').on('keyup', function(event) {
        if (event.key == '?') {
            $('#helpsection').modal();
        }
    });

    $('#alert-box button[class=close]').click(function (e) {
        e.preventDefault();
        $('#alert-box').hide();
    });
}

function showAlert(text, title) {
    $('#alert-box-text').text(tryGetValue(text, ""));
    $('#alert-box-title').title(tryGetValue(title, ""));
    $('#alert-box').show();
}

$(document).ready(commonInit)

// https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
String.prototype.hashCode = function() {
    var rng = new Math.seedrandom(this);
    return rng.int32();
}

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

function generateUUID() {
    var key = generateSessionKey(4)

    for (var i = 0 ; i < 3 ; i ++) {
        key += '-' + generateSessionKey(4);
    }
    return key.toLowerCase();
}

function isDefined(obj) {
    return typeof obj != "undefined";
}

function hasValue(obj) {
    return isDefined(obj) && (obj != null);
}

function tryGetValue(obj, defvalue) {
    if (hasValue(obj)) return obj;
    return defvalue;
}

// 75000 ==> "01:15"
function toMMSS(ms) {
    var s=''
    ms /= 1000;
    var sec = '' + Math.floor(ms % 60);
    var min = '' + Math.floor(ms / 60)
    
    return min.padStart(2,'0') + ' : ' + sec.padStart(2,'0')
}

/**********************
 * Timer Class
 **********************/

function Timer(fn, ms) {
    this._enabled = true;
    this._t = null;
    this._interval = tryGetValue(ms, 1000); // 1 second
    this._active = false;
    this._funcs = {
        'prefire': null,
        'stop' : null,
        'fire' : tryGetValue(fn, null),
        'reset' : null,
        'start' : null,
    };
    
    this.on = function(name, fn) {
        if (!(name in this._funcs)) {
            console.log('invalid event :' + name);
            return false;
        }
        
        this._funcs[name] = fn;
        return true;
    }
    
    this.start = function () {
        if (!this._enabled) {
            console.log('timer disabled');
            return false;
        }
        this.stop();
        var func = this._funcs['fire']
        
        if (!hasValue(func)) {
            console.log('timer func not specified');
            return false;
        }
        
        this._t = setInterval(func, this._interval);
        this._active = true;
    }
    
    this.stop = function () {
        clearInterval(this._t);
        this._active = false;
    }
    
    this.running = function () {return this._active;}
    this.enabled = function(val) {
        if (typeof val == "boolean") {
            this._enabled = val;
        }
        
        return this._enabled;
    }
}

/**********************
 * StopWatch Class
 * onValue(timeElapsed)
 **********************/
function StopWatch(onValue, intervalMs) {
    this._count = 0;
    this._onValue = tryGetValue(onValue, null);
    this._intervalMs = tryGetValue(intervalMs, 1000); // 1 second
    this._cb = (function(noCount) {
        if (!tryGetValue(noCount,false)) {
            this._count++;
        }
        this._onValue(this._count * this._intervalMs);
    }).bind(this);
    
    this.stop = function(reset) {
        this._timer.stop();
        if (tryGetValue(reset, false)) {
            this.reset();
        }
        this._cb(true);
    }
    
    this.reset = function() {
        this._count = 0;
    }
    
    this.start = function() {
        if (this.enabled()) {
            if (!hasValue(this._onValue)) {
                console.log('stopwatch: onValue not set..')
            } else {
                this._timer.start();
                return true;
            }
        }
        return false;
    }
    
    this.enabled = function(val) {
        return this._timer.enabled(val);
    }
    
    this.running = function() {
        return this._timer.running();
    }
    
    this._timer = new Timer(this._cb);
}

/**********************
 * User Class
 **********************/

function User() {
    this.data = {};
    this.admin = false;
    this.load = function() {
        var data = JSON.parse(localStorage.getItem('user'))
        var isset = false;
        if (data == null) {
            data = {};
        }

        if (!('name' in data)) {
            data['name'] = '';
        }

        if (!('uuid' in data)) {
            data['uuid'] = generateUUID();
            isset = true;
        }

        this.data = data;
        if (isset) {
            this.store();
        }
    };

    this.store = function() {
        localStorage.setItem('user', JSON.stringify(this.data));
    };

    this.name = function(value) {
        if (typeof value  == 'undefined') {
            return this.data['name']
        }
        this.data['name'] = value
        this.store();
    }

    this.uuid = function(value) {
        if (typeof value  == 'undefined') {
            return this.data['uuid']
        }
        this.data['uuid'] = value
        this.store();
    }

    this.obj = function() {
        return Object.assign({admin:this.admin}, this.data);
    }

    this.load();
}

var user = new User();
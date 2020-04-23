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
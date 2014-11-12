/**
 * path.js
 *
 * MIT LICENSE
 *
 * Copyright (c) 2014 PT Sagara Xinix Solusitama - Xinix Technology
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @author     Ganesha <reekoheek@gmail.com>
 * @copyright  2014 PT Sagara Xinix Solusitama
 */
(function(root, factory) {
    "use strict";

    if( typeof define === 'function' && define.amd ){
        define([], factory );
    }else if( typeof exports === 'object' ){
        module.exports = factory();
    }else{
        root.Path = factory();
    }
} (this, function() {
    "use strict";

    var hasEval = (function() {
        // Don't test for eval if we're running in a Chrome App environment.
        // We check for APIs set that only exist in a Chrome App context.
        if (typeof chrome !== 'undefined' && chrome.app && chrome.app.runtime) {
            return false;
        }

        // Firefox OS Apps do not allow eval. This feature detection is very hacky
        // but even if some other platform adds support for this function this code
        // will continue to work.
        if (typeof navigator != 'undefined' && navigator.getDeviceStorage) {
            return false;
        }

        try {
            var f = new Function('', 'return true;');
            return f();
        } catch (ex) {
            return false;
        }
    })();

    var isIndex = function(s) {
        return +s === s >>> 0 && s !== '';
    };

    var isObject = function(obj) {
        return obj === Object(obj);
    };

    var identStart = '[$_a-zA-Z]';
    var identPart = '[$_a-zA-Z0-9]';
    var identRegExp = new RegExp('^' + identStart + '+' + identPart + '*' + '$');

    var getPathCharType = function(char) {
        if (char === undefined)
            return 'eof';

        var code = char.charCodeAt(0);

        switch(code) {
            case 0x5B: // [
            case 0x5D: // ]
            case 0x2E: // .
            case 0x22: // "
            case 0x27: // '
            case 0x30: // 0
                return char;

            case 0x5F: // _
            case 0x24: // $
                return 'ident';

            case 0x20: // Space
            case 0x09: // Tab
            case 0x0A: // Newline
            case 0x0D: // Return
            case 0xA0:    // No-break space
            case 0xFEFF:    // Byte Order Mark
            case 0x2028:    // Line Separator
            case 0x2029:    // Paragraph Separator
                return 'ws';
        }

        // a-z, A-Z
        if ((0x61 <= code && code <= 0x7A) || (0x41 <= code && code <= 0x5A))
            return 'ident';

        // 1-9
        if (0x31 <= code && code <= 0x39)
            return 'number';

        return 'else';
    };

    var pathStateMachine = {
        'beforePath': {
            'ws': ['beforePath'],
            'ident': ['inIdent', 'append'],
            '[': ['beforeElement'],
            'eof': ['afterPath']
        },

        'inPath': {
            'ws': ['inPath'],
            '.': ['beforeIdent'],
            '[': ['beforeElement'],
            'eof': ['afterPath']
        },

        'beforeIdent': {
            'ws': ['beforeIdent'],
            'ident': ['inIdent', 'append']
        },

        'inIdent': {
            'ident': ['inIdent', 'append'],
            '0': ['inIdent', 'append'],
            'number': ['inIdent', 'append'],
            'ws': ['inPath', 'push'],
            '.': ['beforeIdent', 'push'],
            '[': ['beforeElement', 'push'],
            'eof': ['afterPath', 'push']
        },

        'beforeElement': {
            'ws': ['beforeElement'],
            '0': ['afterZero', 'append'],
            'number': ['inIndex', 'append'],
            "'": ['inSingleQuote', 'append', ''],
            '"': ['inDoubleQuote', 'append', '']
        },

        'afterZero': {
            'ws': ['afterElement', 'push'],
            ']': ['inPath', 'push']
        },

        'inIndex': {
            '0': ['inIndex', 'append'],
            'number': ['inIndex', 'append'],
            'ws': ['afterElement'],
            ']': ['inPath', 'push']
        },

        'inSingleQuote': {
            "'": ['afterElement'],
            'eof': ['error'],
            'else': ['inSingleQuote', 'append']
        },

        'inDoubleQuote': {
            '"': ['afterElement'],
            'eof': ['error'],
            'else': ['inDoubleQuote', 'append']
        },

        'afterElement': {
            'ws': ['afterElement'],
            ']': ['inPath', 'push']
        }
    };

    var noop = function() {};

    var parsePath = function(path) {
        var keys = [];
        var index = -1;
        var c, newChar, key, type, transition, action, typeMap, mode = 'beforePath';

        var actions = {
            push: function() {
                if (key === undefined)
                    return;

                keys.push(key);
                key = undefined;
            },

            append: function() {
                if (key === undefined)
                    key = newChar;
                else
                    key += newChar;
            }
        };

        var maybeUnescapeQuote = function() {
            if (index >= path.length)
                return;

            var nextChar = path[index + 1];
            if ((mode == 'inSingleQuote' && nextChar == "'") ||
                    (mode == 'inDoubleQuote' && nextChar == '"')) {
                index++;
                newChar = nextChar;
                actions.append();
                return true;
            }
        };

        while (mode) {
            index++;
            c = path[index];

            if (c == '\\' && maybeUnescapeQuote(mode))
                continue;

            type = getPathCharType(c);
            typeMap = pathStateMachine[mode];
            transition = typeMap[type] || typeMap['else'] || 'error';

            if (transition == 'error')
                return; // parse error;

            mode = transition[0];
            action = actions[transition[1]] || noop;
            newChar = transition[2] === undefined ? c : transition[2];
            action();

            if (mode === 'afterPath') {
                return keys;
            }
        }

        return; // parse error
    };

    var isIdent = function(s) {
        return identRegExp.test(s);
    };

    var constructorIsPrivate = {};

    var Path = function(parts, privateToken) {
        if (privateToken !== constructorIsPrivate)
            throw Error('Use Path.get to retrieve path objects');

        for (var i = 0; i < parts.length; i++) {
            this.push(String(parts[i]));
        }

        if (hasEval && this.length) {
            this.getValueFrom = this.compiledGetValueFromFn();
        }
    };

    var pathCache = {};

    var getPath = function(pathString) {
        if (pathString instanceof Path)
            return pathString;

        if (pathString === null || pathString.length === 0)
            pathString = '';

        if (typeof pathString != 'string') {
            if (isIndex(pathString.length)) {
                // Constructed with array-like (pre-parsed) keys
                return new Path(pathString, constructorIsPrivate);
            }

            pathString = String(pathString);
        }

        var path = pathCache[pathString];
        if (path)
            return path;

        var parts = parsePath(pathString);
        if (!parts)
            return invalidPath;

        path = new Path(parts, constructorIsPrivate);
        pathCache[pathString] = path;
        return path;
    };

    Path.get = getPath;

    var formatAccessor = function(key) {
        if (isIndex(key)) {
            return '[' + key + ']';
        } else {
            return '["' + key.replace(/"/g, '\\"') + '"]';
        }
    };

    Path.prototype = [];

    Path.prototype.valid = true;

    Path.prototype.toString = function() {
        var pathString = '';
        for (var i = 0; i < this.length; i++) {
            var key = this[i];
            if (isIdent(key)) {
                pathString += i ? '.' + key : key;
            } else {
                pathString += formatAccessor(key);
            }
        }

        return pathString;
    };

    Path.prototype.getValueFrom = function(obj, directObserver) {
        for (var i = 0; i < this.length; i++) {
            if (obj === null)
                return;
            obj = obj[this[i]];
        }
        return obj;
    };

    Path.prototype.iterateObjects = function(obj, observe) {
        for (var i = 0; i < this.length; i++) {
            if (i)
                obj = obj[this[i - 1]];
            if (!isObject(obj))
                return;
            observe(obj, this[i]);
        }
    };

    Path.prototype.compiledGetValueFromFn = function() {
        var str = '';
        var pathString = 'obj';
        str += 'if (obj != null';
        var i = 0;
        var key;
        for (; i < (this.length - 1); i++) {
            key = this[i];
            pathString += isIdent(key) ? '.' + key : formatAccessor(key);
            str += ' &&\n         ' + pathString + ' != null';
        }
        str += ')\n';

        key = this[i];
        pathString += isIdent(key) ? '.' + key : formatAccessor(key);

        str += '    return ' + pathString + ';\nelse\n    return undefined;';
        return new Function('obj', str);
    };

    Path.prototype.setValueFrom = function(obj, value) {
        if (!this.length)
            return false;

        for (var i = 0; i < this.length - 1; i++) {
            if (!isObject(obj))
                return false;
            obj = obj[this[i]];
        }

        if (!isObject(obj))
            return false;

        obj[this[i]] = value;
        return true;
    };

    var invalidPath = new Path('', constructorIsPrivate);
    invalidPath.valid = false;
    invalidPath.getValueFrom = invalidPath.setValueFrom = function() {};

    return Path;
}));
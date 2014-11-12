/**
 * WeakMap polyfill
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
(function(root) {
    "use strict";

    var initWeakMap = function(map) {
        map.index_ = map.index_ || 0;
        map.keys_ = map.keys_ || {};
        map.values_ = map.values_ || {};
    };

    var oldSet = WeakMap.prototype.set;
    WeakMap.prototype.set = function(key, value) {
        initWeakMap(this);

        this.index_++;
        this.keys_[this.index_] = key;
        this.values_[this.index_] = value;

        oldSet.apply(this, arguments);
    };

    var oldDelete = WeakMap.prototype.delete;
    WeakMap.prototype.delete = function(key) {
        var that = this;
        initWeakMap(this);

        Object.keys(this.keys_).forEach(function(k) {
            if (that.keys_[k] === key) {
                delete that.keys_[k];
                delete that.values_[k];
            }
        });

        oldDelete.apply(this, arguments);
    };

    var oldClear = WeakMap.prototype.clear;
    WeakMap.prototype.clear = function(key) {
        var that = this;
        initWeakMap(this);

        this.keys_ = {};
        this.values_ = {};

        oldDelete.apply(this, arguments);
    };

    WeakMap.prototype.forEach = function(callback, thisArg) {
        var that = this;

        Object.keys(this.keys_).forEach(function(k) {
            var key = that.keys_[k];

            if (!key) {
                // TODO please inspect this
                // i dont know why it seems we can lose data of keys here
                // console.log(k, 'ilang', that);
                return;
            }

            try {
                callback.call(thisArg || that, key, that.get(key), that);
            } catch(e) {
                // console.log('c', thisArg || that);
                // console.log('k', key);
                // console.log('t', that);
                // console.log('v', that.get(key));
                // console.error('e', e);
                throw e;
            }
        });
    };

    WeakMap.prototype.size = function() {
        return Object.keys(this.keys_).length;
    };

    WeakMap.prototype.values = function() {
        var values = [];
        this.forEach(function(key, value) {
            values.push(value);
        });
        return values;
    };

    WeakMap.prototype.keys = function() {
        var keys = [];
        this.forEach(function(key, value) {
            keys.push(key);
        });
        return keys;
    };

})(this);
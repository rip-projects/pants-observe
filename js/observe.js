/**
 * pants-observe
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
        root.pants = root.pants || {};
        root.pants.observe = factory();
    }
} (this, function() {
    "use strict";

    var observe = function(context, path, callback) {
        return new CallbackContext(context, path, callback);
    };

    /**
     * observe.CallbackContext
     *
     * @param {object}   context
     * @param {string}   path
     * @param {Function} callback
     */
    var CallbackContext = observe.CallbackContext = function(context, path, callback) {
        this.context = context;
        this.path = path;
        this.callback = callback;

        this.callback__ = this.callback_.bind(this);
        this.children = [];

        this.connect();

        var pathO = Path.get(path);
        if (pathO.length > 0) {
            Object.getNotifier(context).notify({
                type: 'add',
                object: context,
                name: pathO[0]
            });
        }
    };

    CallbackContext.prototype.connect = function() {
        if (this.isOpened) {
            return;
        }

        this.isOpened = true;

        if (Array.observe) {
            Array.observe(this.context, this.callback__);
        } else {
            Object.observe(this.context, this.callback__);
        }

        CallbackContext.entries.push(this);
    };

    CallbackContext.prototype.disconnect = function() {
        if (!this.isOpened) {
            return;
        }

        var that = this;

        this.children.forEach(function(child) {
            child.disconnect();
        });

        CallbackContext.entries.some(function(entry, index) {
            if (that === entry) {
                CallbackContext.entries.splice(index, 1);
                return true;
            }
        });

        if (Array.observe) {
            Array.unobserve(this.context, this.callback__);
        } else {
            Object.unobserve(this.context, this.callback__);
        }

        this.isOpened = false;

    };

    CallbackContext.prototype.callback_ = function(changes) {
        var that = this,
            names = {};

        var path = Path.get(that.path);

        changes.forEach(function(change) {
            var indexName = change.name || '';

            if (names[indexName]) {
                return;
            }

            if (path.length > 0 && path.indexOf(change.name) === -1) {
                return;
            }

            names[indexName] = indexName;

            if (path.length === 0) {
                that.callback(changes);
            } else if (path[path.length - 1] === change.name) {

                if (change.oldValue instanceof Array) {
                    that.children.some(function(child) {
                        if (child.context === change.oldValue && child.path === '') {
                            child.disconnect();
                            return true;
                        }
                    });
                }

                try {
                    var arrContext = that.context[change.name];
                    if (arrContext instanceof Array) {
                        that.children.push(observe(arrContext, '', that.callback));
                    }
                } catch(e) {
                    console.error(e);
                }

                that.callback(changes);
            } else {
                var subPath = Path.get(path.slice(1)),
                    subContext = that.context[path[0]] || {};

                that.children.forEach(function(child) {
                    child.disconnect();
                });


                that.children.push(observe(subContext, subPath.toString(), that.callback));

                Object.getNotifier(subContext).notify({
                    type: 'add',
                    object: subContext[subPath[0]],
                    name: subPath[0]
                });
            }

        });
    };

    CallbackContext.entries = [];

    return observe;
}));
/**
 * Object.observe() polyfill
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

    if (Object.observe) return;

    var clone = function(obj) {
        if (null === obj || "object" != typeof obj) {
            return obj;
        }
        var copy = obj.constructor();
        for (var attr in obj) {
            if (attr === 'oldAttributes_') {
                continue;
            }
            if (obj.hasOwnProperty(attr)) {
                copy[attr] = obj[attr];
            }
        }
        return copy;
    };

    var callbackContextMap = Object.callbackContextMap_ = new WeakMap();

    var TIMEOUT = 300;
    var schedule_;
    var startSchedule = Object.startSchedule_ = function() {
        if (!schedule_) {
            var scheduleFn = function () {
                callbackContextMap.forEach(function(context, callbacks) {
                    var changes = [];

                    if (callbacks && callbacks.length > 0) {
                        var oldContext = context.oldAttributes_;

                        var indices = {};
                        Object.keys(oldContext).forEach(function(index) {
                            if (index === 'oldAttributes_') {
                                return;
                            }
                            indices[index] = index;
                        });
                        Object.keys(context).forEach(function(index) {
                            if (index === 'oldAttributes_') {
                                return;
                            }
                            indices[index] = index;
                        });

                        if (context instanceof Array) {
                            var arrayChanged = false,
                                arrayIndex,
                                arrayRemoved = [],
                                arrayAddedCount = 0;
                            Object.keys(indices).forEach(function(i) {
                                if (oldContext[i] !== context[i]) {
                                    arrayChanged = true;
                                    arrayIndex = i;

                                    if (typeof context[i] === 'undefined') {
                                        arrayRemoved.push(oldContext[i]);
                                    }

                                    if (typeof oldContext[i] === 'undefined') {
                                        arrayAddedCount++;
                                    }
                                }
                            });

                            if (arrayChanged) {
                                changes.push({
                                    type: 'splice',
                                    object: context,
                                    index: arrayIndex,
                                    removed: arrayRemoved,
                                    addedCount: arrayAddedCount
                                });
                            }
                        } else {
                            Object.keys(indices).forEach(function(i) {
                                if (oldContext[i] !== context[i]) {
                                    if (typeof context[i] === 'undefined') {
                                        changes.push({
                                            type: 'delete',
                                            object: context,
                                            name: i,
                                            oldValue: oldContext[i]
                                        });
                                    } else if (typeof oldContext[i] === 'undefined') {
                                        changes.push({
                                            type: 'add',
                                            object: context,
                                            name: i
                                        });
                                    } else {
                                        changes.push({
                                            type: 'update',
                                            object: context,
                                            name: i,
                                            oldValue: oldContext[i]
                                        });
                                    }
                                }
                            });
                        }

                    }
                    context.oldAttributes_ = clone(context);

                    if (changes.length) {
                        window.C = context;
                        console.log('notify changes for context:', context, changes);
                        Object.getNotifier(context).bulkNotify(changes);
                    }
                });

                schedule_ = setTimeout(scheduleFn, TIMEOUT);
            };

            scheduleFn();
        }
    };

    var stopSchedule = Object.stopSchedule_ = function() {
        clearInterval(schedule_);
        schedule_ = null;
    };

    Object.observe = function(context, callback) {
        var old = clone(context);

        context.oldAttributes_ = old;

        var callbacks = [];
        if (callbackContextMap.has(context)) {
            callbacks = callbackContextMap.get(context);
        }

        callbacks.push(callback);
        callbackContextMap.set(context, callbacks);

        startSchedule();
    };

    Object.unobserve = function(context, callback) {
        if (callbackContextMap.has(context)) {
            var callbacks = callbackContextMap.get(context);
            var newCallbacks = [];
            for (var i in callbacks) {
                if (callback === callbacks[i]) continue;
                newCallbacks.push(callback);
            }
            if (newCallbacks.length) {
                callbackContextMap.set(context, newCallbacks);
            } else {
                callbackContextMap.delete(context);
                delete context.oldAttributes_;
            }
        }

        if (0 === callbackContextMap.size()) {
            stopSchedule();
        }
    };

    var notifiers = Object.notifiers_ = new WeakMap();

    var Notifier = function(context) {
        this.context = context;
    };

    Notifier.prototype.notify = function(change) {
        return this.bulkNotify([change]);
    };

    Notifier.prototype.bulkNotify = function(changes) {
        var callbacks = callbackContextMap.get(this.context);
        if (callbacks && callbacks.length > 0) {
            callbacks.forEach(function(callback) {
                callback(changes);
            });
        }
    };

    Object.getNotifier = function(context) {
        if (context === null || context === undefined) {
            return;
        }

        if (!notifiers.has(context)) {
            notifiers.set(context, new Notifier(context));
        }
        return notifiers.get(context);
    };
})(this);
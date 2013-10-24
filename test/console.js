/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');
const util = require('util');

const rufus = require('../');
const consoleUtil = require('./util/console');

var spy = new rufus.handlers.Null();
spy.handle = function(record) {
  this._lastRecord = record;
  return rufus.handlers.Null.prototype.handle.call(this, record);
};

var prevLog;
var lastMock;
function mockLog() {
  lastMock = arguments;
}

module.exports = {

  'console': {
    'before': function() {
      rufus.addHandler(spy);
      prevLog = console.log;
      console.log = mockLog;
      // not passing root means this file becomes root.
      // which means dirname.basename, or test.console
      rufus.console();
    },
    'can inject into global scope': function() {
      console.warn('test');
      assert(spy._lastRecord);
      assert.equal(spy._lastRecord.message, 'test');
    },
    'can generate a name': function() {
      console.log('foo');
      assert.equal(spy._lastRecord.name, 'test.console');

      consoleUtil('bar');
      assert.equal(spy._lastRecord.name, 'test.util.console');
    },
    'can ignore paths': function() {
      rufus.console({ ignore: ['test.util'] });

      console.log('quux');
      assert.equal(spy._lastRecord.message, 'quux');

      consoleUtil('baz');
      assert.notEqual(spy._lastRecord.message, 'baz');
      assert.equal(lastMock[0], 'baz');

      rufus.console();
    },
    'overrides console.dir()': function() {
      var obj = { foo: 'bar' };
      console.dir(obj);
      assert.equal(spy._lastRecord.message, "{ foo: 'bar' }");
    },
    'after': function() {
      rufus.console.restore();
      assert.equal(console.log, mockLog);
      console.log = prevLog;
      rufus._handlers = [];
    }
  }

};

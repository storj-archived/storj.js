'use strict';

var test = require('tape');
var Client = require('../../lib/Client');
var EventEmitter = require('events').EventEmitter;

test('Constructor creates Client', function (t) {
  var client = new Client();
  t.ok(client instanceof Client, 'Should be a client');
  t.ok(client instanceof EventEmitter, 'Should be an EventEmitter');
  t.end();
});

test('Client accepts opts object', function (t) {
  t.comment('Also tests constructor w/o new');
  var client = Client({});
  t.ok(client instanceof Client, 'Should be a client');
  t.equal(client.bridge, Client.Defaults.bridge, 'Uses default bridge');
  t.equal(client.protocol, Client.Defaults.protocol, 'Uses default protocol');
  client = Client({ bridge: 'foo', protocol: 'bar' });
  t.equal(client.bridge, 'foo', 'Uses provided bridge');
  t.equal(client.protocol, 'bar', 'Uses provided protocol');
  t.end();
});

test('Client scrubs input', function (t) {
  t.throws(Client.bind(null, 'foo'), 'Rejects non-object opts');
  t.throws(Client.bind(null, { bridge: 5 }), 'Rejects non-string bridge');
  t.throws(Client.bind(null, { protocol: 5 }), 'Rejects non-string protocol');
  t.end();
});

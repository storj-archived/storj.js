/**
 * This file is prefixed with 000_ to ensure it runs before all of the other
 * tests when the glob patter is expanded. This ensures we catch missing env
 * vars before the tests blowup with weird error messages
 */
'use strict'

var test = require('tape');

if(process.env.STORJ_USERNAME === undefined) {
  throw new Error('Must set STORJ_USERNAME to run tests');
}

var user = process.env.STORJ_USERNAME;

if(process.env.STORJ_PASSWORD === undefined) {
  throw new Error('Must set STORJ_PASSWORD to run tests');
}

var pass = process.env.STORJ_PASSWORD;

if(process.env.STORJ_BRIDGE === undefined) {
  throw new Error('Must set STORJ_BRIDGE to run tests');
}

var bridge = process.env.STORJ_BRIDGE;

test('Valid environment', function(t) {
  t.comment(`Running with ${user}:${pass}@${bridge}`);
  t.end();
});

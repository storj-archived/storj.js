var test = require('tape');
var proxyquire = require('proxyquire');

test('getExtension works', function (t) {
  var File = proxyquire('../../lib/File.js', {});
  var fakeFile = {
    _mimetype: 'application/pdf'
  }
  t.equal('.pdf', File.prototype._getExtension.call(fakeFile), '.pdf');
  fakeFile = {
    _mimetype: 'unknown/foobar'
  }
  t.equal('.unknown', File.prototype._getExtension.call(fakeFile), '.unknown');
  t.end();
})

test('appendTo calls out to render', function (t) {
  var elem = 'foo';
  var File = proxyquire('../../lib/File.js', {
    "render-media": {
      append: function(file, root, cb) {
        t.equal(file.name, 'file.pdf', 'Correct extension used');
        t.equal(root, elem, 'root-element passed through');
        t.doesNotThrow(file.createReadStream);
        cb();
        t.end();
      }
    }
  });

  var fakeFile = {
    _mimetype: 'application/pdf',
    _getExtension: File.prototype._getExtension,
    _store: {
      get: function(v, cb) {
        return cb(null, new Buffer('foobar'));
      }
    },
  }

  File.prototype.appendTo.call(fakeFile, elem);
});

test('renderTo calls out to render', function (t) {
  var elem = 'foo';
  var File = proxyquire('../../lib/File.js', {
    "render-media": {
      render: function(file, root, cb) {
        t.equal(file.name, 'file.pdf', 'Correct extension used');
        t.equal(root, elem, 'root-element passed through');
        t.doesNotThrow(file.createReadStream);
        cb();
        t.end();
      }
    }
  });

  var fakeFile = {
    _mimetype: 'application/pdf',
    _getExtension: File.prototype._getExtension,
    _store: {
      get: function(v, cb) {
        return cb(null, new Buffer('foobar'));
      }
    },
  }

  File.prototype.renderTo.call(fakeFile, elem);
});

test('appendTo handles error', function (t) {
  var elem = 'foo';
  var File = proxyquire('../../lib/File.js', {
    "render-media": {
      append: function(file, root, cb) {
        t.fail('Should not be called');
      }
    }
  });

  var fakeFile = {
    _mimetype: 'application/pdf',
    _getExtension: File.prototype._getExtension,
    _store: {
      get: function(v, cb) {
        t.end();
        return cb(new Error('foobar'));
      }
    },
  }

  File.prototype.appendTo.call(fakeFile, elem);
});

test('renderTo handles error', function (t) {
  var elem = 'foo';
  var File = proxyquire('../../lib/File.js', {
    "render-media": {
      render: function(file, root, cb) {
        t.fail('Should not be called');
      }
    }
  });

  var fakeFile = {
    _mimetype: 'application/pdf',
    _getExtension: File.prototype._getExtension,
    _store: {
      get: function(v, cb) {
        t.end();
        return cb(new Error('foobar'));
      }
    },
  }

  File.prototype.renderTo.call(fakeFile, elem);
});

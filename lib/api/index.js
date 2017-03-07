exports.uploadData = require('./upload-data.js');
exports.getData = require('./get-data.js');
exports.createFileToken = require('./create-file-token.js');
exports.getFilePointers = require('./get-file-pointers');
exports.resolveFileFromPointers = require('./resolve-file-from-pointers.js');

/* Buckets */
exports.createBucket = require('./createBucket');
exports.getBucket = require('./getBucket');
exports.getBucketList = require('./getBucketList');

/* Files */
exports.createFile = require('./createFile');
exports.getFileList = require('./getFileList');
exports.getFile = require('./getFile');
exports.deleteFile = require('./deleteFile');

/* Keys */
exports.registerKey = require('./registerKey');
exports.generateKeyPair = require('./generateKeyPair');
exports.generateMnemonic = require('./generateMnemonic');

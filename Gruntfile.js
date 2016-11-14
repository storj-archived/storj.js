module.exports = function( grunt ) {

  var files = [
    'lib/Storj.js',
    'lib/Config.js',
    'lib/Socket.js',
    'lib/Exports.js',
    'lib/Utils.js',
    'lib/BridgeClient.js',
    'lib/Downloader.js',
    'lib/Stream.js'
  ];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    'closure-compiler': {
      'Storj': {
        closurePath: './compiler',
        noreport: true,
        js: files,
        jsOutputFile: 'build/Storj.min.js',
        options: {
          externs: './compiler/build/externs.txt',
          language_in: 'ECMASCRIPT5_STRICT',
          warning_level: 'VERBOSE'
        }
      }
    },
    concat: {
      'Storj': {
        files: {
          'build/Storj.js': files,
        }
      }
    },
    watch: {
      scripts: {
        files: ['lib/*.js'],
        tasks: ['concat:*']
      }
    },
    browserify: {
      'Storj': {
        src: ['exports/index.js'],
        dest: 'lib/Exports.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-closure-compiler');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.registerTask('default', [ 'concat', 'closure-compiler' ]);
};

/*
 * grunt-soajs
 * https://github.com/soajs/soajs.grunt
 *
 * Copyright (c) 2017 SOAJS
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
	// Project configuration.
	grunt.initConfig({
		jshint: {
			all: [
				'Gruntfile.js',
				'tasks/*.js'
			],
			options: {
				jshintrc: '.jshintrc'
			}
		}
	});
	
	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	
	// By default, lint and run all tests.
	grunt.registerTask('default', ['jshint']);
	
};

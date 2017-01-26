/*
 * grunt-soajs
 * https://github.com/soajs/soajs.grunt
 *
 * Copyright (c) 2017 mikehajj
 * Licensed under the MIT license.
 */

'use strict';
module.exports = soajs;

function soajs(grunt) {
	
	grunt.task.registerMultiTask('swagger2soajs', 'used to generate soajs microservice from swagger.yml file', function () {
		// Merge task-specific and/or target-specific options with these defaults.
		
		var done = this.async();
		var options = this.options();
		
		if (!options.configPath) {
			grunt.log.error("missing path to config.js !!!");
			done(false);
			return;
		}

		if (!options.swaggerPath) {
			grunt.log.error("missing path to swagger.yml !!!");
			done(false);
			return;
		}
		
		if (!options.op || ["generate", "regenerate"].indexOf(options.op) === -1) {
			grunt.log.error("invalid or missing operation value, refer to README.md!!");
			done(false);
			return;
		}
		
		var directoryToUse = options.configPath.split("/");
		directoryToUse.pop();
		directoryToUse = directoryToUse.join("/") + "/";
		
		var swaggerModule = require(__dirname + "/../lib/swagger/gen");
		swaggerModule[options.op](directoryToUse, options.configPath, options.swaggerPath, function(error, response){
			if(error){
				grunt.log.error("Code: " + error.code + ", Message: " + error.msg);
				done(false);
				return;
			}
			else{
				grunt.log.ok(response);
				done(true);
				return;
			}
		});
	});
}

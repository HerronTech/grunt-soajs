"use strict";
var os = require("os");
var fs = require("fs");
var async = require("async");
var mkdirp = require("mkdirp");
var swaggerUtils = require("./swagger");

/**
 * module to regenerate the folders/files from swagger.yml file
 * @type {{generate: swaggerModule.generate}}
 */
var swaggerModule = {
	"regenerate": function (directoryToUse, configPath, yamlPath, callback) {
		var yamlContent = fs.readFileSync(yamlPath, "utf8");
		var config = require(configPath);
		delete config.schema;
		delete config.errors;
		
		//global object in this function to hold data that is juggled between functions
		var context = {
			yaml: null,
			soajs: {
				config: config
			}
		};
		
		/**
		 * parse the yaml and generate a config.js content from it
		 * @param cb
		 * @returns {*}
		 */
		function validateYaml(cb) {
			swaggerUtils.parseYaml(yamlContent, context, cb);
		}

		/**
		 * generate the folders and files needed to create a new microservice
		 * @param cb
		 */
		function generateModule(cb) {

			/**
			 * create and fill all the files needed for the microservice
			 * @param mCb
			 */
			function writeFiles(mCb) {
				var files = [
					{
						file: directoryToUse + "config.js",
						data: "\"use strict\";" + os.EOL + "module.exports = " + JSON.stringify(context.soajs.config, null, 2) + ";",
						tokens: {
							dirname: "__dirname"
						},
						purify: true
					}
				];
				
				swaggerUtils.generateFiles(files, mCb);
			}

			/**
			 * Generate the middleware for each API in the config.schema
			 */
			function generateAPIsMw(cb) {
				swaggerUtils.generateAPIsMw(directoryToUse, false, context, cb);
			}

			async.series([writeFiles, generateAPIsMw], cb);
		}

		async.series([validateYaml, generateModule], function(error){
			if(error){
				return callback(error);
			}
			return callback(null, "micro service files have been regenerated.");
		});
	},
	
	"generate": function (directoryToUse, configPath, yamlPath, callback) {
		var yamlContent = fs.readFileSync(yamlPath, "utf8");
		var config = require(configPath);
		
		var tmplDir = __dirname + "/tmpl/";

		//global object in this function to hold data that is juggled between functions
		var context = {
			yaml: null,
			soajs: {
				config: config
			}
		};
		
		/**
		 * parse the yaml and generate a config.js content from it
		 * @param cb
		 * @returns {*}
		 */
		function validateYaml(cb) {
			swaggerUtils.parseYaml(yamlContent, context, cb);
		}
		
		/**
		 * generate the folders and files needed to create a new microservice
		 * @param cb
		 */
		function generateModule(cb) {
			/**
			 * Generate all the folders needed for the microservice
			 * @param mCb
			 */
			function buildDirectories(callback) {
				var directories = [
					directoryToUse + "/lib/mw",
					directoryToUse + "/lib/models",
					directoryToUse + "/test/unit",
					directoryToUse + "/test/integration"
				];
				
				async.eachSeries(directories, function (dirPath, mCb) {
					console.log("creating directory:", dirPath);
					mkdirp(dirPath, mCb);
				}, function (error) {
					if(error){
						return callback({"code": 853,"msg": error.message});
					}
					return callback(null, true);
				});
			}
			
			/**
			 * create and fill all the files needed for the microservice
			 * @param mCb
			 */
			function writeFiles(mCb) {
				var files = [
					//module files
					{file: directoryToUse + "/test/helper.js", data: fs.readFileSync(tmplDir + "helper.txt", "utf8")},
					{
						file: directoryToUse + "/test/unit/_server.test.js",
						data: fs.readFileSync(tmplDir + "server.txt", "utf8"),
						tokens: {
							service_name: config.serviceName,
							type: "Unit"
						}
					},
					{
						file: directoryToUse + "/test/unit/" + config.serviceName + ".test.js",
						data: fs.readFileSync(tmplDir + "mocha.txt", "utf8"),
						tokens: {
							service_name: config.serviceName,
							type: "Unit"
						}
					},
					{
						file: directoryToUse + "/test/integration/_server.test.js",
						data: fs.readFileSync(tmplDir + "server.txt", "utf8"),
						tokens: {
							service_name: config.serviceName,
							type: "Integration"
						}
					},
					{
						file: directoryToUse + "/test/integration/" + config.serviceName + ".test.js",
						data: fs.readFileSync(tmplDir + "mocha.txt", "utf8"),
						tokens: {
							service_name: config.serviceName,
							type: "Integration"
						}
					},
					{
						file: directoryToUse + "/config.js",
						data: "\"use strict\";" + os.EOL + "module.exports = " + JSON.stringify(context.soajs.config, null, 2) + ";",
						tokens:{
							dirname: "__dirname"
						},
						purify: true
					}
				];
				
				//check if the dbs list contains a mongo or es model
				var mongo = false, es = false;
				if(context.soajs.config.dbs && Array.isArray(context.soajs.config.dbs) && context.soajs.config.dbs.length > 0){
					context.soajs.config.dbs.forEach(function (oneDB) {
						if (oneDB.mongo) {
							mongo = true;
						}
						if (oneDB.es) {
							es = true;
						}
					});
				}
				
				//if it does, then add the sample models
				if (mongo) {
					files.push({
						file: directoryToUse + "/lib/models/mongo.js",
						data: fs.readFileSync(tmplDir + "mongo.txt", "utf8")
					});
				}
				if (es) {
					files.push({
						file: directoryToUse + "/lib/models/es.js",
						data: fs.readFileSync(tmplDir + "es.txt", "utf8")
					});
				}
				
				swaggerUtils.generateFiles(files, mCb);
			}
			
			/**
			 * Generate the middleware for each API in the config.schema
			 */
			function generateAPIsMw() {
				swaggerUtils.generateAPIsMw(directoryToUse, true, context, cb);
			}
			
			async.series([buildDirectories, writeFiles, generateAPIsMw], cb);
		}
		
		async.series([validateYaml, generateModule], function(error){
			if(error){
				return callback(error);
			}
			return callback(null, "micro service files have been generated.");
		});
	}
};

module.exports = swaggerModule;
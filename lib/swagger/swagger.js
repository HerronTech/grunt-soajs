"use strict";
var fs = require("fs");
var async = require("async");
var yamljs = require("yamljs");
var Validator = require('jsonschema').Validator;
var schema = require("./schema");


function mapSwaggerTypeToSoajsType(swaggerType) {
	let soajsType;
	
	switch (swaggerType) {
		case 'string' :
			soajsType = "string";
			break;
		case 'number' :
			soajsType = "integer";
			break;
		case 'integer' :
			soajsType = "integer";
			break;
		case 'boolean' :
			soajsType = "boolean";
			break;
		case 'array' :
			soajsType = "array";
			break;
		case 'object' :
			soajsType = "object";
			break;
		default:
			soajsType = swaggerType; // unmapped, keep as is
			break;
	}
	
	return soajsType;
}

function decodeReference(ref) {
	// todo: split and decode
	if (ref.includes('parameters')) {
		return 'parameters';
	}
	
	if (ref.includes('definitions')) {
		return 'definitions';
	}
	
	return '';
}

/**
 * swagger types : body, header, formData, query, path
 * soajs types : query, body, params, headers
 * @param inObj String ex: body
 */
function convertSource(key, inObj) {
	let source = inObj; // body, query : keep it as is
	
	if (inObj === 'header') {
		source = "headers";
	}
	if (inObj === 'formData') {
		source = "body";
	}
	if (inObj === 'path') {
		source = "params";
	}
	
	return [`${source}.${key}`];
}

/**
 *
 * @param mainDefinitions : coming null from fetch definitions
 * @param item
 * @param level : if root (1) : set in validation
 * @returns {*}
 */
function convertItem(mainDefinitions, item, level) {
	let output = {};
	let outputKey = '';
	
	if (!item) {
		return undefined;
	}
	
	if (item.name) {
		outputKey = item.name;
	}
	
	output.required = item.required || false;
	
	if (item.in) {
		if (!item.name) {
			// console.log('todo: could it ever happen??');
		}
		output.source = convertSource(item.name, item.in);
	}
	
	if (item.description) {
		output.description = item.description;
	}
	
	if (item.type) {
		let workOn = output;
		
		if (level === 1) { // root // work with validation
			output.validation = {};
			workOn = output.validation;
		}
		
		workOn.type = mapSwaggerTypeToSoajsType(item.type);
		if (item.type === 'object') {
			if (item.properties) {
				let newLevel = level + 1;
				let propertiesKeys = Object.keys(item.properties);
				workOn.properties = {};
				propertiesKeys.forEach(function (eachProp) {
					workOn.properties[eachProp] = convertItem(mainDefinitions, item.properties[eachProp], newLevel);
					workOn.properties[eachProp].required = (item.required && Array.isArray(item.required)) ? item.required.indexOf(eachProp) !== -1 : false;
				});
			}
		}
		
		if (item.type === 'array') {
			if (item.items) {
				
				workOn.items = {
					type: item.items.type
				};
				
				if (item.items.properties) {
					let newLevel = level + 1;
					let propertiesKeys = Object.keys(item.items.properties);
					workOn.items.properties = {};
					propertiesKeys.forEach(function (eachProp) {
						workOn.items.properties[eachProp] = convertItem(mainDefinitions, item.items.properties[eachProp], newLevel);
					});
				}
			}
		}
	}
	
	if (item.schema) {
		
		if (item.schema['$ref']) {
			let referenceType = decodeReference(item.schema['$ref']);
			
			if (referenceType === 'definitions') {
				let definitionKey = item.schema['$ref'].split('definitions/')[1];
				output.validation = mainDefinitions[definitionKey].validation;
				// todo: required from object
			}
			
		} else {
			if (!output.validation) {
				output.validation = {};
			}
			
			output.validation.type = mapSwaggerTypeToSoajsType(item.schema.type);
			
			if (item.schema.properties) { // object
				let newLevel = level + 1;
				let propertiesKeys = Object.keys(item.schema.properties);
				output.validation.properties = {};
				propertiesKeys.forEach(function (eachProp) {
					output.validation.properties[eachProp] = convertItem(mainDefinitions, item.schema.properties[eachProp], newLevel);
					output.validation.properties[eachProp].required = (item.schema.required && Array.isArray(item.schema.required)) ? item.schema.required.indexOf(eachProp) !== -1 : false;
				});
			}
			
			if (item.schema.type === 'array') {
				if (item.schema.items) {
					
					output.validation.items = {
						type: item.schema.items.type
					};
					
					if (item.schema.items.properties) { // array of object
						let newLevel = level + 1;
						let propertiesKeys = Object.keys(item.schema.items.properties);
						output.validation.items.properties = {};
						propertiesKeys.forEach(function (eachProp) {
							output.validation.items.properties[eachProp] = convertItem(mainDefinitions, item.schema.items.properties[eachProp], newLevel);
						});
					}
				}
			}
		}
	}
	
	return output;
}

/**
 *
 * @param parameters: array of objects
 *  {
    "$ref": "#/definitions/testInDef"
    }
 
 or
 
 {
    "name": "testDirect",
    "required": true,
    "in": "body",
    "description": "description description",
    "schema": {}
  }
 
 * @returns {{}}
 */
function convertParams(mainDefinitions, mainParameters, parameters) {
	let output = {
		custom: {},
		commonFields: []
	};
	
	if (!parameters) {
		return {
			custom: {}
		};
	}
	
	parameters.forEach(function (eachParam) {
		let paramKeys = Object.keys(eachParam);
		if (paramKeys.length === 1 && eachParam['$ref']) { // reference detected
			let referenceType = decodeReference(eachParam['$ref']);
			
			if (referenceType === 'definitions') {
				let definitionKey = eachParam['$ref'].split('definitions/')[1];
				output.custom[definitionKey] = mainDefinitions[definitionKey];
				// double check mainDef have it
			}
			if (referenceType === 'parameters') {
				let parameterKey = eachParam['$ref'].split('parameters/')[1];
				output.commonFields.push(parameterKey);
				// double check if mainparams have it
			}
			
		} else {
			let newItem = convertItem(mainDefinitions, eachParam, 1);
			
			if (eachParam.name) {
				output.custom[eachParam.name] = newItem;
			} else {
				// console.log('todo: could it ever happen??');
			}
		}
	});
	
	if (output.commonFields.length === 0) {
		delete output.commonFields;
	}
	
	return output;
}

var lib = {
	"extractValidation": function (commonFields, oneInput, tempInput, inputObj, common) {
		//if param schema is in common field ( used for objects only ) 
		if (oneInput.schema && oneInput.schema['$ref']) {
			inputObj.validation = lib.getIMFVfromCommonFields(commonFields, oneInput.schema['$ref']);
			if (common) {
				commonFields[common].validation = inputObj.validation;
			}
		}
		//if param is a combination of array and common field
		else if (oneInput.schema && oneInput.schema.type === 'array' && oneInput.schema.items['$ref']) {
			inputObj.validation = {
				"type": "array",
				"items": lib.getIMFVfromCommonFields(commonFields, oneInput.schema.items['$ref'])
			};
			if (common) {
				commonFields[common].validation = inputObj.validation;
			}
		}
		else if (oneInput.schema && oneInput.schema.properties && oneInput.schema.properties.items && oneInput.schema.properties.items.type === 'array' && oneInput.schema.properties.items.items['$ref']) {
			inputObj.validation = {
				"type": "array",
				"items": lib.getIMFVfromCommonFields(commonFields, oneInput.schema.properties.items.items['$ref'])
			};
			if (common) {
				commonFields[common].validation = inputObj.validation;
			}
		}
		//if param is not a common field
		else {
			inputObj.validation = tempInput;
			if (common) {
				commonFields[common].validation = inputObj.validation;
			}
		}
	},
	
	"getIMFVfromCommonFields": function (commonFields, source) {
		var commonFieldInputName = source.split("/");
		commonFieldInputName = commonFieldInputName[commonFieldInputName.length - 1];
		return commonFields[commonFieldInputName].validation;
	},
	"populateCommonFields": function (commonFields) {
		//loop in all common fields
		for (var oneCommonField in commonFields) {
			recursiveMapping(commonFields[oneCommonField].validation);
		}
		
		//loop through one common field recursively constructing and populating all its children imfv
		function recursiveMapping(source) {
			if (source.type === 'array') {
				if (source.items['$ref'] || source.items.type === 'object') {
					source.items = mapSimpleField(source.items);
				}
				else if (source.items.type === 'object') {
					recursiveMapping(source.items);
				}
				else mapSimpleField(source);
			}
			else if (source.type === 'object') {
				for (var property in source.properties) {
					if (source.properties[property]['$ref']) {
						source.properties[property] = mapSimpleField(source.properties[property]);
					}
					else if (source.properties[property].type === 'object' || source.properties[property].type === 'array') {
						recursiveMapping(source.properties[property]);
					}
				}
			}
			else if (source.schema) {
				if (source.schema.type === 'object') {
					for (var property in source.schema.properties) {
						if (source.schema.properties[property]['$ref']) {
							source.schema.properties[property] = mapSimpleField(source.schema.properties[property]);
						}
					}
				}
			}
			else {
				//map simple inputs if any
				source = mapSimpleField(source);
			}
		}
		
		//if this input is a ref, get the ref and replace it.
		function mapSimpleField(oneField) {
			if (oneField['$ref']) {
				return lib.getIMFVfromCommonFields(commonFields, oneField['$ref']);
			}
			else {
				return oneField;
			}
		}
	},
	"injectCommonFields": function (commonFields, globalParams, all_apis) {
		var generatedObject = {};
		for (var i in globalParams) {
			if (commonFields[i]) {
				generatedObject[i] = commonFields[i];
			}
		}
		if (generatedObject && Object.keys(generatedObject).length > 0) {
			all_apis.commonFields = generatedObject;
		}
	}
};

var swagger = {
	
	/**
	 * parse the yaml and generate a config.js content from it
	 * @param cb
	 * @returns {*}
	 */
	"parseYaml": function (yamlContent, context, callback) {
		var jsonAPISchema;
		
		try {
			jsonAPISchema = yamljs.parse(yamlContent);
		}
		catch (e) {
			return callback({"code": 851, "msg": e.message});
		}
		
		try {
			swagger.validateYaml(jsonAPISchema);
		}
		catch (e) {
			return callback({"code": 173, "msg": e.message});
		}
		
		context.yaml = jsonAPISchema;
		
		swagger.mapAPis(jsonAPISchema, function (response) {
			context.soajs.config.schema = response.schema;
			context.soajs.config.errors = response.errors;
			
			var myValidator = new Validator();
			var check = myValidator.validate(context.soajs.config, schema);
			if (check.valid) {
				return callback(null, true);
			}
			else {
				var errMsgs = [];
				check.errors.forEach(function (oneError) {
					errMsgs.push(oneError.stack);
				});
				return callback({"code": 172, "msg": new Error(errMsgs.join(" - ")).message});
			}
		});
	},
	
	/**
	 * validate that parsed yaml content has the minimum required fields
	 * @param yamlJson
	 */
	"validateYaml": function (yamlJson) {
		if (typeof yamlJson !== 'object') {
			throw new Error("Yaml file was converted to a string");
		}
		
		if (!yamlJson.paths || Object.keys(yamlJson.paths).length === 0) {
			throw new Error("Yaml file is missing api schema");
		}
		
		//loop in path
		for (var onePath in yamlJson.paths) {
			//loop in methods
			for (var oneMethod in yamlJson.paths[onePath]) {
				if (!yamlJson.paths[onePath][oneMethod].summary || yamlJson.paths[onePath][oneMethod].summary === "") {
					throw new Error("Please enter a summary for API " + oneMethod + ": " + onePath + " you want to build.");
				}
			}
		}
	},
	
	/**
	 * clone a javascript object with type casting
	 * @param obj
	 * @returns {*}
	 */
	"cloneObj": function (obj) {
		if (typeof obj !== "object" || obj === null) {
			return obj;
		}
		
		if (obj instanceof Date) {
			return new Date(obj.getTime());
		}
		
		if (obj instanceof RegExp) {
			return new RegExp(obj);
		}
		
		if (obj instanceof Array && Object.keys(obj).every(function (k) {
				return !isNaN(k);
			})) {
			return obj.slice(0);
		}
		var _obj = {};
		for (var attr in obj) {
			if (Object.hasOwnProperty.call(obj, attr)) {
				_obj[attr] = swagger.cloneObj(obj[attr]);
			}
		}
		return _obj;
	},
	
	/**
	 * map variables to meet the service configuration object schema
	 * @param serviceInfo
	 * @returns {{type: string, prerequisites: {cpu: string, memory: string}, swagger: boolean, dbs, serviceName, serviceGroup, serviceVersion, servicePort, requestTimeout, requestTimeoutRenewal, extKeyRequired, oauth, session, errors: {}, schema: {}}}
	 */
	"mapConfig": function (serviceInfo) {
		var config = {
			"type": "service",
			"prerequisites": {
				"cpu": " ",
				"memory": " "
			},
			"swagger": true,
			"injection": true,
			"serviceName": serviceInfo.serviceName,
			"serviceGroup": serviceInfo.serviceGroup,
			"serviceVersion": serviceInfo.serviceVersion,
			"servicePort": serviceInfo.servicePort,
			"requestTimeout": serviceInfo.requestTimeout,
			"requestTimeoutRenewal": serviceInfo.requestTimeoutRenewal,
			"extKeyRequired": serviceInfo.extKeyRequired,
			"oauth": serviceInfo.oauth,
			"session": serviceInfo.session,
			"errors": {},
			"schema": {}
		};
		
		if (serviceInfo.dbs && Array.isArray(serviceInfo.dbs) && serviceInfo.dbs.length > 0) {
			config["dbs"] = serviceInfo.dbs;
			config["models"] = {
				"path": '%__dirname% + "/lib/models/"',
				"name": ""
			};
			
			var modelProps = Object.keys(serviceInfo.dbs[0]);
			if (modelProps.indexOf("mongo") !== -1) {
				config.models.name = serviceInfo.dbs[0] = "mongo";
			}
			else {
				config.models.name = serviceInfo.dbs[0] = "es";
			}
		}
		
		return config;
	},
	
	/**
	 * map apis to meet service configuraiton schema from a parsed swagger yaml json object
	 * @param yamlJson
	 * @param cb
	 * @returns {*}
	 */
	"mapAPis": function (yamlJson, cb) {
		
		let all_apis = {};
		let all_errors = {};
		
		let paths = yamlJson.paths;
		let definitions = yamlJson.definitions;
		let parameters = yamlJson.parameters;
		
		let convertedDefinitions = {};
		let convertedParameters = {};
		
		// convert definitions first
		if (definitions) {
			let definitionsKeys = Object.keys(definitions);
			definitionsKeys.forEach(function (eachDef) {
				convertedDefinitions[eachDef] = convertItem(null, definitions[eachDef], 1); // 1 ??? definitions should never have schema -=-=-=-=-=
			});
		}
		
		// convert parameters then
		if (parameters) {
			let parametersKeys = Object.keys(parameters);
			parametersKeys.forEach(function (eachParam) {
				convertedParameters[eachParam] = convertItem(convertedDefinitions, parameters[eachParam], 1);
			});
			all_apis.commonFields = convertedParameters;
		}
		
		let pathsKeys = Object.keys(paths);
		pathsKeys.forEach(function (eachPath) {
			let methods = paths[eachPath];
			let methodsKeys = Object.keys(methods);
			
			methodsKeys.forEach(function (eachMethod) {
				let apiData = methods[eachMethod];
				
				if (!all_apis[eachMethod]) {
					all_apis[eachMethod] = {};
				}
				
				var mwFile = eachPath.replace(/\\/g, "_").replace(/:/g, "_").replace(/\//g, "_").replace(/[_]{2,}/g, "_").replace(/{/g, "").replace(/}/g, "");
				mwFile = mwFile.toLowerCase();
				if (mwFile[0] === "_") {
					mwFile = mwFile.substring(1);
				}
				mwFile += "_" + eachMethod.toLowerCase() + ".js";
				
				all_apis[eachMethod][eachPath] = {
					_apiInfo: {},
					"mw": '%dirname% + "/lib/mw/' + mwFile + '"'
				};
				let newSoajsApi = all_apis[eachMethod][eachPath];
				
				let params = apiData.parameters;
				
				let group = apiData.tags ? apiData.tags[0] : "";
				newSoajsApi._apiInfo.group = group && group !== '' ? group : "general";
				newSoajsApi._apiInfo.l = apiData.summary;
				newSoajsApi.imfv = convertParams(convertedDefinitions, convertedParameters, params);
			});
		});
		
		// todo: convert errors
		
		return cb({"schema": all_apis, "errors": all_errors});
	},
	
	/**
	 * function that generates the files for the microservice
	 * @param files
	 * @param callback
	 */
	"generateFiles": function (files, callback) {
		//loop on all files and write them
		async.each(files, function (fileObj, mCb) {
			var data = swagger.cloneObj(fileObj.data);
			
			//if tokens, replace all occurences with corresponding values
			if (fileObj.tokens) {
				for (var i in fileObj.tokens) {
					var regexp = new RegExp("%" + i + "%", "g");
					data = data.replace(regexp, fileObj.tokens[i]);
				}
			}
			if (fileObj.purify) {
				data = data.replace(/\\"/g, '"').replace(/["]+/g, '"').replace(/"__dirname/g, '__dirname');
				data = data.replace(/("group": "__empty__")/g, '"group": ""');
				data = data.replace(/("prefix": "(\s?|\s+),)/g, '"prefix": "",');
				data = data.replace(/("l": "__empty__")/g, '"l": ""');
				//"__dirname + \"/lib/mw/_get.js\""
				//"__dirname + "/lib/mw/_get.js""
				//"__dirname + "/lib/mw/_get.js"
				//__dirname + "/lib/mw/_get.js"
			}
			console.log("creating file:", fileObj.file);
			fs.writeFile(fileObj.file, data, "utf8", mCb);
		}, function (error) {
			if (error) {
				return callback({"code": 854, "msg": error.message});
			}
			return callback(null, true);
		});
	},
	
	"generateAPIsMw": function (directoryToUse, force, context, callback) {
		var APIs = [];
		for (var method in context.soajs.config.schema) {
			if (method !== 'commonFields') {
				for (var apiRoute in context.soajs.config.schema[method]) {
					var apiName = apiRoute.replace(/\\/g, "_").replace(/:/g, "_").replace(/\//g, "_").replace(/[_]{2,}/g, "_").replace(/{/g, "").replace(/}/g, "");
					apiName = apiName.toLowerCase();
					if (apiName[0] === "_") {
						apiName = apiName.substring(1);
					}
					APIs.push({original: apiRoute, copy: apiName + "_" + method.toLowerCase() + ".js"});
				}
			}
		}
		async.each(APIs, function (oneAPI, mCb) {
			if (force) {
				var data = fs.readFileSync(__dirname + "/tmpl/mw.txt", "utf8");
				var regexp = new RegExp("%api%", "g");
				data = data.replace(regexp, oneAPI.original);
				fs.writeFile(directoryToUse + "/lib/mw/" + oneAPI.copy, data, "utf8", mCb);
			}
			else {
				fs.exists(directoryToUse + "/lib/mw/" + oneAPI.copy, function (exists) {
					if (exists) {
						return mCb(null, true);
					}
					
					var data = fs.readFileSync(__dirname + "/tmpl/mw.txt", "utf8");
					var regexp = new RegExp("%api%", "g");
					data = data.replace(regexp, oneAPI.original);
					fs.writeFile(directoryToUse + "/lib/mw/" + oneAPI.copy, data, "utf8", mCb);
				});
			}
		}, function (error) {
			if (error) {
				return callback({"code": 854, "msg": error.message});
			}
			return callback(null, true);
		});
	}
};

module.exports = swagger;
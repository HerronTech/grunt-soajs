# grunt-soajs

> SOAJS plugin for Grunt

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-soajs --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-soajs');
```

## The "swagger2soajs" task

### Overview
In your project's Gruntfile, add a section named `swagger2soajs` to the data object passed into `grunt.initConfig()`.

### Usage Examples

```js
grunt.initConfig({
  swagger2soajs: {
    build: {
        options:{
            op: "generate",
            configPath: __dirname + "/config.js",
            swaggerPath: __dirname + "/swagger.yaml"
        }
    },
    rebuild: {
        options:{
            op: "regenerate",
            configPath: __dirname + "/config.js",
            swaggerPath: __dirname + "/swagger.yaml"
        }
    }
  }
});
```

### Options

#### options.op
Type: `String`
Default value: N/A

A string value that defines which operation should be invoked.

#### options.configPath
Type: `String`
Default value: N/A

A string value that points the location of the config.js of the microservice.

#### options.swaggerPath
Type: `String`
Default value: N/A

A string value that points the location of the swagger.yml file of the microservice.


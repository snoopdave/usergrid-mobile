Checkin
===

This is an Apache Usergrid / jQueryMobile / Cordova example project.

Prerequisites
---
To build and run Checkin you will need Apache Cordova, NPM and Grunt.
* __NPM__: install from the [NPM](http://npmjs.org) website.
* __Grunt__: install this via the NPM tool, for example `npm install -g grunt-cli`

How to build and run Checkin in a local webserver
---
1. Run `./build.sh` to download dependencies needed to run `grunt_connect`
2. Run `grunt connect` to launch in a simple web server, then browse to
[http://localhost:8080/index.html](http://localhost:8080/index.html) to see the app in action

How to build and run Checkin in the Cordova emumator
---
Something like this:

    cordova emulate iphone

Other notes
---
By default Apigee's API BaaS hosted version of Apache Usergrid and it uses the "checkin1" application of the
author's "snoopdave" organization. You can use your own API BaaS application if you wish. Just go to the
Apigee.com site and sign up for a free account. Then make sure you change the code in app.js to point to your app
like so:

    Usergrid = {
        orgName: "YOUR_ORGANIZATION_NAME",
        appName: "YOUR_APPLICATION_NAME",
        uri: "https://api.usergrid.com",
        getAppUrl : function() {
            return this.uri + "/" + this.orgName + "/" + this.appName;
        }
    };


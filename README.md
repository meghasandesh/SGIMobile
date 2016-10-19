# SGIMobile

Authors: Megha Sandesh, Arnab Sinha

This repo contains a standalone version of the BADM Web Form UI intended for use in an upcoming mobile app created with Phonegap.
The code here is intended to be used in conjunction with the AmeriFlux project. Hence all intended users should refer to http://ameriflux.lbl.gov for reference and more detail.

Requirements:

Webserver

Simply copy the code, create a webserver and run this as a website or web app.

URL format:

http://[YOUR_SERVER_NAME]?site_id=[SITE_ID]

Note: This is the TEST version of the code, intended for staging only. When moving this code into production, these changes need to be made:

1. Webservice URLs need to be changed in web-form/services.js
2. basePath needs to be set in web-form/controller.js
3. Debugging log messages need to be removed

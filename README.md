# postman_collection_monitoring application

It is node script that runs newman module which in return runs postman collections
The resulting repsonse time and call details are stored in elasticsearch with index name :"postman_collection_monitoring"

dependency needed: elasticsearch configured locally

Setup:
1) run npm install from root folder
2) store the postman collection json and environment json files in /postman-collection and /environment-collection folder respectively and add the entries of the filename with extensions in config.json file
3) run node app.js

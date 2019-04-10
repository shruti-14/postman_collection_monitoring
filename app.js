const newman = require('newman'); //Runs postman collection via cmd
const fs = require('fs'); //this module allows you to work with the file system of your computer
const cron = require('node-cron'); // task scheduler in pure JavaScript for node.js
const async = require('async'); //to work with asynchronous javascript
const client = require('./elastic'); //requiring elastic instance

// cron.schedule('*/5 * * * *',function(){
    const indexName = "postman_collection_monitoring";
    let collectionName = "";
    
    let configFileContents = fs.readFileSync('./config.json') //reading the file synchronously
    let configFileJson = JSON.parse(configFileContents);
    let collectionDetailsList = configFileJson.collections;

    collectionDetailsList.forEach(collectionObject => {
        console.log(collectionObject);
        executeNewman(collectionObject);
    });

    function executeNewman(collectioObject){
        console.log("<------------------------Running newman for " + collectioObject['collectionName'] +"------------------------------->");
        //call newman.run to pass options and wait for callback
        newman.run({
            collection:require("./postman-collection/"+collectioObject['collectionName']),
            reporters:['cli','json'],
            // environment:require("./environment-collection"+collectioObject.environment),
            reporter:{json :{export : './'+collectioObject['collectionName']+'Output.json'}}
        },function(err){
            if(err){
                throw err;
            }
            console.log("<--------------------------------collection run completed--------------------------------------------->");
            // it is a sync call so it will allow the further code to execute only when the file reading is completed
            let outputContentFileContents = fs.readFileSync('./'+collectioObject['collectionName']+'Output.json');
            let outputFileJson = JSON.parse(outputContentFileContents);
            let queryDetailArray = outputFileJson.run.executions;

            let d = new Date();
            queryDetailArray.forEach(ele=>{
                let respTime="";
                let status;
                let code;

                if(!ele.response){
                    respTime=NaN;
                    status="Error";
                    code=503;
                }

                else{
                    respTime= ele.response.responseTime;
                    status= ele.response.status;
                    code=ele.response.code;
                }
                client.index({
                    index:indexName,
                    type:"queries",
                    body:{
                        "name":ele.item.name,
                        "collectionName":outputFileJson.collection.info.name,
                        "timestamp":d.toISOString(),
                        "responseTime":respTime,
                        "status":status,
                        "status-code":code
                    }
                },function(err,resp){
                    console.log("<-------------------------------------------------------Elasticsearch response------------------------------------>");
                    console.log(err);
                });
            });
        });
    }

// });





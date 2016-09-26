/**
 * Created by Rahil on 23-09-2016.
 */
//db.getCollection('StockQuote').find({},{_id:1,ticker:1,_p_stockId:1})
//this is the robomongo query
"use strict";
var fs = require('fs');var request = require('request');
var contents = fs.readFileSync('stocks.txt').toString();
var contentStockQuote = fs.readFileSync('stockQuote.txt').toString();
var configTalkoot = require('./config.json');
var Parse=require('parse/node');
var APP_ID = configTalkoot.parseBackend_APP_ID;
var JAVASCRIPT_KEY = configTalkoot.parseBackend_JAVASCRIPT_KEY;
Parse.initialize(APP_ID, JAVASCRIPT_KEY);
Parse.serverURL = configTalkoot.parseBackendServerURL;
var splitContents =  contents.split("*/");
var tmpNum = 2;var arrayOfStocks = [];
for (var i=1;i<splitContents.length;i++){
    var trimObj = splitContents[i].trim();
    var tmpString = "/* " + tmpNum;
    var replacedObj = trimObj.replace(tmpString,"");
    var convertedObj = JSON.parse(replacedObj);
    arrayOfStocks.push(convertedObj);
    tmpNum = tmpNum + 1;
}
//mapping tickers to objectId of stockQuote
var splitStockQuoteContents = contentStockQuote.split("*/");
tmpNum =2 ; var tickerToObjectMapping = {};
for (var kk=1;kk<splitStockQuoteContents.length;kk++){
    var trimObj = splitStockQuoteContents[kk].trim();
    var tmpString = "/* " + tmpNum;
    var replacedObj = trimObj.replace(tmpString,"");
    var convertedObj = JSON.parse(replacedObj);
    if (tickerToObjectMapping[convertedObj.ticker]){
        var oidArray = tickerToObjectMapping[convertedObj.ticker].id;
        var pidArray = tickerToObjectMapping[convertedObj.ticker].stockId;
        oidArray.push(convertedObj._id);pidArray.push(convertedObj._p_stockId.substr(6));
        tickerToObjectMapping[convertedObj.ticker].id = oidArray;
        tickerToObjectMapping[convertedObj.ticker].stockId = pidArray;

    }
    else {
        tickerToObjectMapping[convertedObj.ticker] = {};
        var oidArray = [];var pidArray=[];
        oidArray.push(convertedObj._id);pidArray.push(convertedObj._p_stockId.substr(6));
        tickerToObjectMapping[convertedObj.ticker].id = oidArray;
        tickerToObjectMapping[convertedObj.ticker].stockId = pidArray;
       // tickerToObjectMapping[convertedObj.ticker].id = convertedObj._id;
       // tickerToObjectMapping[convertedObj.ticker].stockId = convertedObj._p_stockId.substr(6);
    }
    tmpNum = tmpNum + 1;
}

var totalLen = arrayOfStocks.length;
//dividing into chunks of 100
var ii,jj,temparray,chunk = 95;
var tArray = [];var tArrayStockId = [];var tArrayStockTicker = [];
for (ii=0,jj=totalLen; ii<jj; ii+=chunk) {
    temparray = arrayOfStocks.slice(ii,ii+chunk);
    var urlPart = temparray;
    var urlPartString = "";
    var tempStockIds = [];
    var tempStockTicker = [];
    for(var kk=0;kk<urlPart.length;kk++){
        var urlPartExchange = urlPart[kk].exchange;
        var stockId = urlPart[kk]._id;
        var urlPartTicker = urlPart[kk].ticker;
        var combinedPart = urlPartExchange + ":" + urlPartTicker;
        var encodedPart = encodeURIComponent(combinedPart);
        urlPartString = urlPartString + encodedPart + ",";
        tempStockIds.push(stockId);
        tempStockTicker.push(urlPartTicker);

    }
   // console.log(urlPartString);
    tArray.push(urlPartString);
    tArrayStockId.push(tempStockIds);
    tArrayStockTicker.push(tempStockTicker);
}
//there is a total of 60 stock strings
var urlBase = 'http://finance.google.com/finance/info?infotype=infoquoteall&q=';
var numberRequest = 0;
var timeStarted = new Date().getTime();
var makeRequest = function () {
    var queryTimestamp = new Date();
    for (var jjj=0;jjj<tArray.length;jjj++){
        let requestNumber = numberRequest % 60;
        let urlToSend = urlBase + tArray[jjj];
        let stockIdsArr = tArrayStockId[jjj];
        let stockTickerArr = tArrayStockTicker[jjj];
        let options = {
            url: urlToSend ,
            headers: {
                'User-Agent': 'Mozilla'
            },
            timeout: 1200000
        };
        request(options, function callback(error, response, body) {
            console.log("*******************************************************************");
            console.log("This is requestNumber (the order in which they were called):: " + requestNumber);
            console.log("This is the url :: " + urlToSend);
            console.log("This is totalNumber of requests till now:: " + numberRequest);
            console.log("*******************************************************************");
            var time = new Date().getTime();
            if (error) {
                console.log("****************************************************************");
                console.log("came in error");
                console.log(error);
                console.log("Time elapsed ::: " + (time - timeStarted)/1000);
                console.log("****************************************************************");
                clearInterval(globalInterval);
            }
                    else{
            console.log("Time elapsed ::: " + (time - timeStarted)/1000);
            if(body.toString().includes("detected unusual")){
                console.log("body contains it quit");
                clearInterval(globalInterval);
                console.log(body);
            }
            else {
            console.log("No error occurred");
            var receivedResult = JSON.parse(body.substr(3));
            console.log("Total Number of Stocks Received are " + receivedResult.length);
            //loop thru and match all the tickers
            //make a list and then push to parse-server for saving
            var openArray = [];var queryTimestampArray = [];var timestampArray = [];
            var highArray = [];var lowArray = [];var closeArray = [];var changeArray = [];
            var volumeArray = [];var objectIdArray = [];var tickerArray = [];var stockPointerArray = [];
            for(var xy=0;xy<receivedResult.length;xy++){
                //check the condition where ticker is not returned
                //also we should have that ticker with us then only proceed
                if (receivedResult[xy].t){
                    if (tickerToObjectMapping[receivedResult[xy].t]) {
                        //now check if it contains more than one objects associated with the ticker
                        var oidArrays = tickerToObjectMapping[receivedResult[xy].t].id;
                        var pidArrays = tickerToObjectMapping[receivedResult[xy].t].stockId;
                        var lenOidArray = oidArrays.length;
                        if (lenOidArray > 0) {
                            for (var ll=0;ll<lenOidArray;ll++) {
                                if (receivedResult[xy].hi != "" && receivedResult[xy].lo != "" && receivedResult[xy].l_fix != "" && receivedResult[xy].op != "") {
                                    var changes = (parseFloat(receivedResult[xy].c_fix.replace(",", "")) == null) ? undefined : parseFloat(receivedResult[xy].c_fix.replace(",", ""));
                                    var volumes = (parseFloat(receivedResult[xy].vo.replace(",", "")) == null) ? undefined : parseFloat(receivedResult[xy].vo.replace(",", ""));
                                    var opens = (parseFloat(receivedResult[xy].op.replace(",", "")) == null ) ? undefined : parseFloat(receivedResult[xy].op.replace(",", ""));
                                    var closes = (parseFloat(receivedResult[xy].l_fix.replace(",", "")) == null ) ? undefined : parseFloat(receivedResult[xy].l_fix.replace(",", ""));
                                    var highs = (parseFloat(receivedResult[xy].hi.replace(",", "")) == null ) ? undefined : parseFloat(receivedResult[xy].hi.replace(",", ""));
                                    var lows = (parseFloat(receivedResult[xy].lo.replace(",", "")) == null ) ? undefined : parseFloat(receivedResult[xy].lo.replace(",", ""));
                                    highArray.push(highs);
                                    lowArray.push(lows);
                                    closeArray.push(closes);
                                    openArray.push(opens);
                                    changeArray.push(changes);
                                    volumeArray.push(volumes);
                                    queryTimestampArray.push(new Date(queryTimestamp));
                                    if (receivedResult[xy].lt_dts != '') {
                                        //find the gmt offset and subtract it from the time given
                                        var gmtOffset = 330 * 60 * 1000; //as we are only doing indian stocks , it will be 5:30 ==
                                        var dateReceived = new Date(receivedResult[xy].lt_dts).getTime();
                                        dateReceived = dateReceived - gmtOffset;
                                        timestampArray.push(new Date(dateReceived));
                                    }
                                    else {
                                        //when not timestamp ...what to do
                                        timestampArray.push(new Date(queryTimestamp));
                                    }
                                    tickerArray.push(receivedResult[xy].t);
                                    objectIdArray.push(oidArrays[ll]);
                                    stockPointerArray.push(pidArrays[ll]);
                                }
                                else {
                                    console.log("open high low or close was not not present :: " + receivedResult[xy].t);
                                }
                            }
                        }
                    }
                    else {
                        console.log("ticker name not found our side....google might have changed it  :: "  + receivedResult[xy].t);
                    }
                }
                else {
                    console.log("ticker not returned by google :: " + + receivedResult[xy].t);
                }
            }
            Parse.Cloud.run("updateStockQuotes",{open:openArray,queryTimestamp:queryTimestampArray,timestamp:timestampArray,
                high:highArray,low:lowArray,close:closeArray,change:changeArray,volume:volumeArray,ticker:tickerArray
                ,objectId:objectIdArray,stockIdPointer:stockPointerArray})
                .then(function (success) {
                    console.log("in success");
                },function (error) {
                    console.log("in error");
                });
        }
        //     else {
        //             console.log("No error occurred");
        //             var receivedResult = JSON.parse(body.substr(3));
        //             console.log("Total Number of Stocks Received are " + receivedResult.length);
        //             var stockQuotesObjArray = [];
        //             var StockQuotes = Parse.Object.extend("StockQuote");
        //             var stockIdLength = stockIdsArr.length;
        //             for(var xy=0;xy<stockIdLength;xy++){
        //                 var stockQuotesObject = new Parse.Object("StockQuote");
        //                 stockQuotesObject.set({stockId:{"__type":"Pointer","className":"Stock","objectId":stockIdsArr[xy]},
        //                     ticker:stockTickerArr[xy]});
        //                 stockQuotesObjArray.push(stockQuotesObject);
        //             }
        //             Parse.Object.saveAll(stockQuotesObjArray).then (function (success) {
        //                 console.log(s)
        //                 // console.log(success);
        //                 //  response.success(success);
        //                 console.log("came in success");
        //             }, function (error) {
        //                 console.log(error);
        //                 //  response.error(error);
        //             });
        //         }
            }
        });
        requestNumber =requestNumber  + 1;
        numberRequest = numberRequest + 1 ;
    }
};
makeRequest();
var globalInterval = setInterval(makeRequest,300000);


//initialization code
// else {
//     console.log("No error occurred");
//     var receivedResult = JSON.parse(body.substr(3));
//     console.log("Total Number of Stocks Received are " + receivedResult.length);
//     var stockQuotesObjArray = [];
//     var StockQuotes = Parse.Object.extend("StockQuotes");
//     var stockIdLength = stockIdsArr.length;
//     for(var xy=0;xy<stockIdLength;xy++){
//         var stockQuotesObject = new Parse.Object("StockQuotes");
//         stockQuotesObject.set({stockId:{"__type":"Pointer","className":"Stock","objectId":stockIdsArr[xy]},
//             ticker:stockTickerArr[xy]});
//         stockQuotesObjArray.push(stockQuotesObject);
//     }
//     Parse.Object.saveAll(stockQuotesObjArray).then (function (success) {
//         console.log(s)
//         // console.log(success);
//         //  response.success(success);
//         console.log("came in success");
//     }, function (error) {
//         console.log(error);
//         //  response.error(error);
//     });
// }



//saving with new values
// else {
//     console.log("No error occurred");
//     var receivedResult = JSON.parse(body.substr(3));
//     console.log("Total Number of Stocks Received are " + receivedResult.length);
//     //loop thru and match all the tickers
//     //make a list and then push to parse-server for saving
//     var openArray = [];var queryTimestampArray = [];var timestampArray = [];
//     var highArray = [];var lowArray = [];var closeArray = [];var changeArray = [];
//     var volumeArray = [];var objectIdArray = [];var tickerArray = [];var stockPointerArray = [];
//     for(var xy=0;xy<receivedResult.length;xy++){
//         //check the condition where ticker is not returned
//         //also we should have that ticker with us then only proceed
//         if (receivedResult[xy].t){
//             if (tickerToObjectMapping[receivedResult[xy].t]) {
//                 if (receivedResult[xy].hi == "" || receivedResult[xy].lo == "" || receivedResult[xy].l_fix == "" || receivedResult[xy].op == "" ) {
//                     openArray.push(parseFloat(receivedResult[xy].op.replace(",", "")));
//                     queryTimestampArray.push(new Date(queryTimestamp));
//                     if (receivedResult[xy].lt_dts != '') {
//                         timestampArray.push(new Date(receivedResult[xy].lt_dts));
//                     }
//                     else {
//                         //when not timestamp ...what to do
//                         timestampArray.push(new Date(queryTimestamp));
//                     }
//                     highArray.push(parseFloat(receivedResult[xy].hi.replace(",", "")));
//                     lowArray.push(parseFloat(receivedResult[xy].lo.replace(",", "")));
//                     closeArray.push(parseFloat(receivedResult[xy].l_fix.replace(",", "")));
//                     var changes = parseFloat(receivedResult[xy].c_fix.replace(",", ""));
//                     var volumes = parseFloat(receivedResult[xy].vo.replace(",", ""));
//                     if (changes == null){
//                         console.log(changes);
//                         console.log("it was null");
//                         changes = undefined;
//                     }
//                     if (volumes == null){
//                         console.log(volumes);
//                         console.log("volume was null")
//                         volumes =  undefined;
//                     }
//                     changeArray.push(changes);
//                     volumeArray.push(volumes);
//                     tickerArray.push(receivedResult[xy].t);
//                     objectIdArray.push(tickerToObjectMapping[receivedResult[xy].t].id);
//                     stockPointerArray.push(tickerToObjectMapping[receivedResult[xy].t].stockId);
//                 }
//                 else{
//                     console.log("open high low or close was not not present")
//                 }
//             }
//             else {
//                 console.log("ticker name not found our side....google might have changed it");
//             }
//         }
//         else {
//             console.log("ticker not returned by google");
//         }
//     }
//     Parse.Cloud.run("updateStockQuotes",{open:openArray,queryTimestamp:queryTimestampArray,timestamp:timestampArray,
//         high:highArray,low:lowArray,close:closeArray,change:changeArray,volume:volumeArray,ticker:tickerArray
//         ,objectId:objectIdArray,stockIdPointer:stockPointerArray})
//         .then(function (success) {
//             console.log("in success");
//         },function (error) {
//             console.log("in error");
//         });
// }
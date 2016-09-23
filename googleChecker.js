/**
 * Created by Rahil on 23-09-2016.
 */
var request = require('request');
var url = 'https://finance.google.com/finance/info?client=ig&q=NIFTY%3ANSE%2CBANKNIFTY%3ANSE%2CSBIN%3ANSE%2CSENSEX%3AINDEXBOM%2CICICIBANK%3ANSE';
var numberRequest = 0;
var timeStarted = new Date().getTime();
var options = {
    url: url,
    headers: {
        'User-Agent': 'Mozilla'
    }
};

var makeRequest = function () {
    numberRequest = numberRequest + 1 ;
    request(options, function callback(error, response, body) {
        var time = new Date().getTime();
        if (error) {
            console.log("****************************************************************");
            console.log("came in error");
            console.log(error);
            console.log("Request Number ::: " + numberRequest);
            console.log("Time elapsed ::: " + (time - timeStarted)/1000);
            console.log("****************************************************************");
            clearInterval(globalInterval);
        }
        else{
            console.log("*****************************************************************");
            console.log("came in body");
            console.log("Request Number ::: " + numberRequest);
            console.log("Time elapsed ::: " + (time - timeStarted)/1000);
            //console.log(body);
            console.log("*****************************************************************");
        }
    });

};
var globalInterval = setInterval(makeRequest,3000);


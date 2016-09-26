/**
 * Created by Rahil on 23-09-2016.
 */
var request = require('request');
//var url = 'https://finance.google.com/finance/info?client=ig&q=NIFTY%3ANSE%2CBANKNIFTY%3ANSE';
var url = 'https://finance.google.com/finance/info?client=ig&q=LUPIN%3ANSE%2CAXISBANK%3ANSE%2CINFY%3ANSE%2CTATASTEEL%3ANSE%2CSUZLON%3ANSE%2CTATAMOTORS%3ANSE%2CPNB%3ANSE%2CRELCAPITAL%3ANSE%2C.DJI%3AINDEXDJX%2CBHEL%3ANSE%2CULTRACEMCO%3ANSE%2CVEDL%3ANSE%2CRCOM%3ANSE%2CRELIANCE%3ANSE%2CEICHERMOT%3ANSE%2CTECHM%3ANSE%2CDRREDDY%3ANSE%2CAUROPHARMA%3ANSE%2CLT%3ANSE%2CSUNPHARMA%3ANSE%2CONGC%3ANSE%2CESCORTS%3ANSE%2CKWALITY%3ANSE%2CPRESTIGE%3ANSE%2CNBCC%3ANSE%2CBLUEDART%3ANSE%2CM%26M%3ANSE%2CEDELWEISS%3ANSE%2CGREENPLY%3ANSE%2CGAIL%3ANSE%2CMANGALAM%3ANSE%2CSADBHAV%3ANSE%2CECLERX%3ANSE%2CHDFC%3ANSE%2CPETRONET%3ANSE%2CREDINGTON%3ANSE%2CHCLTECH%3ANSE%2CTATAPOWER%3ANSE%2CPNC%3ANSE%2CBIOCON%3ANSE%2CNESTLEIND%3ANSE%2CRUSHIL%3ANSE%2CDCM%3ANSE%2CALLCARGO%3ANSE%2CBRITANNIA%3ANSE%2CRELIGARE%3ANSE%2CVOLTAS%3ANSE%2CNTPC%3ANSE%2CIGL%3ANSE%2CPRABHAT%3ANSE%2CSUNTV%3ANSE%2CHEXAWARE%3ANSE%2C531499%3ABOM%2CHINDPETRO%3ANSE%2CPFS%3ANSE%2CSBIN%3ANSE%2CUFLEX%3ANSE%2CIBREALEST%3ANSE%2CPOWERGRID%3ANSE%2C';


var numberRequest = 0;
var timeStarted = new Date().getTime();
var options = {
    url: url,
    headers: {
        'User-Agent': 'Mozilla'
    }
};

var makeRequest = function () {
    for (var i=0;i<40;i++){
        request(options, function callback(error, response, body) {
            numberRequest = numberRequest + 1 ;
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
                console.log("Request Number ::: " + numberRequest);
                if(body.toString().includes("detected unusual")){
                    console.log("body contains it quit");
                    console.log("Time elapsed ::: " + (time - timeStarted)/1000);
                    clearInterval(globalInterval);
                    console.log(body);
                }
                else {
                  //  console.log(body)
                }
                console.log("*****************************************************************");
            }
        });
    }



};

makeRequest();
var globalInterval = setInterval(makeRequest,300000);



var OAuth = require("oauth"),
    File = require("file"),
    conf = JSON.parse(File.read("jack.conf", {charset:"UTF8"})),
    XHR = require("browser/xhr").XMLHttpRequest,
    Couch = require("couchdb"),
    User = require("../models/user");

var twitterAPI = {
    signatureMethod      : "HMAC-SHA1",
    requestTokenURL      : "http://twitter.com/oauth/request_token",
    userAuthorizationURL : "http://twitter.com/oauth/authenticate",
    accessTokenURL       : "http://twitter.com/oauth/access_token"
};

exports.login = function(request)
{
    var accessor = { 
        consumerSecret: conf.TWITTER_API_SECRET, 
        tokenSecret   : ""
    };

    var message = { 
        action: twitterAPI.requestTokenURL, 
        method: "GET", 
        parameters: [
            ["oauth_version","1.0"],
            ["oauth_consumer_key",conf.TWITTER_API_KEY]
        ]
    };

    OAuth.completeRequest(message, accessor);

    var responseValues = sendOAuthMessage(message);

    if (responseValues)
    {    
        var accessor = { 
            consumerSecret: conf.TWITTER_API_SECRET, 
            tokenSecret   : responseValues.oauth_token_secret
        };
    
        var message = { 
            action: twitterAPI.userAuthorizationURL, 
            method: "GET", 
            parameters: [
                ["oauth_token", responseValues.oauth_token],
                ["oauth_version","1.0"],
                ["oauth_consumer_key",conf.TWITTER_API_KEY]
            ]
        };
    
        OAuth.completeRequest(message, accessor);
    
        return function(){
            return {
                status: 303,
                headers: {
                    "Location":messageURL(message), 
                    "Content-Type":"text/html", 
                    "Set-Cookie": "login_redirect="+encodeURIComponent(request.referer())+"; path=/;"
                },
                body: []
            };
        };
    }
    else
    {
        //do something more sophistacted for errors
        return {};
    }
};

exports.authorize = function(request)
{
    var authToken = request.GET("oauth_token");

    var accessor = { 
        consumerSecret: conf.TWITTER_API_SECRET, 
        tokenSecret   : ""
    };

    var message = { 
        action: twitterAPI.accessTokenURL, 
        method: "GET", 
        parameters: [
            ["oauth_token", authToken],
            ["oauth_version","1.0"],
            ["oauth_consumer_key",conf.TWITTER_API_KEY]
        ]
    };

    OAuth.completeRequest(message, accessor);

    var user = sendOAuthMessage(message);
    
    if (user)
    {
        var saved = User.createOrUpdate(user);

        var redirect = request.cookies()["login_redirect"];
    
        return function(){
            return {
                status: 303,
                headers: {
                    "Location": redirect ? decodeURIComponent(redirect) : "/", 
                    "Content-Type":"text/html", 
                    "Set-Cookie": User.sessionHeaderForUser(user)
                },
                body: []
            };
        };
    }
    else
    {
        //do something more sophistacted for errors
        return {};
    }
};

var sendOAuthMessage = function(message)
{
    var x = new XHR(),
        response;
    
    x.open(message.method, messageURL(message), false);
    x.onreadystatechange = function()
    {
        if (x.status === 200 && x.readyState === 4)
            response = x.responseText;
    }

    x.send(messageBody(message));

    if (response)
    {
        var responseValues = {},
            responsePairs = response.split("&");
    
        responsePairs.forEach(function(pair){
            var pairValues = pair.split("=");
            responseValues[pairValues[0]] = pairValues[1];
        });

        return responseValues;
    }
    else
        return null;
}

var sortMessageParameters = function(message)
{
    message.parameters.sort(function(a, b){
        if (a[0] < b[0])
            return -1;
        else if (b[0] < a[0])
            return 1;
        else
            return 0;
    });
};

var messageURL = function(message)
{
    if (message.method !== "GET")
        return message.action;

    return messageString(message, message.action, "?");
};

var messageBody = function(message)
{
    if (message.method === "GET")
        return "";

    return messageString(message, "", "");
};

var messageString = function(message, prefix, separator)
{
    var body = prefix || "";

    sortMessageParameters(message);
    message.parameters.forEach(function(parameterPair){
        body += separator+parameterPair.join("=");
        separator = "&";
    });

    return body;
}


var HTTP = require("http"),
    XHR = require("browser/xhr").XMLHttpRequest,
    User = require("../models/user"),
    Jack = require("jack"),
    base64 = require("base64"),
    HTMLParser = require("htmlparser").HTMLParser,
    sizzle = require("sizzle").sizzle;

var tagPropertyReplacementMap = [
    ["img", "src"],
    ["script", "src"],
    ["link", "href"],
    ["a", "href"],
    ["embed", "src"]
];

exports.Proxy = function(localRoot, remoteRoot)
{
    return function(env)
    {
        var httpMethod = env["REQUEST_METHOD"]
            pathInfo = decodeURIComponent(env["PATH_INFO"]),
            remainderPath = pathInfo;

        if (pathInfo.indexOf(localRoot) === 0)
            remainderPath = pathInfo.substring(pathInfo.indexOf(localRoot) + localRoot.length);

        var remotePath = remoteRoot+"/"+remainderPath,
            user = User.userForRequest(new Jack.Request(env)),
            originalHeaders = {};

        for (var i in env)
        {
            if (i.indexOf("HTTP_") === 0)
                originalHeaders[i.substring("HTTP_".length)] = env[i];
        }
        
        // Remove this to make the proxy generic
        if (user)
            originalHeaders["Authorization"] = "Basic "+(base64.encode(user.screen_name+":"+user.session));

        var request = new XHR();
        
        request.open(httpMethod, remotePath, false);

        for (var i in originalHeaders)
            request.setRequestHeader(i, String(originalHeaders[i]));

        request.send(env["jack.request.body"]);

        var responseContentType = request.getResponseHeader("Content-Type"),
            responseBody = request.responseText,
            responseHeaders = request._responseHeaders;

        responseHeaders["Content-Type"] = responseContentType || "text/plain";

        if (responseContentType === "text/html" || responseContentType === "application/xhtml")
        {
            var html = responseBody,
                parser = new HTMLParser(),
                document = parser.parse(html),
                $ = sizzle(document);
            
            for (var i = 0, count = tagPropertyReplacementMap.length; i < count; i++)
            {
                var thisTag = tagPropertyReplacementMap[i][0],
                    thisProp = tagPropertyReplacementMap[i][1];
                    
                $(thisTag).forEach(function(el) {
                    if (el.getAttribute(thisProp) && el.getAttribute(thisProp).indexOf(localRoot) !== 0 && el.getAttribute(thisProp).indexOf("/") === 0)
                    {
                        el._raw.setAttribute(thisProp, localRoot+el.getAttribute(thisProp));
                    }
                });            
            }
            
            responseBody = String(document.documentElement._raw.getOwnerDocument().getNodeValue());
            responseHeaders["Content-Length"] = String(responseBody.length);
            print(responseBody);
        }

        return {
            status: request.status,
            headers: responseHeaders,
            body: [responseBody]
        }
    }
}

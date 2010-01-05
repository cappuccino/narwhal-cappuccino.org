
var Demo = require("../models/demo").Demo,
    OS = require("os"),
    allDemos = Demo.allDemos();

exports.get = function(request)
{
    return {demos:allDemos};
}

exports.archive = function(request, pathComponents)
{
    if (pathComponents.length < 2)
        return;

    pathComponents.pop(); //lose the action;

    var demoPath = unencodeSpaces(pathComponents.join("/")),
        zipBytes = OS.popen("cd public/demos; zip -ry -8 - '"+demoPath+"'").stdout.raw.read();

    if (zipBytes.length)
    {
        return function(){
            return {
                status: 200,
                headers: {"Content-Type":"multipart/x-zip", "Content-Disposition":"attachment; filename="+demoPath+".zip"},
                body: [zipBytes]
            }
        };
    }
    else
    {
        return function(){
            return {
                status: 404,
                headers: {"Content-Type":"text/plain"},
                body: ["No such demo."]
            }
        }    
    }
}

var unencodeSpaces = function(string)
{
    return string.replace(/%20/g, " ");
}

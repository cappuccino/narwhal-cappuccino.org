
var File = require("file");

var downloadsPath = "public/downloads";

var getAvailableCappuccinoDownloads = function()
{
    var matchingDownloads = File.path(downloadsPath).glob("CappuccinoStarter-*.zip"),
        availableDownloads = [];

    matchingDownloads.forEach(function(d)
    {
        var version = d.substring("CappuccinoStarter-".length, d.indexOf(".zip"));
        availableDownloads.push({
            version: version,
            starterURL: "/"+downloadsPath+"/CappuccinoStarter-"+version+".zip",
            toolsURL: "/"+downloadsPath+"/CappuccinoTools-"+version+".zip"
        })
    });

    availableDownloads.sort(function(a, b){
        var aComponents = a.version.split("."),
            bComponents = b.version.split(".");

        while (aComponents.length || bComponents.length)
        {
            var aVal = parseInt(aComponents.shift(), 10),
                bVal = parseInt(bComponents.shift(), 10);

            if (aVal && !bVal)
                return -1;
            else if (bVal && !aVal)
                return 1;
            else if (aVal > bVal)
                return -1;
            else if (bVal > aVal)
                return 1;
        }

        return 0;
    });
    
    return availableDownloads;
}

exports.latest = function(request, pathComponents)
{
    var latest = getAvailableCappuccinoDownloads()[0];

    switch(pathComponents[0])
    {
        case "starter":
            return function(){
                return {
                    status: 302,
                    headers: {Location:latest.starterURL, "Content-Type":"text/plain"},
                    body: []
                }
            }
            
        case "tools":
            return function(){
                return {
                    status: 302,
                    headers: {Location:latest.toolsURL, "Content-Type":"text/plain"},
                    body: []
                }
            }
    }

    return function(){
        return {
            status: 302,
            headers: {Location:"/downloads"},
            body: []
        }
    }
}

exports.get = function(request)
{
    return {
        downloads: getAvailableCappuccinoDownloads()
    }
}

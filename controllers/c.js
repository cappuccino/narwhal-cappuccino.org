
var Couch = require("couchdb"),
    HTTP = require("http");

var databaseURL = "http://127.0.0.1:5984/",
    connection = Couch.connect(databaseURL),
    cappSiteDB = connection.database("cappuccino/site");

exports.get = function(request, remainingComponents)
{
    // pass through urls like this:
    // http://cappuccino.org/c/cappuccino/site/hash/attachment.ext
    var index = remainingComponents.length;
    
    if (index < 3)
        return;

    try {
        // we want to grab "cappuccino/site" as our database name, 
        // "hash" as our document name, and attachment.ext as our filename
        var filename = remainingComponents[--index],
            hash = remainingComponents[--index],
            databaseName = remainingComponents.slice(0, index).join("/");
            
        //for now, let's hard code the database
        //database = connection.database(databaseName, true);
        var database = cappSiteDB;
        
        // then we pull the file from couch:
        // http://localhost:5984/cappuccino%2Fsite/hash/attachment.ext
        // and return its contents as a byte array
        var attachment = database.find(hash)._attachments[filename],
            contentType = attachment.content_type,
            contentLength = attachment.length,
            data = HTTP.read(databaseURL+encodeURIComponent(databaseName)+"/"+hash+"/"+filename);

        return function(){
            return {
                status : 200,
                headers : {"Content-Type":contentType, "Content-Length":String(contentLength)},
                body : [data]
            }
        }
    }
    catch (e) {
        print(e+" error trying to read attachment from couch database ("+remainingComponents.join("/")+")");
    }
    
    return remainingComponents;
}

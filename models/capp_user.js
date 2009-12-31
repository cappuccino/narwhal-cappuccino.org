
var Couch = require("couchdb");

var databaseConnection = Couch.connect("http://127.0.0.1:5984/"),
    siteDatabase = databaseConnection.database("cappuccino/site");

exports.allCappuccinoUsers = function()
{
    return siteDatabase.view("site", "capp_users").rows.map(function(d){return d.value});
}

exports.randomUsers = function(howMany, options)
{
    var allUsers = exports.allCappuccinoUsers(),
        resultSet = [];

    var filteredUsers = options.options ? allUsers.filter(function(user)
    {
        var result = YES;
        options.options.forEach(function(opt){
            result &= user[opt] !== undefined;
        });
        
        return result;
    }) : allUsers;

    var count = 0;
    while (count < howMany && count < filteredUsers.length)
    {
        resultSet.push(quotes[Math.floor(Math.random()*quotes.length)]);
        count++;
    }

    return resultSet;
}

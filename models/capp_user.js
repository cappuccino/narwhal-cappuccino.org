
var Couch = require("couchdb");

var databaseConnection = Couch.connect("http://127.0.0.1:5984/"),
    siteDatabase = databaseConnection.database("cappuccino/site");

exports.allCappuccinoUsers = function()
{
    return siteDatabase.view("site", "capp_users").rows.map(function(d){return d.value});
}

// returns howMany or less random cappuccino users
// filters is an optional array of properties which should evaluate to true through type coercion
//
// ex. randomUsers(5, ["frontpage", "red"])
// would return 5 users with frontpage:true and red:true

exports.randomUsers = function(howMany, filters)
{
    var allUsers = exports.allCappuccinoUsers(),
        resultSet = [];

    var filteredUsers = filters ? allUsers.filter(function(user)
    {
        var result = YES;
        filters.forEach(function(opt){
            result &= user[opt] == true;
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

exports.create = function(name, description, url, image_url)
{
    return siteDatabase.save({
        type: "capp_user",
        name: name,
        description: description,
        url: url
    });
}

exports.remove = function(user)
{
    return siteDatabase.removeDoc(user);
}

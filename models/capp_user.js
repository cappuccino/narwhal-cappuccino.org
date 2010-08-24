
var Couch = require("couchdb");

//var databaseConnection = Couch.connect("http://127.0.0.1:5984/"),
//    siteDatabase = databaseConnection.database("cappuccino/site");

exports.allCappuccinoUsers = function()
{
    return [
        {_id: "05edcd8156cbb3653a2061afaa9991a1", type: "capp_user", name: "Mockingbird", description: "Wireframes on the fly.", url: "http://gomockingbird.com/", image_url: "/public/images/mockingbird.png", front_page: true},
        {_id: "1d84bcb6a66e8812e7fe8e2dd50f6565", type: "capp_user", name: "Atlas", description: "Powerful IDE for building Cappuccino applications.", url: "http://280atlas.com/", image_url: "/public/images/Atlas.png", front_page: true},
        {_id: "a341d04b802d65f3a99e6ccda6efb28d", type: "capp_user", name: "280 Slides", description: "Create beautiful presentations in minutes.", url: "http://280slides.com/", image_url: "/public/images/280slidesThumb.png", front_page: true},
        {_id: "de7156bd5336b23edde46dfc302ee67c", type: "capp_user", name: "Almost.at", description: "Track events in real time, with style.", url: "http://almost.at/", image_url: "/public/images/almost.png", front_page: true}
    ];
    
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
        var result = true;
        filters.forEach(function(opt){
            result &= user[opt] == true;
        });
        
        return result;
    }) : allUsers;

    var count = 0;
    while (count++ < howMany && filteredUsers.length)
        resultSet.push(filteredUsers.splice(Math.floor(Math.random()*filteredUsers.length), 1)[0]);

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

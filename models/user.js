var Couch = require("couchdb");

//var databaseConnection = Couch.connect("http://127.0.0.1:5984/"),
//    usersDatabase = databaseConnection.database("cappuccino/users");

var users = {},
    sessions;

exports.createOrUpdate = function(user)
{
    var u = {
        id: require("uuid").uuid().replace(/-/g, ""),
        session: require("uuid").uuid().replace(/-/g, ""),
        user_id: user
    };

    users[user] = u;
    sessions[u.session] = u;

    return;

    //FIXME
    var docs = usersDatabase.view("users", "by_user_id", {key:user.user_id});
    
    if (docs && docs.total_rows === 1)
    {
        var originalDoc = docs.rows[0].value;
        user._id = originalDoc._id;
        user._rev = originalDoc._rev;
    }
    
    user.session = require("uuid").uuid().replace(/-/g, "");    
    return usersDatabase.save(user);
}

exports.userForRequest = function(request)
{
    var sessionID = request.cookies()["cpSession"];

    if (sessionID)
    {
        if (sessions[sessionID])
            return sessions[sessionID];
        else
            return null

        // FIXME
        var docs = usersDatabase.view("users", "by_session", {key:sessionID});
        if (docs && docs.rows.length === 1)
            return docs.rows[0].value;
    }

    return null;
}

exports.sessionHeaderForUser = function(user, request)
{
    return "cpSession="+user.session+"; path=/; domain=.cappuccino.org; expires="+encodeURIComponent(new Date(new Date().getTime() + 1209600000).toGMTString());
}


var Couch = require("couchdb");

//var databaseConnection = Couch.connect("http://127.0.0.1:5984/"),
//    siteDatabase = databaseConnection.database("cappuccino/site");

exports.allQuotes = function()
{
    return [{type:"quote", text:"this is a quote", author:"ross"}];
    return siteDatabase.view("site", "quotes").rows.map(function(d){return d.value});
}

exports.randomQuote = function()
{
    var quotes = exports.allQuotes(),
        index = Math.floor(Math.random()*quotes.length);

    return quotes[index];
}

exports.create = function(text, author)
{
    return;//FIXME
    return siteDatabase.save({
        type: "quote",
        text: text,
        author: author
    });
}

exports.remove = function(quote)
{
    return;//FIXME
    return siteDatabase.removeDoc(quote);
}

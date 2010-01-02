
exports.stringByParsingLinksInString = function(text)
{
    return parseHashtag(parseUsername(parseURL(text)));
}

var parseURL = function(text) {
    return text.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&\?\/.=]+/, function(url) {
        return link(url, url);
    });
};

var parseUsername = function(text) {
    return text.replace(/[@]+[A-Za-z0-9-_]+/, function(u) {
        var username = u.replace("@","")
        return link(u, "http://twitter.com/"+username);
    });
};

var parseHashtag = function(text) {
    return text.replace(/[#]+[A-Za-z0-9-_]+/, function(t) {
        var tag = t.replace("#","%23")
        return link(t, "http://search.twitter.com/search?q="+tag);
    });
};

var link = function(text, link) {
    return "<a href='"+link+"'>"+text+"</a>";
}
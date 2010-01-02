
var RSSChannel = require("../models/rss.j").RSSChannel,
    Quote = require("../models/quote"),
    CappUser = require("../models/capp_user"),
    TweetParser = require("../util/tweet_parser"),
    FriendlyTimestamp = require("../util/friendly_timestamps");

// TODO: add google groups?

var blogPosts = new RSSChannel("http://capp.posterous.com/rss.xml"),
    twitterPosts = new RSSChannel("http://twitter.com/statuses/user_timeline/14581921.rss"),
    cappFlowPosts = new RSSChannel("http://feeds.feedburner.com/cappuccinoflow"),
    commits = new RSSChannel("http://twitter.com/statuses/user_timeline/16277269.rss");

var replaceTweetText = function(tweet)
{
    tweet.title = TweetParser.stringByParsingLinksInString(String(tweet.title));
}

var addHowLongAgoString = function(tweet)
{
    tweet.howLongAgo = FriendlyTimestamp.howLongAgoString(new Date(tweet.pubDate).getTime()) + " ago";
}

exports.home = function(request)
{
    blogPosts.update();
    twitterPosts.update();
    cappFlowPosts.update();
    commits.update();

    twitterPosts.items().forEach(replaceTweetText);
    commits.items().forEach(replaceTweetText);
    twitterPosts.items().forEach(addHowLongAgoString);
    commits.items().forEach(addHowLongAgoString);
    
    return {
        quote: Quote.randomQuote(),
        capp_users: CappUser.randomUsers(4, ["front_page"]),
        blog: {
            title: blogPosts.title(),
            url: blogPosts.link()
        },
        blog_items: blogPosts.items().splice(0, 5),
        twitter: {
            title: twitterPosts.title(),
            url: twitterPosts.link()
        },
        twitter_items: twitterPosts.items().splice(0, 3),
        flow: {
            title: cappFlowPosts.title(),
            url: cappFlowPosts.link()
        },
        flow_items: cappFlowPosts.items().splice(0, 5),
        commits: {
            title: commits.title(),
            url: commits.link()
        },
        commit_items: commits.items().splice(0, 3)
    }
}


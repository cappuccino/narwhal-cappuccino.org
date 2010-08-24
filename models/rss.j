
@import <Foundation/CPObject.j>
@import <Foundation/CPURLConnection.j>
@import <Foundation/CPDate.j>

// RSSChannel
// implements the spec @ http://cyber.law.harvard.edu/rss/rss.html

@implementation RSSChannel : CPObject
{
    // URL
    CPString    URL @accessors(readonly);
    BOOL        isLoaded @accessors(readonly);
    id          delegate @accessors;
    
    CPDate      lastUpdated;

    //private
    XMLDocument theDocument;
    
    // Channel required entities
    CPString    title @accessors(readonly);
    CPString    link @accessors(readonly);
    CPString    description @accessors(readonly);
    
    // Channel optional entities
    CPString    language @accessors(readonly);
    CPString    copyright @accessors(readonly);
    CPString    managingEditor @accessors(readonly);
    CPString    webMaster @accessors(readonly);
    CPDate      pubDate @accessors(readonly);
    CPDate      lastBuildDate @accessors(readonly);
    CPArray     categories @accessors(readonly);
    CPString    generator @accessors(readonly);
    CPString    docs @accessors(readonly);
    CPString    cloud @accessors(readonly);
    int         ttl @accessors(readonly);
    CPImage     image @accessors(readonly);
    CPString    rating @accessors(readonly);
    CPArray     skipHours @accessors(readonly);
    CPArray     skipDays @accessors(readonly);
    
    // Channel items
    CPArray     items  @accessors(readonly);
    
    CPTimeInterval updateInterval @accessors;
}

- (id)initWithURL:(CPString)aURL delegate:(id)aDelegate
{
    self = [super init];
    
    URL = aURL;
    isLoaded = false;
    delegate = aDelegate;
    lastUpdated = [CPDate distantPast];
    updateInterval = 60*10;
    
    return self;
}

- (void)updateIfNeeded
{
    if (ABS([lastUpdated timeIntervalSinceNow]) > updateInterval)
    {
        //FIXME make this configurable
        var request = new (require("browser/xhr").XMLHttpRequest);
        request.open("GET", URL, false);
        request.send("");

        [self connection:nil didReceiveData:request.responseText];
    }

    lastUpdated = [CPDate date];
}

- (XMLDocument)document
{
    return theDocument;
}

- (CPString)title
{
    if (!title)
        return [self URL];

    return title;
}

- (void)connection:(CPURLConnection)aConnection didReceiveData:(CPString)data
{
    isLoaded = true;
    
    if (!data)
        [self connection:aConnection didFailWithError:"No response."];

    try {

        theDocument = [[XMLDocument alloc] initWithXMLString:data];
        [self parseDocument];

        if ([delegate respondsToSelector:@selector(rssChannelDidFinishLoading:)])
            [delegate rssChannelDidFinishLoading:self];
    }
    catch (e) {
        [self connection:aConnection didFailWithError:e];
    }
}

- (void)connection:(CPURLConnection)aConnection didFailWithError:(CPString)anError
{
    isLoaded = true;

    if ([delegate respondsToSelector:@selector(rssChannel:didFailWithError:)])
        [delegate rssChannel:self didFailWithError:anError];

    items = [];
}

- (void)connectionDidFinishLoading:(CPURLConnection)aConnection
{
}

- (void)parseDocument
{
    var channel = [[theDocument elementsWithTagName:"channel"] objectAtIndex:0],
        childNodes = [channel childNodes],
        count = [childNodes count];

    if (!childNodes || count === undefined || count === nil)
        [CPException raise:CPInvalidArgumentException reason:"Invalid RSS Feed"];

    while (count--)
    {
        var thisNode = childNodes[count],
            nodeName = [thisNode nodeName];

        if (String(nodeName) === "image")
            self[nodeName] = [self CPImageForImageNode:thisNode];
        else if ([self respondsToSelector:sel_getUid(nodeName)])
            self[nodeName] = [thisNode nodeValue];
    }

    var categoryNodes = [channel childElementsWithTagName:"category"],
        count = [categoryNodes count];

    categories = [];
    
    while (count--)
    {
        var value = [categoryNodes[count] nodeValue];

        if (value)
            [categories insertObject:value atIndex:0];
    }
    
    // TODO implement skip days and skip hours

    var itemNodes = [theDocument elementsWithTagName:"item"],
        count = [itemNodes count];

    items = [];

    while (count--)
    {
        var entry = [RSSEntry entryWithXMLNode:itemNodes[count]];

        if (entry)
            [items insertObject:entry atIndex:0];        
    }
}

@end

@implementation RSSEntry : CPObject
{
    CPString    title @accessors(readonly);
    CPString    link @accessors(readonly);
    CPString    description @accessors(readonly);
    CPString    author @accessors(readonly);
    CPArray     categories @accessors(readonly);
    CPString    comments @accessors(readonly);
    CPString    enclosure @accessors(readonly);
    CPString    guid @accessors(readonly);
    CPDate      pubDate @accessors(readonly);
    CPString    source @accessors(readonly);
    CPString    fullPost @accessors(readonly);
    
    DOMNode     xmlNode @accessors(readonly);
}

+ (id)entryWithXMLNode:(DOMNode)aNode
{
    var entry = [self new],
        childNodes = [aNode childNodes],
        count = [childNodes count];

    if (!childNodes || !count)
        return nil;

    while (count--)
    {
        var thisNode = childNodes[count],
            nodeName = [thisNode nodeName];

        if ([entry respondsToSelector:sel_getUid(nodeName)])
            entry[nodeName] = [thisNode nodeValue];
    }

    var categoryNodes = [aNode childElementsWithTagName:"category"],
        count = [categoryNodes count];

    entry.categories = [];
    
    while (count--)
    {
        var value = [categoryNodes[count] nodeValue];

        if (value)
            [entry.categories insertObject:value atIndex:0];
    }

    var encodedContent = [aNode elementsWithTagName:"encoded" inNamespace:"http://purl.org/rss/1.0/modules/content/"][0];

    if (encodedContent)
        entry.fullPost = [encodedContent nodeValue];
    
    entry.xmlNode = aNode;

    return entry;
}

@end

@implementation DOMNode : CPObject
{
    Object  element;
}

+ (id)element:(Object)anElement
{
    return [[self alloc] initWithElement:anElement];
}

- (id)init
{
    return nil;
}

- (id)initWithElement:(Object)anElement
{
    if (!anElement) 
        return nil;

    self = [super init];

    element = anElement;

    return self;
}

- (DOMNode)firstChild
{
    var node = element.firstChild;
    
    if ([DOMNode isWhitespace:node])
        return [[DOMNode element:node] nextSibling];
    else
        return [DOMNode element:node];
}

- (DOMNode)lastChild
{
    var node = element.lastChild;
    
    if ([DOMNode isWhitespace:node])
        return [[DOMNode element:node] previousSibling];
    else
        return [DOMNode element:node];
}

- (DOMNode)nextSibling
{
    var node;
    while ((node = element.nextSibling) && [DOMNode isWhitespace:node]);
    
    return [DOMNode element:node];
}

- (DOMNode)previousSibling
{
    var node;
    while ((node = element.previousSibling) && [DOMNode isWhitespace:node]);
    
    return [DOMNode element:node];

}

- (CPString)nodeName
{
    return element.nodeName;
}

- (CPString)nodeValue
{
    return element.nodeValue || (element.firstChild ? [[DOMNode element:element.firstChild] nodeValue] : nil);
}

- (CPArray)childNodes
{
    return [CPArray arrayWithNodeList:element.childNodes];
}

- (CPArray)elementsWithTagName:(CPString)tagName
{
    return [CPArray arrayWithNodeList:element.getElementsByTagName(tagName)];
}

- (CPArray)elementsWithTagName:(CPString)tagName inNamespace:(CPString)namespace
{
    return [CPArray arrayWithNodeList:element.getElementsByTagNameNS(namespace, tagName)];
}

- (CPArray)childElementsWithTagName:(CPString)tagName
{
    var nodeList = element.getElementsByTagName(tagName),
        length = nodeList.length,
        array = [];

    while(length--)
        if (![DOMNode isWhitespace:nodeList.item(length)] && element === nodeList.item(length).parentNode)
            array.splice(0,0,[DOMNode element:nodeList.item(length)]);

    return array;
}

- (CPString)description
{
    return "<"+[self className]+" "+[CPString stringWithHash:[self hash]]+" - ["+[self nodeName]+": "+[self nodeValue]+"]>";
}

+ (BOOL)isWhitespace:(Object)aNode
{
    return aNode.nodeType === 8 || aNode.nodeType === 3;
}

@end

if (window.javax && javax.xml && javax.xml.parsers && javax.xml.parsers.DocumentBuilderFactory)
{
    var factoryInstance = javax.xml.parsers.DocumentBuilderFactory.newInstance();
    
    factoryInstance.setNamespaceAware(true);
    
    window._xmlDocumentBuilder = factoryInstance.newDocumentBuilder();
}

@implementation XMLDocument : DOMNode
{
}

- (id)initWithXMLString:(CPString)aString
{
    var el;

    if (window._xmlDocumentBuilder)
        el = _xmlDocumentBuilder.parse(new Packages.org.xml.sax.InputSource(new Packages.java.io.StringReader(aString)))
    else if (window.ActiveXObject)
    {
        el = new ActiveXObject("Microsoft.XMLDOM");
        el.loadXML(aString);
    }
    else
        el = (new DOMParser().parseFromString(aString, "text/xml")).documentElement;

    return self = [super initWithElement:el];
}

@end

@implementation CPArray (NodeList)

+ (id)arrayWithNodeList:(NodeList)aList
{
    if (!aList)
        return nil;

    var array = [],
        length = aList.length;

    while(length--)
        if (![DOMNode isWhitespace:aList.item(length)])
            array.splice(0,0,[DOMNode element:aList.item(length)]);

    return array;
}

@end

var _RSSChannel = exports.RSSChannel = function(url) {
    this._channel  = [[RSSChannel alloc] initWithURL:url delegate:nil];
}

_RSSChannel.prototype.update = function()
{
    [this._channel updateIfNeeded];
}

_RSSChannel.prototype.items = function()
{
    return [this._channel items];
}

_RSSChannel.prototype.title = function()
{
    return [this._channel title];
}

_RSSChannel.prototype.link = function()
{
    return [this._channel link];
}

_RSSChannel.prototype.description = function()
{
    return [this._channel description];
}

_RSSChannel.prototype.updateInterval = function()
{
    return [this._channel updateInterval];
}

_RSSChannel.prototype.setUpdateInterval = function(anInterval)
{
    [this._channel setUpdateInterval:anInterval];
}

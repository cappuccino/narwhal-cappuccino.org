
var File = require("file"),
    Plist = require("objective-j/plist")
    OS = require("os");

var demosURL = "/public/demos/",
    demosPath = "public/demos",
    githubURLPrefix = "http://github.com/280north/cappuccino-demos/tree/master/",
    frameworksPath = "public/Frameworks";

if (!File.exists(demosPath))
    OS.system("git clone git://github.com/280north/cappuccino-demos.git "+demosPath);

if (!File.exists(frameworksPath))
    OS.system("git clone git://github.com/280north/cappuccino-frameworks.git "+frameworksPath);

var Demo = exports.Demo = function(aPath)
{
    this._path = aPath;
    this._plist = Plist.readPlist(File.join(demosPath, this._path, 'Info.plist'));
}

Demo.allDemos = function()
{
    var allInfoPlists = File.path(demosPath).glob("**/Info.plist"),
        allDemos = [];

    allInfoPlists.forEach(function(demoPath)
    {
        var demo = new Demo(demoPath.substring(0, demoPath.length - "/Info.plist".length));
        if (!demo.excluded())
            allDemos.push(demo);
    });

    return allDemos;
}

Demo.prototype.plist = function(key)
{
    if (key)
        return this._plist.getValue(key);

    return this._plist;
}

Demo.prototype.name = function()
{
    return this.plist("CPBundleName");
}

Demo.prototype.path = function()
{
    return this._path;
}

Demo.prototype.URL = function()
{
    return File.join(demosURL, encodeSpaces(this._path), "index-deploy.html");
}

Demo.prototype.description = function()
{
    return this.plist("CPDescription");
}

Demo.prototype.excluded = function()
{
    return !!this.plist("CPDemoExcluded");
}

Demo.prototype.githubURL = function()
{
    return githubURLPrefix+encodeSpaces(this.path());
}

Demo.prototype.archiveURL = function()
{
    return "/demos/"+encodeSpaces(this.path())+"/archive";
}

var encodeSpaces = function(string)
{
    return string.replace(/ /g, "%20");
}

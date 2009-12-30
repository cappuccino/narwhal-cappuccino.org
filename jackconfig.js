
var File = require("file"),
    Mustache = require("mustache"),
    System = require("system"),
    Jack = require("jack"),
    ENV = System.env,
    URI = require("uri").URI,
    User = require("./models/user");

var routes = {};

var loadTemplates = function loadTemplates()
{
    var templates = {};
    File.glob("templates/*.jshtml").forEach(function(template){
        var templateName = template.substring("templates/".length);
        templateName = templateName.split(".")[0];
        
        templates[templateName] = File.read(template, {charset:"UTF8"});
    });

    return templates;
}

var HandleURL = function handleURL()
{
    var templates = loadTemplates(),
        siteTemplate = templates["site"];

    return function (env)
    {
        var path  = env["PATH_INFO"] ? env["PATH_INFO"].squeeze("/") : "",
            hHost = env['HTTP_HOST'], sName = env['SERVER_NAME'], sPort = env['SERVER_PORT']
            request = new Jack.Request(env);

        if (path.charAt(0) === '/')
            path = path.substring(1);

        if (path === "")
            path = "home";

        var pathComponents = path.split("/"),
            lastPathComponent = pathComponents[pathComponents.length - 1],
            usedPathComponents,
            thisController,
            controller,
            template,
            result;

        for (var i = 1, count = pathComponents.length; i <= count; i++)
        {
            usedPathComponents = pathComponents.slice(0, i).join("/");
            thisController = null;

            try {
                thisController = require("./"+File.join("controllers", usedPathComponents));
            } catch (e) {
                print(e + ", controller: "+File.join("controllers", usedPathComponents));
            }

            if (thisController)
                controller = thisController;
            else
                break;
        }

        if (controller)
        {print(lastPathComponent)
            if (controller[lastPathComponent])
                result = controller[lastPathComponent](request, pathComponents.slice(i, pathComponents.length));
            else if (controller["get"])
                result = controller.get(request);

            if (result && result.constructor === Function.constructor)
                return result();

            if (result)
            {
                var templatePath = File.join(usedPathComponents, lastPathComponent);

                if (templates[templatePath])
                    template = templates[templatePath];
                else if (templates[usedPathComponents])
                    template = templates[usedPathComponents];
            }
        }
        else
        {
            var templateIndex = pathComponents.length + 1;
            while (templateIndex--)
            {
                var usedPathComponents = pathComponents.slice(0, templateIndex).join("/");

                if (templates[usedPathComponents])
                {
                    template = templates[usedPathComponents];
                }
            }
        }

        if (template)
        {
            result = result || {};

            var page = result.__page__ || {},
                currentUser = User.userForRequest(request),
                rendered_template = Mustache.to_html(template, result);

            if (!page.user)
            {
                page.user = currentUser;
                page.screen_name = (currentUser || {}).screen_name;
                page.isLoggedIn = currentUser !== null;
                page.isNotLoggedIn = !page.isLoggedIn;
            }

            if (!page.title)
                page.title = "Cappuccino Web Framework"
            else
                page.title += " - Cappuccino Web Framework";

            if (!page.year)
                page.year = new Date().getFullYear();

            page.content = rendered_template;

            var rendered_site = Mustache.to_html(siteTemplate, page);

            return {
                status : 200,
                headers : {"Content-Type":"text/html"},
                body : [rendered_site]
            }
        }
        else if (result)
        {
            return {
                status : 200,
                headers : {"Content-Type":"text/plain"},
                body : [JSON.stringify(result)]
            };
        }
        else
        {
            return {
                status : 404,
                headers : {"Content-Type":"text/plain"},
                body : ["Not Found"]
            }
        }
    };
}

exports.app = Jack.ContentLength(
                Jack.Static(
                    Jack.Cascade([
                        Jack.URLMap(routes), 
                        HandleURL()
                    ]), 
                    {"urls":["/public"]}
                )
              );

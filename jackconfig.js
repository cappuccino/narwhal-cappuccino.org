
var File = require("file"),
    Mustache = require("mustache"),
    System = require("system"),
    Jack = require("jack"),
    ENV = System.env,
    URI = require("uri").URI;

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
            hHost = env['HTTP_HOST'], sName = env['SERVER_NAME'], sPort = env['SERVER_PORT'];

        if (path.charAt(0) === '/')
            path = path.substring(1);

        var pathComponents = path.split("/"),
            lastPathComponent = pathComponents[pathComponents.length - 1],
            controller,
            template,
            result = {};

        for (var i = 1, count = pathComponents.length; i <= count; i++)
        {
            var usedPathComponents = pathComponents.slice(0, i).join("/"),
                thisController;

            try {
                thisController = require(File.join("controllers", usedPathComponents));
            } catch (e) {
                //print("did not find controller: "+File.join("controllers", usedPathComponents))
            }

            if (thisController)
                controller = thisController;

            else if (controller)
            {
                if (controller[lastPathComponent])
                    result = controller[lastPathComponent](env, pathComponents.slice(i, pathComponents.length));
                else
                    result = controller.get(env);

                var templatePath = File.join("templates", usedPathComponents, lastPathComponent);
                if (File.exists(templatePath))
                    template = templates[templatePath];
                else if (File.exists(templatePath = File.join("templates", usedPathComponents)))
                    template = templates[templatePath];

                break;
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
                        break;
                    }
                }

                break;
            }
        }

        if (template)
        {
            var page = result.__page__ || {},
                rendered_template = Mustache.to_html(template, result);

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
        else
        {
            return {
                status : 501,
                headers : {"Content-Type":"text/plain"},
                body : ["Internal Server Error"]
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

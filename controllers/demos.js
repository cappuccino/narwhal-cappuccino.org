
var Demo = require("../models/demo").Demo,
    allDemos = Demo.allDemos();

exports.get = function(request)
{
    return {demos:allDemos};
}

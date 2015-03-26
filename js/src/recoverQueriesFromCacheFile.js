//just a simple script, to extract the queries from the previous sampld experiments (stored in html files)
//need to do this, to make sure I use exactly the same queries
var _ = require('lodash'),
    fs = require('node-fs-extra'),
    path = require('path'),
    config = require('../config.js');
var outputPath = config.queries;
var re = /query=(.*)&tab/g

if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
}

_.forEach(_.slice(process.argv, 2), function(file) {
    var dataset = path.basename(file);
    var queries = {};
    console.log(dataset);
    var dir = outputPath + '/' + dataset;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    var count = 0;
    var content = fs.readFileSync(file, 'UTF-8');
    
    _.forEach(content.split('\n'), function(line) {
        var query = decodeURIComponent(line.replace(/\+/g,' '));
        if (query.trim().length == 0) return;
        fs.writeFileSync(dir + '/query_' + count, query);
        count++;
    });

});


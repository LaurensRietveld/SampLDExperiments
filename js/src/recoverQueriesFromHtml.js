//just a simple script, to extract the queries from the previous sampld experiments (stored in html files)
//need to do this, to make sure I use exactly the same queries
var _ = require('lodash'),
    fs = require('node-fs-extra'),
    config = require('../config.js');
var outputPath = config.queries;
var re = /query=(.*)&tab/g

if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
}

_.forEach(_.slice(process.argv, 2), function(file) {
    var dataset = file.substring(file.lastIndexOf('/')+1, file.indexOf('.'));
    var queries = {};
    console.log(dataset);
    var dir = outputPath + '/' + dataset;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
    var count = 0;
    var content = fs.readFileSync(file, 'UTF-8');
    //console.log(content);
    _.forEach(content.match(re), function(match) {
        if (match) {
            var decodedQuery = decodeURIComponent(match.substring("query=".length, match.length- "&tab".length).replace(/\+/g,' '));
//            console.log(decodedQuery);
//            console.log('sdf');
//            process.exit(1);
            
            queries[decodedQuery.replace(/FROM <.*>/g, ' ')] = true;;
        }
    });
    _.forEach(_.keys(queries), function(query, id) {
        
        fs.writeFileSync(dir + '/query_' + id, query);
        count++;
    })
});


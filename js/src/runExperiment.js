var _ = require('lodash'),
    fs = require('node-fs-extra'),
    request = require('superagent'),
    sparqljs = require('sparqljs'),
    csvGenerator = require('csv-stringify');
    config = require('../config.js');

var SparqlParser = require('sparqljs').Parser;
var SparqlGenerator = require('sparqljs').Generator;


var generator = new SparqlGenerator();

var queue = {};
var results = {};
var evalQuery = function(dataset, queryFile, sampleSize, _queryObj, callback) {
    var queryObj = _.clone(_queryObj);
    if (!results[dataset]) results[dataset] = {};
    if (!results[dataset][queryFile]) results[dataset][queryFile] = {};
    var graph = 'http://' + dataset;
    if (sampleSize != 1) {
        graph += '_' + sampleSize;
    }
    queryObj.from['default'] = [graph];
    
    var start = new Date();
    request
        .post(config.endpoint)
        .query({ query: generator.stringify(queryObj)})
        .set('Accept', 'application/json')
        .end(function(err, res){
//            console.log(generator.stringify(queryObj));
            if (err) {
                console.log(err);
            }
            var end = new Date();
            results[dataset][queryFile][sampleSize] = end-start;
//            writeResultsForDataset(dataset);
//            if (res.ok) {
//                console.log(res.body);
//            } else {
//                console.log(res);
//            }
//            process.exit(1);
            callback();
            processQueue();
        });
}

var writeResultsForDataset = function(dataset) {
    var sampleSizeToCol={};
    var csvArray = [];
    _.forEach(results[dataset], function(dResults, queryName) {
        if (csvArray.length == 0) {
            //write header
            var header = ['Query'];
            _.forEach(config.evalSizes, function(val, key) {
               header.push(val);
               sampleSizeToCol[val] =key+1;
            });
            csvArray.push(header);
        }
        var row = [queryName];
        _.forEach(dResults, function(timing, sampleSize) {
            row[sampleSizeToCol[sampleSize]] = timing;
        });
        csvArray.push(row);
    });
    csvGenerator(csvArray, function(err, csvString) {
        fs.writeFile(config.results + '/' + dataset + '.csv', csvString);
    });
};

var processQueue = function() {
    for (var dataset in queue) {
        for (var queryFile in queue[dataset]) {
            for (var sampleSize in queue[dataset][queryFile]) {
                process.stdout.write(dataset + ' ' + _.size(queue[dataset]) + '       \r');
                evalQuery(dataset, queryFile, sampleSize, queue[dataset][queryFile][sampleSize], function() {
                  //cleanup
                    delete queue[dataset][queryFile][sampleSize];
                    if (_.size(queue[dataset][queryFile]) == 0) delete queue[dataset][queryFile];
                    if (_.size(queue[dataset]) == 0) {
                        console.log(dataset + ' done');
                        writeResultsForDataset(dataset);
                        delete queue[dataset];
                    }
                    return;
                });
                
                
                
            }
        }
    }
}


console.log('Reading queries from disk')
_.forEach(config.datasets, function(dataset) {
    console.log('> ' + dataset);
    queue[dataset] = {};
    //read queries from disk
   _.forEach(fs.readdirSync(config.queries + '/' + dataset), function(queryFile){
       var parser = new SparqlParser();
       var queryString = fs.readFileSync(config.queries + '/' + dataset + '/' + queryFile, 'UTF-8');
       if (queryString.trim().length == 0) return;
       var query;
       try {
          query = parser.parse(queryString);
       } catch (e) {
           console.log(e);
           console.log('path', config.queries + '/' + dataset + '/' + queryFile, 'UTF-8');
           console.log('content', fs.readFileSync(config.queries + '/' + dataset + '/' + queryFile, 'UTF-8'));
           return;
       }
       
      if (!query.from) query.from = {};
      if (!query.from['default']) query.from['default'] = [];
      queue[dataset][queryFile] = {};
      _.forEach(config.evalSizes, function(size) {
//          queue[dataset][queryFile][size] = _.clone(query);
          queue[dataset][queryFile][size] = query;
      });
//      query.from['default'].push('http://bla2');
   });
   
});
console.log('processing queue');
processQueue();




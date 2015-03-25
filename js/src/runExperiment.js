var _ = require('lodash'),
    fs = require('node-fs-extra'),
    config = require('../config.json');


_.forEach(config.datasets, function(dataset) {
   _.forEach(fs.readdirSync(config.queries + '/' + dataset), function(queryFile){
      var query = fs.readFileSync(config.queries + '/' + dataset + '/' + queryFile, 'UTF-8');
      console.log(query);
      process.exit(1);
   });
});
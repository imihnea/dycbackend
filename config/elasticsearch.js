const Product = require('../models/product');
const moment = require('moment');
const { errorLogger, logger } = require('./winston');
const elasticsearch = require('elasticsearch');
client = new elasticsearch.Client({
    host: process.env.ELASTICHOST,
});

const startElastic = () => { 
    client.ping({
      requestTimeout: 3000
    }, function (error) {
      if (error) {
            errorLogger.error(`Elasticsearch Error\r\nStatus: ${error.status || 500}\r\nMessage: ES Cluster is down\r\n${error.message} - Elasticsearch\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
      } else {
            logger.info(`Message: All is well - Elasticsearch\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
      }
    });
    
    // Check if there is an old index
    client.indices.exists({index: 'products'}, (err, result) => {
        if (err) {
            errorLogger.error(`Elasticsearch Error\r\nStatus: ${err.status || 500}\r\nMessage: ${err.message}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        } else {
            if (result) {
                // Delete the old index
                client.indices.delete({index: 'products'}, (err, result) => {
                  if (err) {
                    errorLogger.error(`Elasticsearch Error\r\nStatus: ${err.status || 500}\r\nMessage: ${err.message}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                  } else {
                    // Create new index after the old one was deleted
                    client.indices.create({index: 'products'}, (err, result) => {
                      if (err) {
                        errorLogger.error(`Elasticsearch Error\r\nStatus: ${err.status || 500}\r\nMessage: ${err.message}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                      } else {
                        // Create mapping
                        client.indices.getMapping({index: 'products'}, (err, res) => {
                            if (err) {
                                errorLogger.error(`Elasticsearch Error\r\nStatus: ${err.status || 500}\r\nMessage: ${err.message}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            } else {
                                if (!res.products.mappings) {
                                    client.indices.putMapping(
                                        {
                                            index: 'products',
                                            body: {
                                                "id": "text",
                                                "feat_1": {
                                                    "properties": {
                                                        "status": "boolean",
                                                        "expiryDate": "date"
                                                    }
                                                },
                                                "name": "text",
                                                "image": "text",
                                                "author": {
                                                    "properties": {
                                                        "id": "text",
                                                        "name": "text",
                                                        "city": "text",
                                                        "country": "text",
                                                        "state": "text",
                                                        "continent": "text",
                                                        "accountType": "text"
                                                    }
                                                },
                                                "avgRating": "float",
                                                "btcPrice": "float",
                                                "condition": "text",
                                                "category": "text",
                                                "createdAt": "date",
                                                "searchableTags": "keyword"
                                            }
                                        }, {
                                    }, (err, res) => {
                                        if (err) {
                                            errorLogger.error(`Elasticsearch Error\r\nStatus: ${err.status || 500}\r\nMessage: ${err.message}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                        }
                                    });
                                }
                            }
                        });
    
                        // Index available products
                        Product.find({available: 'True'}, (err ,res) => {
                            if (err) {
                                errorLogger.error(`Elasticsearch Mongoose Error\r\nStatus: ${err.status || 500}\r\nMessage: ${err.message}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                            } else {
                                res.forEach(product => {
                                    client.index({
                                        index: 'products',
                                        type: 'products',
                                        id: `${product._id}`,
                                        body: {
                                            id: product._id,
                                            feat_1: product.feat_1,
                                            image: product.images[0].url,
                                            name: product.name,
                                            author: product.author,
                                            avgRating: product.avgRating,
                                            btcPrice: product.btcPrice,
                                            condition: product.condition,
                                            category: product.category,
                                            createdAt: product.createdAt,
                                            searchableTags: product.searchableTags
                                        }
                                    }, function(err, resp, status) {
                                        if (err) {
                                            errorLogger.error(`Elasticsearch Error\r\nStatus: ${err.status || 500}\r\nMessage: ${err.message}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
                                        }
                                    });
                                });
                                console.log('Product indexing process complete');
                            }
                        });
                      }
                    });
                  }
                });
            }
        }
    });
}

const updateRating = function(product) {
    client.update({
        index: 'products',
        type: 'products',
        id: `${product._id}`,
        body: {
            doc: {
                avgRating: product.avgRating
            }
        }
    }, (err, res) => {
        if (err) {
          errorLogger.error(`Elasticsearch Error\r\nStatus: ${err.status || 500}\r\nMessage: ${err.message}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
    }
)};

const deleteProduct = (id) => {
    client.delete({
        index: 'products',
        type: 'products',
        id: `${req.params.id}`
      }, (err) => {
        if (err) {
            errorLogger.error(`Elasticsearch Error\r\nStatus: ${err.status || 500}\r\nMessage: ${err.message}\r\nTime: ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')}\r\n`);
        }
    });
};

module.exports = { client, updateRating, deleteProduct, startElastic };
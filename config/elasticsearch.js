const elasticsearch = require('elasticsearch');
let client;
if (process.env.HEROKU === true) {
    client = new elasticsearch.Client({
        host: '994125d4daf04d4e999fc2c3ccdb5a13.eu-central-1.aws.cloud.es.io:9243',
        protocol: "https",
        auth: "elastic:E37nCmTkobiqfwIAHeGOfrsz"
    });
} else {
    client = new elasticsearch.Client({
      host: 'localhost:9200',
    });
}
const Product = require('../models/product');

client.ping({
  requestTimeout: 3000
}, function (error) {
  if (error) {
    console.trace('Elasticsearch cluster is down!');
  } else {
    console.log('All is well');
  }
});

// Check if there is an old index
client.indices.exists({index: 'products'}, (err, result) => {
    if (err) {
        console.log(err);
    } else {
        if (result) {
            // Delete the old index
            client.indices.delete({index: 'products'}, (err, result) => {
              if (err) {
                console.log(err);
              } else {
                console.log(result);
                // Create new index after the old one was deleted
                client.indices.create({index: 'products'}, (err, result) => {
                  if (err) {
                    console.log(err);
                  } else {
                    console.log(result);
                  }
                });
              }
            });
        }
    }
});

// Create mapping
client.indices.getMapping({index: 'products'}, (err, res) => {
    if (err) {
       console.log(err);
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
                    console.log(err);
                } else {
                    console.log(res);
                }
            });
        }
    }
});

// Index available products
Product.find({available: 'True'}, (err ,res) => {
    if (err) {
        console.log(err);
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
                    console.log(err);
                }
            });
        });
        console.log('Product indexing process complete');
    }
});

module.exports = { client };
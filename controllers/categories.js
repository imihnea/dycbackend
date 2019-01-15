const Product = require('../models/product');
const User = require('../models/user');

module.exports = {
    async getCollectibles(req, res) {
        const featured_products = await Product.paginate({ category: 'collectibles', available: true, "feat_1.status": true }, {
            page: req.query.page || 1,
            limit: 5,
        });
        featured_products.page = Number(featured_products.page);
        const products = await Product.paginate({ category: 'collectibles', available: true, "feat_1.status": false }, {
            page: req.query.page || 1,
            limit: 10,
        });
        //TODO: Find regex that does both in one command
        products.page = Number(products.page);
        let categ = req.url.split('/')[2];
        if ( categ.match(/.+?(?=\?)/) ){
            categ = categ.match(/.+?(?=\?)/);
            res.render('products/product_all', {
                products: products,
                featured_products: featured_products,
                main: 'Collectibles-Art',
                subfirst: 'Collectibles',
                subsecond: 'Antiques',
                subthird: 'SportsMemorabilia',
                subfourth: 'Art',
                categ: categ[0],
            });
        } else {
            res.render('products/product_all', {
                products: products,
                featured_products: featured_products,
                main: 'Collectibles-Art',
                subfirst: 'Collectibles',
                subsecond: 'Antiques',
                subthird: 'SportsMemorabilia',
                subfourth: 'Art',
                categ: categ,
            });
        }
    }

};
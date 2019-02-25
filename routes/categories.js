const express = require('express');

const product = require('../models/product');

const router = express.Router();

const { getCollectibles } = require('../controllers/categories');

const middleware = require('../middleware/index');

const { asyncErrorHandler } = middleware;

// show all categories
router.get('/', (req, res) => {
  res.render('index/categories');
});

// show specific category with subcategories
router.get('/Collectibles-Art', (req, res) => {
  res.render('index/maincateg',
    {
      main: 'Collectibles-Art',
      subfirst: 'Collectibles',
      subsecond: 'Antiques',
      subthird: 'SportsMemorabilia',
      subfourth: 'Art',
    });
});

// show specific category with subcategories
router.get('/Home-Garden', (req, res) => {
  res.render('index/maincateg',
    {
      main: 'Home-Garden',
      subfirst: 'YardGardenOutdoor',
      subsecond: 'Crafts',
      subthird: 'HomeImprovement',
      subfourth: 'PetSupplies',
    });
});

// show specific category with subcategories
router.get('/Sporting-Goods', (req, res) => {
  res.render('index/maincateg',
    {
      main: 'Sporting-Goods',
      subfirst: 'OutdoorSports',
      subsecond: 'TeamSports',
      subthird: 'ExerciseFitness',
      subfourth: 'Golf',
    });
});

// show specific category with subcategories
router.get('/Electronics', (req, res) => {
  res.render('index/maincateg',
    {
      main: 'Electronics',
      subfirst: 'ComputersTablets',
      subsecond: 'CamerasPhoto',
      subthird: 'TvAudioSurveillance',
      subfourth: 'PhonesAndAccessories',
    });
});

// show specific category with subcategories
router.get('/AutoParts-Accessories', (req, res) => {
  res.render('index/maincateg',
    {
      main: 'AutoParts-Accessories',
      subfirst: 'GpsSecurity',
      subsecond: 'RadarLaser',
      subthird: 'CareDetailing',
      subfourth: 'Scooter',
    });
});

// show specific category with subcategories
router.get('/Toys-Hobbies', (req, res) => {
  res.render('index/maincateg',
    {
      main: 'Toys-Hobbies',
      subfirst: 'RadioControl',
      subsecond: 'KidsToys',
      subthird: 'ActionFigures',
      subfourth: 'DollsBears',
    });
});

// show specific category with subcategories
router.get('/Fashion', (req, res) => {
  res.render('index/maincateg',
    {
      main: 'Fashion',
      subfirst: 'Women',
      subsecond: 'Men',
      subthird: 'JewelryWatches',
      subfourth: 'Shoes',
    });
});

// show specific category with subcategories
router.get('/MusicalInstruments-Gear', (req, res) => {
  res.render('index/maincateg',
    {
      main: 'MusicalInstruments-Gear',
      subfirst: 'Guitar',
      subsecond: 'ProAudio',
      subthird: 'String',
      subfourth: 'StageLightningEffects',
    });
});

// show specific category with subcategories
router.get('/Other', (req, res) => {
  res.render('index/maincateg',
    {
      main: 'Other',
      subfirst: 'VideoGamesConsoles',
      subsecond: 'HealthBeauty',
      subthird: 'Baby',
      subfourth: 'BusinessIndustrial',
    });
});

// =================== COLLECTIBLES AND ART ===================
// show all products inside specific subcategory
router.get('/Collectibles-Art/Collectibles', asyncErrorHandler(getCollectibles));

// show all products inside specific subcategory
router.get('/Collectibles-Art/Antiques', (req, res) => {
  // Get all products from DB
  product.find({ category: 'antiques' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Collectibles-Art',
        subfirst: 'Collectibles',
        subsecond: 'Antiques',
        subthird: 'SportsMemorabilia',
        subfourth: 'Art',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Collectibles-Art/SportsMemorabilia', (req, res) => {
  // Get all products from DB
  product.find({ category: 'sportsmemorabilia' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Collectibles-Art',
        subfirst: 'Collectibles',
        subsecond: 'Antiques',
        subthird: 'SportsMemorabilia',
        subfourth: 'Art',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Collectibles-Art/Art', (req, res) => {
  // Get all products from DB
  product.find({ category: 'art' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Collectibles-Art',
        subfirst: 'Collectibles',
        subsecond: 'Antiques',
        subthird: 'SportsMemorabilia',
        subfourth: 'Art',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// =================== HOME AND GARDEN ===================
// show all products inside specific subcategory
router.get('/Home-Garden/YardGardenOutdoor', (req, res) => {
  // Get all products from DB
  product.find({ category: 'yardgardenoutdoor' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Home-Garden',
        subfirst: 'YardGardenOutdoor',
        subsecond: 'Crafts',
        subthird: 'HomeImprovement',
        subfourth: 'PetSupplies',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Home-Garden/Crafts', (req, res) => {
  // Get all products from DB
  product.find({ category: 'crafts' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Home-Garden',
        subfirst: 'YardGardenOutdoor',
        subsecond: 'Crafts',
        subthird: 'HomeImprovement',
        subfourth: 'PetSupplies',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Home-Garden/HomeImprovement', (req, res) => {
  // Get all products from DB
  product.find({ category: 'homeimprovement' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Home-Garden',
        subfirst: 'YardGardenOutdoor',
        subsecond: 'Crafts',
        subthird: 'HomeImprovement',
        subfourth: 'PetSupplies',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Home-Garden/PetSupplies', (req, res) => {
  // Get all products from DB
  product.find({ category: 'petsupplies' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Home-Garden',
        subfirst: 'YardGardenOutdoor',
        subsecond: 'Crafts',
        subthird: 'HomeImprovement',
        subfourth: 'PetSupplies',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// =================== SPORTING GOODS ===================
// show all products inside specific subcategory
router.get('/Sporting-Goods/OutdoorSports', (req, res) => {
  // Get all products from DB
  product.find({ category: 'outdoorsports' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Sporting-Goods',
        subfirst: 'OutdoorSports',
        subsecond: 'TeamSports',
        subthird: 'ExerciseFitness',
        subfourth: 'Golf',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Sporting-Goods/TeamSports', (req, res) => {
  // Get all products from DB
  product.find({ category: 'teamsports' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Sporting-Goods',
        subfirst: 'OutdoorSports',
        subsecond: 'TeamSports',
        subthird: 'ExerciseFitness',
        subfourth: 'Golf',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Sporting-Goods/ExerciseFitness', (req, res) => {
  // Get all products from DB
  product.find({ category: 'exercisefitness' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Sporting-Goods',
        subfirst: 'OutdoorSports',
        subsecond: 'TeamSports',
        subthird: 'ExerciseFitness',
        subfourth: 'Golf',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Sporting-Goods/Golf', (req, res) => {
  // Get all products from DB
  product.find({ category: 'golf' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Sporting-Goods',
        subfirst: 'OutdoorSports',
        subsecond: 'TeamSports',
        subthird: 'ExerciseFitness',
        subfourth: 'Golf',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// =================== ELECTRONICS ===================
// show all products inside specific subcategory
router.get('/Electronics/ComputersTablets', (req, res) => {
  // Get all products from DB
  product.find({ category: 'computerstablets' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Electronics',
        subfirst: 'ComputersTablets',
        subsecond: 'CamerasPhoto',
        subthird: 'TvAudioSurveillance',
        subfourth: 'PhonesAndAccessories',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Electronics/CamerasPhoto', (req, res) => {
  // Get all products from DB
  product.find({ category: 'camerasphoto' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Electronics',
        subfirst: 'ComputersTablets',
        subsecond: 'CamerasPhoto',
        subthird: 'TvAudioSurveillance',
        subfourth: 'PhonesAndAccessories',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Electronics/TvAudioSurveillance', (req, res) => {
  // Get all products from DB
  product.find({ category: 'tvaudiosurveillance' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Electronics',
        subfirst: 'ComputersTablets',
        subsecond: 'CamerasPhoto',
        subthird: 'TvAudioSurveillance',
        subfourth: 'PhonesAndAccessories',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Electronics/PhonesAndAccessories', (req, res) => {
  // Get all products from DB
  product.find({ category: 'phonesaccessories' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Electronics',
        subfirst: 'ComputersTablets',
        subsecond: 'CamerasPhoto',
        subthird: 'TvAudioSurveillance',
        subfourth: 'PhonesAndAccessories',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// =================== AUTO PARTS AND ACCESSORIES ===================
// show all products inside specific subcategory
router.get('/AutoParts-Accessories/GpsSecurity', (req, res) => {
  // Get all products from DB
  product.find({ category: 'gpssecurity' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'AutoParts-Accessories',
        subfirst: 'GpsSecurity',
        subsecond: 'RadarLaser',
        subthird: 'CareDetailing',
        subfourth: 'Scooter',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/AutoParts-Accessories/RadarLaser', (req, res) => {
  // Get all products from DB
  product.find({ category: 'radarlaser' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'AutoParts-Accessories',
        subfirst: 'GpsSecurity',
        subsecond: 'RadarLaser',
        subthird: 'CareDetailing',
        subfourth: 'Scooter',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/AutoParts-Accessories/CareDetailing', (req, res) => {
  // Get all products from DB
  product.find({ category: 'caredetailing' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'AutoParts-Accessories',
        subfirst: 'GpsSecurity',
        subsecond: 'RadarLaser',
        subthird: 'CareDetailing',
        subfourth: 'Scooter',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/AutoParts-Accessories/Scooter', (req, res) => {
  // Get all products from DB
  product.find({ category: 'scooter' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'AutoParts-Accessories',
        subfirst: 'GpsSecurity',
        subsecond: 'RadarLaser',
        subthird: 'CareDetailing',
        subfourth: 'Scooter',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// =================== TOYS AND HOBBIES ===================
// show all products inside specific subcategory
router.get('/Toys-Hobbies/RadioControl', (req, res) => {
  // Get all products from DB
  product.find({ category: 'radiocontrol' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Toys-Hobbies',
        subfirst: 'RadioControl',
        subsecond: 'KidsToys',
        subthird: 'ActionFigures',
        subfourth: 'DollsBears',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Toys-Hobbies/KidsToys', (req, res) => {
  // Get all products from DB
  product.find({ category: 'kidstoys' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Toys-Hobbies',
        subfirst: 'RadioControl',
        subsecond: 'KidsToys',
        subthird: 'ActionFigures',
        subfourth: 'DollsBears',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Toys-Hobbies/ActionFigures', (req, res) => {
  // Get all products from DB
  product.find({ category: 'actionfigures' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Toys-Hobbies',
        subfirst: 'RadioControl',
        subsecond: 'KidsToys',
        subthird: 'ActionFigures',
        subfourth: 'DollsBears',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Toys-Hobbies/DollsBears', (req, res) => {
  // Get all products from DB
  product.find({ category: 'dollsbears' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Toys-Hobbies',
        subfirst: 'RadioControl',
        subsecond: 'KidsToys',
        subthird: 'ActionFigures',
        subfourth: 'DollsBears',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// =================== FASHION ===================
// show all products inside specific subcategory
router.get('/Fashion/Women', (req, res) => {
  // Get all products from DB
  product.find({ category: 'women' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Fashion',
        subfirst: 'Women',
        subsecond: 'Men',
        subthird: 'JewelryWatches',
        subfourth: 'Shoes',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Fashion/Men', (req, res) => {
  // Get all products from DB
  product.find({ category: 'men' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Fashion',
        subfirst: 'Women',
        subsecond: 'Men',
        subthird: 'JewelryWatches',
        subfourth: 'Shoes',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Fashion/JewelryWatches', (req, res) => {
  // Get all products from DB
  product.find({ category: 'jewelrywatches' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Fashion',
        subfirst: 'Women',
        subsecond: 'Men',
        subthird: 'JewelryWatches',
        subfourth: 'Shoes',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Fashion/Shoes', (req, res) => {
  // Get all products from DB
  product.find({ category: 'shoes' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Fashion',
        subfirst: 'Women',
        subsecond: 'Men',
        subthird: 'JewelryWatches',
        subfourth: 'Shoes',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// =================== MUSICAL INSTRUMENTS AND GEAR ===================
// show all products inside specific subcategory
router.get('/MusicalInstruments-Gear/Guitar', (req, res) => {
  // Get all products from DB
  product.find({ category: 'guitar' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'MusicalInstruments-Gear',
        subfirst: 'Guitar',
        subsecond: 'ProAudio',
        subthird: 'String',
        subfourth: 'StageLightningEffects',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/MusicalInstruments-Gear/ProAudio', (req, res) => {
  // Get all products from DB
  product.find({ category: 'proaudio' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'MusicalInstruments-Gear',
        subfirst: 'Guitar',
        subsecond: 'ProAudio',
        subthird: 'String',
        subfourth: 'StageLightningEffects',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/MusicalInstruments-Gear/String', (req, res) => {
  // Get all products from DB
  product.find({ category: 'string' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'MusicalInstruments-Gear',
        subfirst: 'Guitar',
        subsecond: 'ProAudio',
        subthird: 'String',
        subfourth: 'StageLightningEffects',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/MusicalInstruments-Gear/StageLightningEffects', (req, res) => {
  // Get all products from DB
  product.find({ category: 'stagelightningeffects' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'MusicalInstruments-Gear',
        subfirst: 'Guitar',
        subsecond: 'ProAudio',
        subthird: 'String',
        subfourth: 'StageLightningEffects',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// =================== OTHER CATEGORIES ===================
// show all products inside specific subcategory
router.get('/Other/VideoGamesConsoles', (req, res) => {
  // Get all products from DB
  product.find({ category: 'videogamesconsoles' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Other',
        subfirst: 'VideoGamesConsoles',
        subsecond: 'HealthBeauty',
        subthird: 'Baby',
        subfourth: 'BusinessIndustrial',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Other/HealthBeauty', (req, res) => {
  // Get all products from DB
  product.find({ category: 'healthbeauty' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Other',
        subfirst: 'VideoGamesConsoles',
        subsecond: 'HealthBeauty',
        subthird: 'Baby',
        subfourth: 'BusinessIndustrial',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Other/Baby', (req, res) => {
  // Get all products from DB
  product.find({ category: 'baby' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Other',
        subfirst: 'VideoGamesConsoles',
        subsecond: 'HealthBeauty',
        subthird: 'Baby',
        subfourth: 'BusinessIndustrial',
        categ: req.url.split('/')[2],
      });
    }
  });
});

// show all products inside specific subcategory
router.get('/Other/BusinessIndustrial', (req, res) => {
  // Get all products from DB
  product.find({ category: 'businessindustrial' }, (err, allproducts) => {
    if (err) {
      req.flash('error', err.message);
    } else {
      res.render('products/product_all', {
        products: allproducts,
        main: 'Other',
        subfirst: 'VideoGamesConsoles',
        subsecond: 'HealthBeauty',
        subthird: 'Baby',
        subfourth: 'BusinessIndustrial',
        categ: req.url.split('/')[2],
      });
    }
  });
});

module.exports = router;

const express = require('express');

const router = express.Router();

const multer = require('multer');
const crypto = require('crypto');

const {
    getAdmin,
    getReports,
    getUsers,
    getDisputes,
    getBlogs,
    withdrawAccept,
    withdrawDeny,
    withdrawAcceptAll,
    withdrawDenyAll,
    deleteProfit,
    deleteAllProfits,
    banUser,
    partnerUser,
    partnerDecline,
    reportDelete,
    productDelete,
    reviewDelete,
    dealDelete,
    getNewBlog,
    newBlog,
    getUpdateBlog,
    updateBlog,
    deleteBlog
  } = require('../controllers/admin');

const middleware = require('../middleware/index');

const { asyncErrorHandler, checkId, isAdmin } = middleware;

// Set Storage Engine
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    let buf = crypto.randomBytes(16);
    buf = buf.toString('hex');
    let uniqFileName = file.originalname.replace(/\.jpeg|\.jpg|\.png/ig, '');
    uniqFileName += buf;
    cb(undefined, uniqFileName);
  },
});

const imageFilter = (req, file, cb) => {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5000000
  },
  onError: (err, next) => {
    next(err);
  },
});

// admin page
router.get('/', asyncErrorHandler(isAdmin), asyncErrorHandler(getAdmin));

// reports page
router.get('/reports', asyncErrorHandler(isAdmin), asyncErrorHandler(getReports));

// users page
router.get('/users', asyncErrorHandler(isAdmin), asyncErrorHandler(getUsers));

// disputes page
router.get('/disputes', asyncErrorHandler(isAdmin), asyncErrorHandler(getDisputes));

// blog crud
router.get('/blog', asyncErrorHandler(isAdmin), getBlogs);

// accept single withdraw
router.put('/accept/:id', asyncErrorHandler(isAdmin), checkId, asyncErrorHandler(withdrawAccept));

// deny single withdraw
router.put('/deny/:id', asyncErrorHandler(isAdmin), checkId, asyncErrorHandler(withdrawDeny));

// accept all withdraws
router.put('/acceptAll', asyncErrorHandler(isAdmin), asyncErrorHandler(withdrawAcceptAll));

// deny all withdraws
router.put('/denyAll', asyncErrorHandler(isAdmin), asyncErrorHandler(withdrawDenyAll));

// delete single profit
router.put('/delete/:id', asyncErrorHandler(isAdmin), checkId, asyncErrorHandler(deleteProfit));

// delete all profits
router.put('/deleteAll', asyncErrorHandler(isAdmin), asyncErrorHandler(deleteAllProfits));

// ban user
router.put('/banUser', asyncErrorHandler(isAdmin), asyncErrorHandler(banUser));

// partner user
router.put('/partnerUser', asyncErrorHandler(isAdmin), asyncErrorHandler(partnerUser));

// partner decline
router.put('/partnerDecline', asyncErrorHandler(isAdmin), asyncErrorHandler(partnerDecline));

// delete report
router.put('/deleteReport/:id', asyncErrorHandler(isAdmin), checkId, asyncErrorHandler(reportDelete));

// delete product
router.put('/deleteProduct/:id/:productid', asyncErrorHandler(isAdmin), checkId, asyncErrorHandler(productDelete));

// delete review
router.put('/deleteReview/:id/:reviewid', asyncErrorHandler(isAdmin), checkId, asyncErrorHandler(reviewDelete));

// delete deal
router.put('/deleteDeal/:id/:dealid', asyncErrorHandler(isAdmin), checkId, asyncErrorHandler(dealDelete));

// blog CRUD
router.get('/blog/new', asyncErrorHandler(isAdmin), getNewBlog);
router.post('/blog/new', asyncErrorHandler(isAdmin), upload.array('images', 5), asyncErrorHandler(newBlog));

router.get('/blog/:id/edit', asyncErrorHandler(isAdmin), asyncErrorHandler(getUpdateBlog));
router.put('/blog/:id/edit', asyncErrorHandler(isAdmin), upload.array('images', 5), asyncErrorHandler(updateBlog));

router.delete('/blog/:id/delete', asyncErrorHandler(isAdmin), asyncErrorHandler(deleteBlog));

module.exports = router;

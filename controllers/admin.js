const { validationResult } = require('express-validator');
const Product = require('../models/product');
const fileHelper = require('../util/file');

const errorOccurred = err => {
  const error = new Error(err);
  error.httpStatusCode = 500;
  return next(error);
}

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasErrors: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const userId = req.user._id;
  const errors = validationResult(req);
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      product: {
        title: title,
        price: price,
        description: description
      },
      hasErrors: true,
      errorMessage: 'Attached file is not an image',
      validationErrors: []
    })
  }
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      product: {
        title: title,
        price: price,
        description: description
      },
      hasErrors: true,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    })
  }

  const imageUrl = image.path;
  const product = new Product(
    title,
    price,
    description,
    imageUrl,
    null,
    userId
  );
  // throw new Error('dummy');
  product
    .save(userId)

    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      errorOccurred(err);
    });
};

exports.getEditProduct = (req, res, next) => {
  // console.log('edit', req.body)
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    // Product.findById(prodId)
    .then(product => {
      console.log('y', product);
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasErrors: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => {
      errorOccurred(err);
    });
};

exports.postEditProduct = (req, res, next) => {
  const userId = req.user._id;
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;
  const errors = validationResult(req);
  // const img = req.body.image;
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: false,
      product: {
        title: title,
        price: price,
        description: description
      },
      hasErrors: true,
      errorMessage: 'Attached file is not an image',
      validationErrors: []
    })
  }

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      },
      hasErrors: true,
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    })
  }

  const updatedImageUrl = image.path;
  Product.findById(prodId)
  .then(product => {
    fileHelper.deleteFile(product.imageUrl);    
  }).catch(err => {
    console.log(err);
  })

  const product = new Product(
    updatedTitle,
    updatedPrice,
    updatedDesc,
    updatedImageUrl,
    prodId,
    userId
  );
  product
    .save(userId)
    .then(result => {
      console.log('UPDATED PRODUCT!');
      res.redirect('/admin/products');
    })
    .catch(err => {
      errorOccurred(err);
    });
};

exports.getProducts = (req, res, next) => {
  const userId = req.user._id;
  Product.findByUser(userId)
    .then(products => {
      // console.log('here2', products);
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => {
      errorOccurred(err);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  const userId = req.user._id;
  Product.findById(prodId)
  .then(product => {
    fileHelper.deleteFile(product.imageUrl);    
  }).catch(err => {
    console.log(err);
  })
  
  Product.deleteById(prodId, userId)
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.status(200).json({message: 'Success'})
    })
    .catch(err => {
      res.status(200).json({message: 'Failed to delete product'})
    });
};

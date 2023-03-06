const Product = require('../models/product');
const Order = require('../models/order');
const fs = require('fs');
const path = require('path');
const PDFdoc = require('pdfkit');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_KEY_2);
const ITEMS_PER_PAGE = 2;

const errorOccurred = err => {
  const error = new Error(err);
  error.httpStatusCode = 500;
  return next(error);
}

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.fetchWithCount()
  .then(numOfProds => {
    totalItems = numOfProds;
    return Product.fetchAll(page);
  })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All products',
        path: '/products',
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage:page - 1,
        currentPage: page,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      errorOccurred(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  // Product.findAll({ where: { id: prodId } })
  //   .then(products => {
  //     res.render('shop/product-detail', {
  //       product: products[0],
  //       pageTitle: products[0].title,
  //       path: '/products'
  //     });
  //   })
  //   .catch(err => console.log(err));
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => {
      errorOccurred(err);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product.fetchWithCount()
  .then(numOfProds => {
    totalItems = numOfProds;
    return Product.fetchAll(page);
  })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage:page - 1,
        currentPage: page,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      errorOccurred(err);
    });
};

exports.getCart = (req, res, next) => {
  // console.log('rsu2', req.session.user);
  // console.log('ru', req.user, typeof req.user);


  req.user.getCart()
    .then(products => {
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })

    .catch(err => {
      errorOccurred(err);
    });

};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })

    .then(result => {
      // console.log(result);
      res.redirect('/cart');
    })
    .catch(err => {
      errorOccurred(err);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;

  req.user
    .deleteItemFromCart(prodId)

    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      errorOccurred(err);
    });
};

exports.getCheckout = (req, res, next) => {
  let total;
  req.user.getCart()
  .then(products => {
    total = 0;
    products.forEach(prod => {
      total += prod.quantity * prod.price;
    })

    return stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: "payment",
      line_items: products.map(item => {
        return {
          price_data: {
            currency: 'usd',
            unit_amount_decimal: item.price * 100,
            product_data: {
              name: item.title,
              description: item.description
            }
          },
          quantity: item.quantity
        };
      }),
      success_url: req.protocol + '://' + req.get('host') + '/checkout/success', 
      cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
    })
    .then(session => {
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum: total,
        sessionId: session.id
      });

    })
    .catch(err => {
      console.log(err);
    })
  })
  .catch(err => {
    errorOccurred(err);
  });
}

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .addOrder()

    .then(result => {
      res.redirect('/orders');
    })
    .catch(err => {
      errorOccurred(err);
    });
};

exports.getOrders = (req, res, next) => {
  req.user
    .getOrders()

    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => {
      errorOccurred(err);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return next(new Error('No orders found'));
      }
      if (order.user._id.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized'));
      }
      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join('data', 'invoices', invoiceName);
      const pdfDoc = new PDFdoc();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      let totalPrice = 0;
      pdfDoc.fontSize(26).text('Invoice');
      pdfDoc.text('-----------');
      order.items.forEach(product => {
        totalPrice += product.price * product.quantity;
        pdfDoc.fontSize(16).text(`${product.title} : ${product.quantity} X $ ${product.price}`);
      });
      pdfDoc.text('--------')
      pdfDoc.fontSize(20).text('Total Price : $ ' + totalPrice);
      pdfDoc.end();
    })
    .catch(err => {
      errorOccurred(err);
    })

  // fs.readFile(invoicePath, (err, data) => {
  //   if (err) {
  //     return next(err);
  //   }
  //   res.setHeader('Content-Type', 'application/pdf');
  //   res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');
  //   res.send(data);
  // })
  // const file = fs.createReadStream(invoicePath);
  // file.pipe(res);
}

//alternate pagination logic
// Product.countDocuments()
//         .then(totalProductsCount => {
//           const pagesCount = Math.ceil(totalProductsCount / ITEMS_PER_PAGE);
//           return {
//             totalPages: pagesCount,
//             currPage: page,
//             hasPrev: page > 1,
//             hasNext: page < pagesCount
//           };
//         })
//         .then(pagingData => {
//           res.render("shop/index", {
//             products: products,
//             pageTitle: "All Products",
//             path: "/shop",
//             pagination: pagingData
//           });
//         });
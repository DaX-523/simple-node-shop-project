const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;
const ITEMS_PER_PAGE = 2;


class Product {
  constructor(title, price, description, imageUrl, id, userId) {
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    this._id = id ? new mongodb.ObjectId(id) : null;
    this.userId = userId;
  }

  save(userId) {
    const db = getDb();
    let dbOp;
    if (this._id) {
      // Update the product
      dbOp = db
        .collection('products')
        .updateOne({ _id: this._id, userId: userId }, { $set: this });
    } else {
      dbOp = db.collection('products').insertOne(this);
    }
    return dbOp
      .then(result => {
        // console.log(result);
      })
      .catch(err => {
        console.log(err);
      });
  }

  static fetchAll(page = 2) {
    const db = getDb();
    return db
      .collection('products')
      .find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .toArray()
      .then(products => {
        console.log(products);
        return products;
      })
      .catch(err => {
        console.log(err);
      });
  }

  static fetchWithCount() {
    const db = getDb();
    return db
    .collection('products')
    .find()
    .count()
    .then(count => {
      return count;
    })
    .catch(err => {
      console.log(err);
    })
  }

  static findByUser(userId) {
    const db = getDb();
    return db
      .collection('products')
      .find({ userId: new mongodb.ObjectId(userId) })
      .toArray()
      // .next()
      .then(product => {
        // console.log('here', product);
        return product;
      })
      .catch(err => {
        console.log(err);
      });
  }

  static findById(prodId) {
    const db = getDb();
    return db
      .collection('products')
      .find({ _id: new mongodb.ObjectId(prodId) })
      .next()
      .then(product => {
        // console.log(product);
        return product;
      })
      .catch(err => {
        console.log(err);
      });
  }

  static deleteById(prodId, userId) {
    const db = getDb();
    return db
      .collection('products')
      .deleteOne({ _id: new mongodb.ObjectId(prodId), userId: userId })
      .then(result => {
        console.log('Deleted');
      })
      .catch(err => {
        console.log(err);
      });
  }
}

module.exports = Product;

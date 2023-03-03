const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

const ObjectId = mongodb.ObjectId;

class User {
  constructor(name, email, password, cart, id, resetToken, resetTokenExpiration) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.cart = cart; // {items: []}
    this._id = id;
    this.resetToken = resetToken;
    this.resetTokenExpiration = resetTokenExpiration;
  }

  save() {
    const db = getDb();
    return db.collection('users').insertOne(this);
  }

  addToCart(product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
      return cp.productId.toString() === product._id.toString();
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
      newQuantity = this.cart.items[cartProductIndex].quantity + 1;
      updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
      updatedCartItems.push({
        productId: new ObjectId(product._id),
        quantity: newQuantity
      });
    }
    const updatedCart = {
      items: updatedCartItems
    };
    const db = getDb();
    return db
      .collection('users')
      .updateOne(
        { _id: new ObjectId(this._id) },
        { $set: { cart: updatedCart } }
      );
  }

  getCart() {
    const db = getDb();
    // console.log(this);
    const productIds = this.cart.items.map(i => {
      return i.productId;
    });
    return db
      .collection('products')
      .find({ _id: { $in: productIds } })
      .toArray()
      .then(products => {
        return products.map(p => {
          return {
            ...p,
            quantity: this.cart.items.find(i => {
              return i.productId.toString() === p._id.toString();
            }).quantity
          };
        });
      });
  }

  deleteItemFromCart(productId) {
    const updatedCartItems = this.cart.items.filter(item => {
      return item.productId.toString() !== productId.toString();
    });
    const db = getDb();
    return db
      .collection('users')
      .updateOne(
        { _id: new ObjectId(this._id) },
        { $set: { cart: { items: updatedCartItems } } }
      );
  }

  addOrder() {
    const db = getDb();
    return this.getCart()
      .then(products => {
        const order = {
          items: products,
          user: {
            _id: new ObjectId(this._id),
            name: this.name
          }
        };
        return db.collection('orders').insertOne(order);
      })
      .then(result => {
        this.cart = { items: [] };
        return db
          .collection('users')
          .updateOne(
            { _id: new ObjectId(this._id) },
            { $set: { cart: { items: [] } } }
          );
      });
  }

  getOrders() {
    const db = getDb();
    return db
      .collection('orders')
      .find({ 'user._id': new ObjectId(this._id) })
      .toArray();
  }

  static findById(userId) {
    const db = getDb();
    return db
      .collection('users')
      .findOne({ _id: new ObjectId(userId) })
      .then(user => {
        return user;
      })
      .catch(err => {
        console.log(err);
      });
  }
  
  static findByIdandToken(userId, token) {
    const db = getDb();
    return db
      .collection('users')
      .findOne({
        _id: new ObjectId(userId),
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() }
      })
      .then(user => {
        return user;
      })
      .catch(err => {
        console.log(err);
      });
  }


  static findByEmail(email) {
    const db = getDb();
    return db
      .collection('users')
      .findOne({ email: email })
      .then(user => {
        return user;
      })
      .catch(err => {
        console.log(err);
      });
  }

  static findByToken(token) {
    const db = getDb();
    return db
      .collection('users')
      .findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
      .then(user => {
        return user;
      })
      .catch(err => {
        console.log(err);
      });
  }

  static update(email, token) {
    const db = getDb();
    return db
      .collection('users')
      .updateOne({ email: email }, { $set: { resetToken: token, resetTokenExpiration: Date.now() + 3600000 } })
  }

  static updatePassword(userId, newPassword) {
    const db = getDb();
    return db
      .collection('users')
      .updateOne({ _id: new ObjectId(userId) },
        {
          $set:
          {
            password: newPassword,
            resetToken: undefined,
            resetTokenExpiration: undefined
          }
        })
  }
}

module.exports = User;

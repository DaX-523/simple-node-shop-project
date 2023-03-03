// const mongoose = require('mongoose');

// const Schema = mongoose.Schema;

// const orderSchema = new Schema({
//   products: [
//     {
//       product: { type: Object, required: true },
//       quantity: { type: Number, required: true }
//     }
//   ],
//   user: {
//     name: {
//       type: String,
//       required: true
//     },
//     userId: {
//       type: Schema.Types.ObjectId,
//       required: true,
//       ref: 'User'
//     }
//   }
// });

// module.exports = mongoose.model('Order', orderSchema);

const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

const ObjectId = mongodb.ObjectId;


class Order {
  constructor(id, items, user) {
    this._id = id;
    this.items = items;
    this.user = user;
  }

  static findById (orderId) {
    const db = getDb();
    return db
      .collection('orders')
      .findOne({_id: new ObjectId(orderId)})
      .then(order => {
        return order;
      })
      .catch(err => {
        console.log(err);
      })
  }
}

module.exports = Order;
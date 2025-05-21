const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  orderId: String,
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shops" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
  userName: String,
  userPhone: String,
  userLocation: String,
  totalPrice: Number,
  products: [
    {
      shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shops" },
      productId: String,
      title: String,
      price: Number,
      quantity: Number,
      selectedColor: String,
      selectedSize: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
  type: String,
  enum: ["Pending", "Prepared", "Delivered", "New"],
  default: "New",
}
});

module.exports = mongoose.model("Order", OrderSchema);

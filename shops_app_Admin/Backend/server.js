require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const Order = require("../models/Order");
const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ✅ Admin Schema داخل السيرفر
const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Admin = mongoose.model("Admin", adminSchema, "Admins");
const ShopSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  fullName: String,
  email: String,
  password: String,
  location: String,
  phoneNumber: String,
  logo: String,
  cover: String,
  categories: [
    {
      name: String,
      products: [
        {
          title: String,
          price: Number,
          MainImage: String,
          categoryName: String,
          colors: [
            {
              name: String,
              previewImage: String,
              images: [String],
              sizes: [
                {
                  size: String,
                  stock: Number,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});
const Shop = mongoose.model("Shops", ShopSchema);


// ✅ Route تسجيل الدخول
app.post("/loginSeller", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ field: "email", message: "Email not found" });
    }

    if (admin.password !== password) {
      return res.status(401).json({ field: "password", message: "Incorrect password" });
    }

    res.json({
      userId: admin._id,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.get('/admin/grouped-orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('shopId', 'shopName');

    const grouped = {};

    for (const order of orders) {
      const shopName = order.shopId?.shopName || 'Unknown Shop';
      if (!grouped[shopName]) grouped[shopName] = [];
      grouped[shopName].push(order);
    }

    res.json(grouped);
  } catch (err) {
    console.error('❌ Error grouping orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

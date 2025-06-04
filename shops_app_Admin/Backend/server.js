require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const Order = require("../models/Order");
const Notification = require("../models/Notification");
const axios = require("axios");
const app = express();
const { NGROK_URL } = require("./ngrok-url");
const API_BASE_URL = `${NGROK_URL}/shops_app_buyers`;

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
  status: {
  type: String,
  enum: ["approved", "pending"],
  default: "pending", 
}


});
const Shop = mongoose.model("Shops", ShopSchema);


app.post("/loginAdmin", async (req, res) => {
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
    const { customer, product, location, date, sort, shopName , status } = req.query;

    const filter = {};

    if (customer) {
      filter.userName = { $regex: new RegExp(customer, 'i') };
    }

    if (location) {
      filter.userLocation = { $regex: new RegExp(location, 'i') };
    }
if (status && status !== "All") {
  filter.status = status;
}

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    // 🧠 Fetch all orders matching filters
    let orders = await Order.find(filter).populate('shopId', 'shopName');

    // 🧠 Filter by product title (client-side after fetch)
    if (product) {
      orders = orders.filter((order) =>
        order.products.some((p) =>
          p.title.toLowerCase().includes(product.toLowerCase())
        )
      );
    }

    // 🧠 Filter by shop name (after population)
    if (shopName) {
      orders = orders.filter((order) =>
        order.shopId?.shopName?.toLowerCase().includes(shopName.toLowerCase())
      );
    }

    // 🧠 Sort by createdAt
    if (sort === 'asc') {
      orders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // 🧠 Group orders by shop name
    const grouped = {};
    for (const order of orders) {
      const shop = order.shopId?.shopName || 'Unknown Shop';
      if (!grouped[shop]) grouped[shop] = [];
      grouped[shop].push(order);
    }

    res.json({ grouped, all: orders });
  } catch (err) {
    console.error('❌ Error grouping orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/admin/orders/:id/deliver', async (req, res) => {
  try {
    const { id } = req.params;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        status: "Delivered",
        deliveredAt: new Date(), 
      },
      { new: true } 
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order marked as delivered", order: updatedOrder });
  } catch (err) {
    console.error("❌ Failed to update order:", err);
    res.status(500).json({ message: "Failed to update order" });
  }
});
// Undo delivery (from Delivered → back to previous state)
app.put('/admin/orders/:id/undo-deliver', async (req, res) => {
  try {
    const { id } = req.params;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        status: "Delivered to Admin",  // أو "Prepared" حسب منطقك
        deliveredAt: null,             // إلغاء تاريخ تسليم الكوستمر
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order delivery undone", order: updatedOrder });
  } catch (err) {
    console.error("❌ Undo delivery error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/admin/shops", async (req, res) => {
  try {
    const shops = await Shop.find({ status: "approved" }); // ✅ فقط الموافق عليها
    res.json(shops);
  } catch (err) {
    console.error("❌ Error fetching shops:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/admin/shops/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;

    const deleted = await User.findByIdAndDelete(shopId);

    if (!deleted) {
      return res.status(404).json({ message: "Shop not found" });
    }

    res.json({ message: "Shop deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting shop:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/admin/approve-shop/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;

    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    shop.status = "approved";
    await shop.save();

    res.json({ message: "Shop approved", shop });
  } catch (err) {
    console.error("Error approving shop:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/admin/pending-shops", async (req, res) => {
  try {
    const pendingShops = await Shop.find({ status: "pending" });
    res.json(pendingShops);
  } catch (err) {
    console.error("❌ Error fetching pending shops:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/admin/delete-shop/:shopId", async (req, res) => {
  const { shopId } = req.params;

  try {
    // 1. حذف المحل من قاعدة البيانات
    await Shop.findByIdAndDelete(shopId);

    // 2. حذف الطلبات المرتبطة بالمحل
    await Order.deleteMany({ shopId });

    // 3. حذف الإشعارات المرتبطة بالمحل
    await Notification.deleteMany({ shopId });

    // 4. إرسال طلب إلى سيرفر الكلاينت لحذف السلة والمفضلات
    const buyerResponse = await axios.delete(`${API_BASE_URL}/admin/delete-shop-data/${shopId}`);

    res.status(200).json({
      message: "Shop and all related data deleted from admin and client servers",
      clientResult: buyerResponse.data,
    });
  } catch (error) {
    console.error("❌ Error deleting shop and related data:", error.message);
    res.status(500).json({ error: "Failed to delete shop and related data." });
  }
});

app.put("/admin/remove-approval/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;

    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    shop.status = "pending";
    await shop.save();

    res.json({ message: "Shop moved back to pending", shop });
  } catch (err) {
    console.error("Error removing approval:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/admin/create", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if admin already exists
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const newAdmin = new Admin({ email, password });
    await newAdmin.save();

    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

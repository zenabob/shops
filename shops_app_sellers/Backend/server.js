
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const Order = require("../models/Order");
const Notification = require("../models/Notification");


const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ======================
// MongoDB Connection
// ======================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ======================
// Schema
// ======================
const shopSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  logo: { type: String, default: "" },
  cover: { type: String, default: "" },
  categories: [
    {
      name: String,
      products: [
        {
          title: String,
          price: Number,
          MainImage: String,
          genderTarget: String,
          category: String,
          images: [String],
          colors: [
            {
              name: String,
              previewImage: String,
              images: [String],
              sizes: [{ size: String, stock: Number }],
            },
          ],
          sizes: [{ size: String, stock: Number }],
          offer: {
            discountPercentage: Number,
            expiresAt: Date,
          },
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

const User = mongoose.model("Shops", shopSchema);

// ======================
// Image Upload Setup
// ======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) =>
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    ),
});
const upload = multer({ storage });

// ======================
// Helper
// ======================

// ======================
// Routes
// ======================

// Register
app.put("/profile/:userId/category/:oldName", async (req, res) => {
  const { oldName } = req.params;
  const { newName } = req.body;

  try {
    const user = await User.findById(req.params.userId);

    if (!user) return res.status(404).json({ message: "No user found" });

    const normalizedOldName = oldName.trim().toLowerCase();

    const category = user.categories.find(
      (c) => c.name.trim().toLowerCase() === normalizedOldName
    );

    if (!category)
      return res.status(404).json({ message: "Category not found" });

    category.name = newName;
    await user.save();

    const categoryNames = user.categories.map((c) => c.name);
    res.json(categoryNames); // return updated names
  } catch (err) {
    console.error("Error updating category:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/create-account", async (req, res) => {
  try {
    const {
      shopName,
      fullName,
      email,
      password,
      confirmPassword,
      location,
      phoneNumber,
      
    } = req.body;

    if (
      !shopName ||
      !fullName ||
      !email ||
      !password ||
      !location ||
      !phoneNumber
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: { email: "Email already in use" } });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ error: { confirmPassword: "Passwords do not match" } });
    }

    const newUser = new User({
  shopName,
  fullName,
  email,
  password,
  location,
  phoneNumber,
  status: "pending",
});

    await newUser.save();

    res.status(201).json({ message: "Account created successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
app.post("/loginSeller", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ field: "email", message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ field: "email", message: "The email doesn't exist" });
    }

    if (user.password !== password) {
      return res
        .status(401)
        .json({ field: "password", message: "Incorrect password" });
    }

    // ✅ تحقق من الحالة قبل تسجيل الدخول
    if (user.status !== "approved") {
      return res.status(403).json({
        message: "Your account is pending approval by the admin.",
        status: "pending",
      });
    }

    res.status(200).json({
      message: "Login successful",
      userId: user._id.toString(),
      shopId: user._id.toString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Reset password
app.post("/reset-password", async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ error: { email: "Email not found" } });
    if (user.password === password)
      return res.status(400).json({
        error: {
          confirmPassword: "Password must be different from current password",
        },
      });
    if (password !== confirmPassword)
      return res
        .status(400)
        .json({ error: { confirmPassword: "Passwords do not match" } });

    user.password = password;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get shop profile
app.get("/profile/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) return res.status(404).json({ message: "No user found" });

    res.json({
      name: user.shopName,
      location: user.location,
      logo: user.logo,
      cover: user.cover,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// Update name/location
app.put("/profile/:userId", async (req, res) => {
  try {
    const { name, location } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) return res.status(404).json({ message: "No user found" });

    user.shopName = name;
    user.location = location;
    await user.save();

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Update error" });
  }
});

// Upload logo
app.post(
  "/profile/:userId/upload-logo",
  upload.single("image"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.logo = `/uploads/${req.file.filename}`;
      await user.save();
      res.json({ url: user.logo });
    } catch (err) {
      res.status(500).json({ message: "Upload error" });
    }
  }
);

// Upload cover
app.post("/profile/:userId/upload-cover",
  upload.single("image"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.cover = `/uploads/${req.file.filename}`;
      await user.save();
      res.json({ url: user.cover });
    } catch (err) {
      res.status(500).json({ message: "Upload error" });
    }
  }
);

// Get categories
app.get("/profile/:userId/category", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) return res.status(404).json({ message: "No user found" });

    const categoryNames = user.categories.map((c) => c.name);
    res.json(categoryNames);
  } catch (err) {
    res.status(500).json({ message: "Error fetching categories" });
  }
});
app.get("/profile/:userId/categories-with-products", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) return res.status(404).json({ message: "No user found" });

    res.json(user.categories); // includes name and products
  } catch (err) {
    res.status(500).json({ message: "Error fetching categories" });
  }
});

// Add category
app.post("/profile/:userId/category", async (req, res) => {
  const { category } = req.body;

  if (!category || category.trim() === "") {
    return res.status(400).json({ message: "Category is required" });
  }

  try {
    const user = await User.findById(req.params.userId);

    if (!user) return res.status(404).json({ message: "No user found" });

    const exists = user.categories.some((c) => c.name === category);
    if (!exists) {
      user.categories.push({ name: category });
      await user.save();
    }

    const categoryNames = user.categories.map((c) => c.name);
    res.json(categoryNames);
  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).json({ message: "Error saving category" });
  }
});

// Delete category
app.delete("/profile/:userId/category/:category", async (req, res) => {
  const { category } = req.params;

  try {
    const user = await User.findById(req.params.userId);

    if (!user) return res.status(404).json({ message: "No user found" });

    // ✅ This removes the category object from the array
    const updatedCategories = user.categories.filter(
      (c) => c.name !== category
    );

    user.categories = updatedCategories;

    await user.save();

    const categoryNames = user.categories.map((c) => c.name);
    res.json(categoryNames);
  } catch (err) {
    console.error("❌ Error deleting category:", err);
    res.status(500).json({ message: "Error deleting category" });
  }
});

// Add product to a category
app.post(
  "/profile/:userId/category/:category/product",
  upload.single("image"),
  async (req, res) => {
    try {
      const { category } = req.params;
      const {
        title,
        price,
        genderTarget,
        images,
        colors,
        sizes,
        offer,
      } = req.body;

      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ message: "No user found" });

      const categoryObj = user.categories.find((c) => c.name === category);
      if (!categoryObj)
        return res.status(404).json({ message: "Category not found" });

      const MainImage = req.file
        ? `/uploads/${req.file.filename}`
        : "";

      const parsedImages = images ? JSON.parse(images) : [];
      const parsedColors = colors ? JSON.parse(colors) : [];
      const parsedSizes = sizes ? JSON.parse(sizes) : [];
      let parsedOffer = null;
if (offer) {
  const temp = JSON.parse(offer);
  if (temp.discountPercentage && temp.expiresAt) {
    parsedOffer = temp;
  }
}


      const newProduct = {
        title,
        price: Number(price),
        MainImage,
        genderTarget,
        category,
        images: parsedImages,
        colors: parsedColors,
        sizes: parsedSizes,
        offer: parsedOffer,
      };

      categoryObj.products.push(newProduct);
      await user.save();

      res.json(categoryObj.products);
    } catch (err) {
      console.error("Error saving product:", err);
      res.status(500).json({ message: "Error saving product" });
    }
  }
);

app.delete(
  "/profile/:userId/category/:category/product/:productId",
  async (req, res) => {
    const { category, productId } = req.params;

    try {
      const user = await User.findById(req.params.userId);

      if (!user) return res.status(404).json({ message: "No user found" });

      const categoryObj = user.categories.find((c) => c.name === category);
      if (!categoryObj)
        return res.status(404).json({ message: "Category not found" });

      categoryObj.products = categoryObj.products.filter(
        (p) => p._id.toString() !== productId
      );
      await user.save();

      res.json({ message: "Product deleted successfully" });
    } catch (err) {
      console.error("Error deleting product:", err);
      res.status(500).json({ message: "Error deleting product" });
    }
  }
);
app.put(
  "/profile/:userId/category/:category/product/:productId",
  upload.single("image"),
  async (req, res) => {
    const { category, productId } = req.params;
    const updatedFields = req.body;

    try {
      const user = await User.findById(req.params.userId);

      if (!user) return res.status(404).json({ message: "No user found" });

      const categoryObj = user.categories.find((c) => c.name === category);
      if (!categoryObj)
        return res.status(404).json({ message: "Category not found" });

      const product = categoryObj.products.find(
        (p) => p._id.toString() === productId
      );
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      if (req.file) {
        product.MainImage = `/uploads/${req.file.filename}`;
      }

      if (updatedFields.title) product.title = updatedFields.title;
      if (updatedFields.price) product.price = Number(updatedFields.price);

      if (updatedFields.images) {
        product.images = JSON.parse(updatedFields.images);
      }

      if (updatedFields.colors) {
        product.colors = JSON.parse(updatedFields.colors); // ✅ previewImage و images per color
      }

      if (updatedFields.sizes) {
        product.sizes = JSON.parse(updatedFields.sizes);
      }

      await user.save();
      res.json({ message: "Product updated successfully", product });
    } catch (err) {
      console.error("Error updating product:", err);
      res.status(500).json({ message: "Error updating product" });
    }
  }
);
app.delete(
  "/profile/:userId/category/:category/product/:productId/color/:colorName",
  async (req, res) => {
    const { category, productId, colorName } = req.params;

    try {
      const user = await User.findById(req.params.userId);

      if (!user) return res.status(404).json({ message: "No user found" });

      const categoryObj = user.categories.find((c) => c.name === category);
      if (!categoryObj)
        return res.status(404).json({ message: "Category not found" });

      const product = categoryObj.products.find(
        (p) => p._id.toString() === productId
      );
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      // Filter out the color
      product.colors = product.colors.filter(
        (color) => color.name !== colorName
      );

      await user.save();
      res.json({ message: "Color deleted", updatedColors: product.colors });
    } catch (err) {
      console.error("Error deleting color:", err);
      res.status(500).json({ message: "Error deleting color" });
    }
  }
);
app.post(
  "/profile/:userId/upload-color",
  upload.single("image"),
  (req, res) => {
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
  }
);

// DELETE image from a specific color inside a product
app.delete(
  "/profile/:userId/category/:category/product/:productId/color/:colorName/image",
  async (req, res) => {
    const { category, productId, colorName } = req.params;
    const { imageUrl } = req.body;

    try {
      const user = await User.findById(req.params.userId);

      if (!user) return res.status(404).json({ message: "User not found" });

      const categoryObj = user.categories.find((c) => c.name === category);
      if (!categoryObj)
        return res.status(404).json({ message: "Category not found" });

      const product = categoryObj.products.find(
        (p) => p._id.toString() === productId
      );
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      const color = product.colors.find(
        (c) => c.name === decodeURIComponent(colorName)
      );
      if (!color) return res.status(404).json({ message: "Color not found" });

      // Log for debugging
      console.log("Before delete:", color.images);

      // Remove the image
      color.images = color.images.filter((img) => img !== imageUrl);

      console.log("After delete:", color.images);

      await user.save();

      res.json({ message: "Image deleted from color", updatedColor: color });
    } catch (err) {
      console.error("❌ Error deleting color image:", err);
      res
        .status(500)
        .json({ message: "Server error deleting image from color" });
    }
  }
);
app.put(
  "/profile/:userId/category/:category/product/:productId/offer",
  async (req, res) => {
    try {
      const { userId, category, productId } = req.params;
      const { discountPercentage, expiresAt } = req.body; // ← استبدلي الأسماء هنا

      if (!discountPercentage || !expiresAt) {
        return res.status(400).json({ message: "Missing discount data" });
      }

      const shop = await User.findById(userId); // ← استخدمي الموديل الصح

      if (!shop) {
        return res.status(404).json({ message: "Shop not found4" });
      }

      const categoryObj = shop.categories.find((cat) => cat.name === category);

      if (!categoryObj) {
        return res.status(404).json({ message: "Category not found" });
      }

      const product = categoryObj.products.find(
        (p) => p._id.toString() === productId
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      product.offer = {
        discountPercentage,
        expiresAt,
      };

      await shop.save();

      res.json({ message: "Offer applied successfully" });
    } catch (err) {
      console.error("Error applying offer:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);
app.get("/public/shops", async (req, res) => {
  try {
    const shops = await User.find({}, "shopName location logo cover");
    res.json(shops);
  } catch (err) {
    res.status(500).json({ message: "Error fetching shops" });
  }
});
app.get("/public/shop/:shopId/products", async (req, res) => {
  const shopId = req.params.shopId;
  const shop = await User.findById(shopId);

  if (!shop) return res.status(404).json({ message: "Shop not found5" });

  const categoriesWithShopId = shop.categories.map((category) => ({
    ...category.toObject(),
    products: category.products.map((product) => ({
      ...product.toObject(),
      shopId: shopId, // ✅ أضف shopId هنا
    })),
  }));

  res.json(categoriesWithShopId);
});

app.get("/public/shop/:shopId/product/:productId", async (req, res) => {
  try {
    const { shopId, productId } = req.params;

    console.log("🔍 Received shopId:", shopId);
    console.log("🔍 Received productId:", productId);

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      console.error("❌ Invalid shopId format:", shopId);
      return res.status(400).json({ message: "Invalid shopId" });
    }

    const shop = await User.findById(shopId);

    if (!shop) {
      console.error("❌ Shop not found:", shopId);
      return res.status(404).json({ message: "Shop not found" });
    }

    for (let category of shop.categories) {
      const product = category.products.find(
        (p) => p._id.toString() === productId
      );
      if (product) {
        return res.json({ product, category: category.name });
      }
    }

    res.status(404).json({ message: "Product not found" });
  } catch (err) {
    console.error("🔥 Internal error:", err);
    res
      .status(500)
      .json({ message: "Error fetching product", error: err.message });
  }
});


app.get("/public/shop/:shopId/media", async (req, res) => {
  try {
    const shop = await User.findById(req.params.shopId);

    if (!shop) return res.status(404).json({ message: "Shop not found2" });

    res.json({
      logo: shop.logo,
      cover: shop.cover,
      shopName: shop.shopName,
      location: shop.location,
    });
  } catch (err) {
    console.error("Error fetching media:", err);
    res.status(500).json({ message: "Error fetching media" });
  }
});

// backend
app.get("/random-covers", async (req, res) => {
  try {
    const shops = await User.aggregate([
      { $match: { cover: { $ne: "" } } },
      { $sample: { size: 5 } },
      { $project: { _id: 1, cover: 1, shopName: 1 } },
    ]);
    res.json(shops);
  } catch (err) {
    res.status(500).json({ message: "Error fetching covers" });
  }
});

// ✅ Get ALL products from all shops (for MainScreen)
app.get("/public/all-products", async (req, res) => {
  try {
    const shops = await User.find();

    const allProducts = [];

    for (const shop of shops) {
      for (const category of shop.categories) {
        for (const product of category.products) {
          let offer = null;
          if (
            product.offer &&
            product.offer.expiresAt &&
            new Date(product.offer.expiresAt) > new Date()
          ) {
            offer = product.offer;
          }
          
          allProducts.push({
            _id: product._id,
            title: product.title,
            price: product.price,
            MainImage: product.MainImage,
            genderTarget: product.genderTarget,
            categoryName: category.name?.trim().toLowerCase() || "",
            shopId: shop._id,
            colors: product.colors || [],
            offer, // ← فقط إذا العرض لا يزال ساري
          });
          
        }
      }
    }

    res.json(allProducts);
  } catch (err) {
    console.error("❌ Error fetching all products:", err);
    res.status(500).json({ message: "Error fetching all products" });
  }
});

// Route to get all products grouped by shop -> category -> product
app.get("/public/categoryProducts", async (req, res) => {
  try {
    const shops = await User.find({});
    res.json(shops);
  } catch (err) {
    console.error("Error fetching shops:", err);
    res.status(500).send("Server error");
  }
});

app.get("/public/shop-products/:shopName", async (req, res) => {
  const shopName = req.params.shopName?.trim().toLowerCase();

  try {
    const shop = await User.findOne({
      shopName: { $regex: new RegExp(`^${shopName}$`, "i") }, // تطابق مضبوط مع تجاهل حالة الحروف والمسافات
    });

    if (!shop) return res.status(404).json({ message: "Shop not found1" });

    const allProducts = [];

    shop.categories.forEach((category) => {
      category.products.forEach((product) => {
        allProducts.push({
          ...product.toObject(),
          shopName: shop.shopName,
          shopId: shop._id,
          categoryName: category.name,
        });
      });
    });

    res.json(allProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/public/categories", async (req, res) => {
  try {
    const shops = await User.find({});
    const categoriesSet = new Set();

    shops.forEach((shop) => {
      shop.categories?.forEach((category) => {
        if (category.name) categoriesSet.add(category.name);
      });
    });

    res.json(Array.from(categoriesSet));
  } catch (err) {
    res.status(500).json({ message: "Error fetching categories" });
  }
});

app.get("/public/search-suggestions", async (req, res) => {
  const query = req.query.q?.trim().toLowerCase();
  if (!query) return res.json([]);

  try {
    const shops = await User.find();
    const suggestions = [];

    const synonyms = {
      pants: ["bottoms", "pant"],
      bottoms: ["pants"],
      skirt: ["skirts"],
      skirts: ["skirt"],
      dress: ["dresses"],
      dresses: ["dress"],
      shoe: ["shoes"],
      shoes: ["shoe"],
    };

    function normalize(word) {
      return word.trim().toLowerCase().replace(/s$/, "");
    }

    function isSimilar(word1, word2) {
      const norm1 = normalize(word1);
      const norm2 = normalize(word2);
      if (norm1 === norm2) return true;
      if (synonyms[norm1] && synonyms[norm1].includes(norm2)) return true;
      if (synonyms[norm2] && synonyms[norm2].includes(norm1)) return true;
      return false;
    }

    const words = query.split(" ").filter(Boolean);

    // Shops
    for (const shop of shops) {
      if (shop.shopName.toLowerCase().includes(query)) {
        suggestions.push({
          type: "shop",
          name: shop.shopName,
          shopId: shop._id,
        });
      }
    }

    // Categories (INTELLIGENT + PARTIAL MATCH)
    const categoryMap = new Map();

    for (const shop of shops) {
      for (const category of shop.categories) {
        const catName = category.name?.trim().toLowerCase();
        if (!catName) continue;

        if (catName.includes(query) || isSimilar(catName, query)) {
          const normalizedCat = normalize(catName);

          if (!categoryMap.has(normalizedCat)) {
            categoryMap.set(normalizedCat, {
              type: "category",
              name: category.name,
              shopId: shop._id,
            });
          }
        }
      }
    }

    suggestions.push(...Array.from(categoryMap.values()));

    // Products
    for (const shop of shops) {
      for (const category of shop.categories) {
        for (const product of category.products) {
          if (product.title?.toLowerCase().includes(query)) {
            suggestions.push({
              type: "product",
              name: product.title,
              productId: product._id,
              shopId: shop._id,
            });
          }
        }
      }
    }

    // Colors
    const colorMap = new Map();

    for (const shop of shops) {
      for (const category of shop.categories) {
        for (const product of category.products) {
          for (const color of product.colors) {
            const colorName = color.name?.toLowerCase() || "";

            if (words.length === 1 && colorName.includes(query)) {
              const key = `${colorName}|${category.name}`;
              if (!colorMap.has(key)) {
                colorMap.set(key, {
                  type: "color",
                  colorName: color.name,
                  categoryName: category.name,
                  productName: product.title,
                  productId: product._id,
                  shopId: shop._id,
                });
              }
            }

            if (words.length === 2) {
              const [word1, word2] = words;
              if (
                colorName.includes(word1) &&
                category.name?.toLowerCase().includes(word2)
              ) {
                const key = `${colorName}|${category.name}`;
                if (!colorMap.has(key)) {
                  colorMap.set(key, {
                    type: "color",
                    colorName: color.name,
                    categoryName: category.name,
                    productName: product.title,
                    productId: product._id,
                    shopId: shop._id,
                  });
                }
              }
            }
          }
        }
      }
    }

    suggestions.push(...Array.from(colorMap.values()));

    res.json(suggestions);
  } catch (err) {
    console.error("❌ Error searching suggestions:", err);
    res.status(500).json({ message: "Error searching suggestions" });
  }
});

app.get("/public/search-category-products", async (req, res) => {
  const query = req.query.q?.trim().toLowerCase();
  if (!query) return res.json([]);

  try {
    const shops = await User.find();
    const allProducts = [];

    const synonyms = {
      pants: ["bottoms", "pant"],
      bottoms: ["pants"],
      skirt: ["skirts"],
      skirts: ["skirt"],
      dress: ["dresses"],
      dresses: ["dress"],
      shoe: ["shoes"],
      shoes: ["shoe"],
      woman: ["women"],
      women: ["woman"],
      man: ["men"],
      men: ["man"],
      kid: ["kids", "children"],
      kids: ["kid", "children"],
      child: ["kid", "kids"],
    };

    function normalize(word) {
      return word.trim().toLowerCase().replace(/s$/, "");
    }

    function isSimilar(word1, word2) {
      const norm1 = normalize(word1);
      const norm2 = normalize(word2);
      if (norm1 === norm2) return true;
      if (synonyms[norm1]?.includes(norm2)) return true;
      if (synonyms[norm2]?.includes(norm1)) return true;
      return false;
    }

    const queryWords = query.split(" ").map(normalize);

    for (const shop of shops) {
      for (const category of shop.categories) {
        const categoryWords =
          category.name
            ?.toLowerCase()
            .split(/\s|&|-/)
            .map(normalize) || [];

        const matches = queryWords.some((queryWord) =>
          categoryWords.some((catWord) => isSimilar(catWord, queryWord))
        );

        if (matches) {
          for (const product of category.products) {
            allProducts.push({
              ...product.toObject(),
              shopName: shop.shopName,
              shopId: shop._id,
              categoryName: category.name,
            });
          }
        }
      }
    }

    res.json(allProducts);
  } catch (err) {
    console.error("Error fetching category products:", err);
    res.status(500).json({ message: "Error fetching category products" });
  }
});
app.get("/shop/:shopId/orders", async (req, res) => {
  try {
    const { shopId } = req.params;
    const { sort = "desc", customer, product, location, date } = req.query;

    let filter = { shopId };

    if (customer) {
      filter.userName = { $regex: new RegExp(customer, "i") };
    }

    if (location) {
      filter.userLocation = { $regex: new RegExp(location, "i") };
    }

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    if (product) {
      filter.products = {
        $elemMatch: {
          title: { $regex: new RegExp(product, "i") },
        },
      };
    }

    const orders = await Order.find(filter).sort({
      createdAt: sort === "asc" ? 1 : -1,
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error("❌ Error fetching filtered shop orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const updateData = { status };

    if (status === "Delivered to Admin") {
      updateData.deliveredToAdminAt = new Date(); // ✅ Set the delivery date
    }

    const order = await Order.findOneAndUpdate(
      { orderId },
      updateData,
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Status updated", order });
  } catch (err) {
    console.error("❌ Error updating status:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.post("/notify-soldout", async (req, res) => {
  try {
    const { shopId, productId, color, size } = req.body;

    const shop = await User.findById(shopId);
    if (!shop) return res.status(404).json({ message: "Shop not found3" });

    let productTitle = "Unknown Product";

    for (const category of shop.categories) {
      const product = category.products.find(
        (p) => p._id.toString() === productId
      );
      if (product) {
        productTitle = product.title;
        break;
      }
    }

    const existingNotification = await Notification.findOne({
      shopId,
      productId,
      color,
      size,
      isRead: false,
    });

    if (existingNotification) {
      return res.status(200).json({ message: "Already notified" });
    }

    const notification = new Notification({
      shopId,
      productId,
      color,
      size,
      productTitle, // 👈 أضف هذا الحقل في سكيمة Notification أيضًا
    });

    await notification.save();
    res.status(201).json({ message: "Sold out notification created" });
  } catch (err) {
    console.error("❌ Error saving sold-out notification:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/notifications/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    const { onlyUnread } = req.query;

    const filter = { shopId };
    if (onlyUnread === "true") {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .populate("productId", "title") 
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/notifications/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;

    const updated = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error("❌ Error marking notification as read:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.put('/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const updateFields = { status };

    if (status === "Delivered to Admin") {
      updateFields.deliveredToAdminAt = new Date();
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { $set: updateFields },
      { new: true }
    );

    res.json({ order: updatedOrder });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

app.get("/statistics/items-sold", async (req, res) => {
  try {
    const { shopId, range = "month" } = req.query;
    const matchStage = shopId ? { shopId: new mongoose.Types.ObjectId(shopId) } : {};
    const groupByFormat = range === "day" ? "%Y-%m-%d" : "%Y-%m";

    const result = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$products" },
      {
        $group: {
          _id: { date: { $dateToString: { format: groupByFormat, date: "$createdAt" } } },
          totalQuantity: { $sum: "$products.quantity" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    res.json(result);
  } catch (err) {
    console.error("Error getting items sold stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 💰 Turnover (revenue) by month/day
app.get("/statistics/turnover", async (req, res) => {
  try {
    const { shopId, range = "month" } = req.query;
    const matchStage = shopId ? { shopId: new mongoose.Types.ObjectId(shopId) } : {};
    const groupByFormat = range === "day" ? "%Y-%m-%d" : "%Y-%m";

    const result = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { date: { $dateToString: { format: groupByFormat, date: "$createdAt" } } },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    res.json(result);
  } catch (err) {
    console.error("Error getting turnover stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🗺️ Items sold by region (pie)
app.get("/statistics/sales-by-region", async (req, res) => {
  try {
    const { shopId } = req.query;
    const matchStage = shopId ? { shopId: new mongoose.Types.ObjectId(shopId) } : {};

    const result = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$userLocation",
          totalQuantity: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]);

    res.json(result);
  } catch (err) {
    console.error("Error getting sales by region:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📍 Purchases by region (pie - count of orders)
app.get("/statistics/purchases-by-region", async (req, res) => {
  try {
    const { shopId } = req.query;
    const matchStage = shopId ? { shopId: new mongoose.Types.ObjectId(shopId) } : {};

    const result = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$userLocation",
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { orderCount: -1 } },
    ]);

    res.json(result);
  } catch (err) {
    console.error("Error getting purchases by region:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 💼 Total turnover by shop (admin-wide)
app.get("/statistics/total-turnover-by-shop", async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        $group: {
          _id: "$shopId",
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.json(result);
  } catch (err) {
    console.error("Error getting total turnover by shop:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔝 Top sold products by quantity (per shop)
app.get("/statistics/top-products", async (req, res) => {
  try {
    const { shopId } = req.query;
    const matchStage = shopId ? { shopId: new mongoose.Types.ObjectId(shopId) } : {};

    const result = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.title",
          totalQuantity: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    res.json(result);
  } catch (err) {
    console.error("Error getting top products:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// Start Server
// ======================
const PORT = process.env.PORT || 5002;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on port ${PORT} (ready for ngrok)`)
);


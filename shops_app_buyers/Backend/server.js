require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const Order = require("../modals/Order");
const { v4: uuidv4 } = require("uuid");
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// ✅ Serve the uploads folder (for images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String, required: true },
  PhoneNumber: { type: Number, required: true },
  age: { type: Number, required: true, min: 15, max: 100 },
  Gender: { type: String, required: true },

  cart: [
    {
      shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shops",
        required: true,
      },
      productId: { type: String, required: true },
      title: { type: String },
      image: { type: String },
      price: { type: Number },
      selectedColor: String,
      selectedSize: String,
      quantity: { type: Number, default: 1 },
      categoryName: String,
      offer: {
        discountPercentage: Number,
        expiresAt: Date,
      },
    },
  ],
  favorites: [
    {
      productId: { type: String, required: true },
      title: String,
      image: String,
      color: String,
      price: Number,
      shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shops" },
      categoryName: String,
      offer: {
        discountPercentage: Number,
        expiresAt: Date,
      },
    },
  ],

  viewedProducts: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      viewedAt: { type: Date, default: Date.now },
    },
  ],
});

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

// Models
const User = mongoose.model("Client", UserSchema);
const Shop = mongoose.model("Shops", ShopSchema);
const ProductSchema = new mongoose.Schema({
  title: String,
  price: Number,
  MainImage: String,
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
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shops" },
});

const Product = mongoose.model("Product", ProductSchema);

// ✅ Login Route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found." });

    if (user.password !== password)
      return res.status(400).json({ message: "Incorrect password." });

    res.status(200).json({
      message: "Login successful!",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Reset Password
app.post("/reset-password", async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email does not exist" });

    if (user.password === password)
      return res.status(400).json({
        message: "New password must be different from the old password.",
      });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    user.password = password;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Register User
app.post("/UserAccount", async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      location,
      age,
      PhoneNumber,
      Gender,
    } = req.body;

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !location.trim() ||
      !age
    ) {
      return res
        .status(400)
        .json({ error: { general: "All fields are required." } });
    }

    if (!/^[a-zA-Z\s]+$/.test(fullName)) {
      return res.status(400).json({
        error: { fullName: "Full name can only contain letters and spaces." },
      });
    }

    if (!/^[a-zA-Z\s]+$/.test(location)) {
      return res.status(400).json({
        error: { location: "Location can only contain letters and spaces." },
      });
    }

    if (isNaN(age) || age < 15 || age > 100) {
      return res
        .status(400)
        .json({ error: { age: "Age must be between 15 and 100." } });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,14}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: {
          password:
            "Password must be 6-14 characters, include uppercase, lowercase, number, and symbol.",
        },
      });
    }
    if (!PhoneNumber || isNaN(PhoneNumber) || String(PhoneNumber).length < 6) {
      return res
        .status(400)
        .json({ error: { PhoneNumber: "Valid phone number is required." } });
    }

    if (!Gender || !["male", "female", "Male", "Female"].includes(Gender)) {
      return res
        .status(400)
        .json({ error: { Gender: "Gender must be 'male' or 'female'." } });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: { email: "Email already in use." } });
    }

    const newUser = new User({
      fullName,
      email,
      password,
      location,
      age: Number(age),
      PhoneNumber: Number(PhoneNumber),
      Gender,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("❌ Error saving data:", error);
    res.status(500).json({ error: { general: "Internal Server Error" } });
  }
});

app.post("/profile/:userId/cart", async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      shopId,
      shopName,
      productId,
      selectedColor,
      selectedSize,
      title,
      image,
      price,
      offer,
    } = req.body;

    if (!shopId || !productId || !selectedColor || !selectedSize) {
      return res.status(400).json({
        message: "Missing field(s)",
        details: { shopId, productId, selectedColor, selectedSize },
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Declare the variable here
    const existingItem = user.cart.find(
      (item) =>
        item.shopId.toString() === shopId &&
        item.productId === productId &&
        item.selectedColor === selectedColor &&
        item.selectedSize === selectedSize
    );

    if (existingItem) {
      existingItem.quantity += 1;

      // ✅ Update the offer if it's new or updated
      if (
        offer &&
        (!existingItem.offer ||
          new Date(offer.expiresAt) >
            new Date(existingItem.offer?.expiresAt || 0))
      ) {
        existingItem.offer = offer;
      }
    } else {
      user.cart.push({
        shopId,
        shopName,
        productId,
        title,
        image,
        price,
        selectedColor,
        selectedSize,
        quantity: 1,
        offer,
      });
    }

    await user.save();
    res.status(200).json({ message: "Cart updated", cart: user.cart });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/profile/:userId/cart", async (req, res) => {
  try {
    // ✅ استخدمي populate للحصول على shopId ككائن يحتوي على shopName
    const user = await User.findById(req.params.userId).populate("cart.shopId");

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.cart || !Array.isArray(user.cart)) user.cart = [];

    const updatedCart = [];

    for (const item of user.cart) {
      const { shopId, productId } = item;

      try {
        const resProduct = await axios.get(
          `http://172.20.10.4:5000/public/shop/${shopId._id}/product/${productId}`
        );

        const product = resProduct.data?.product;
        if (!product) continue;

        const productOffer = product.offer;

        // ✅ تحقق من صلاحية العرض وأضفه للسلة إن وجد
        if (
          productOffer &&
          productOffer.expiresAt &&
          new Date(productOffer.expiresAt) > new Date()
        ) {
          item.offer = productOffer;
        } else {
          item.offer = null;
        }

        updatedCart.push(item);
      } catch (err) {
        console.warn("❌ Error fetching product for cart item:", productId);
      }
    }

    user.cart = updatedCart;
    await user.save();

    res.status(200).json(user.cart);
  } catch (error) {
    console.error("❌ Error fetching cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/profile/:userId/cart", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, selectedColor, selectedSize } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.cart = user.cart.filter(
      (item) =>
        item.productId !== productId ||
        item.selectedColor !== selectedColor ||
        item.selectedSize !== selectedSize
    );

    await user.save();
    res.status(200).json({ message: "Item removed", cart: user.cart });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/user/:userId/favorites/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.favorites = user.favorites.filter(
      (item) => item.productId !== productId
    );

    await user.save();
    res
      .status(200)
      .json({ message: "Removed from favorites", favorites: user.favorites });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
app.post("/user/:userId/favorites", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, title, image, color, price, shopId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const alreadyFavorite = user.favorites.find(
      (item) => item.productId === productId
    );
    if (alreadyFavorite) {
      return res.status(400).json({ message: "Product already in favorites" });
    }

    let offer = null;
    try {
      const resProduct = await axios.get(
        `http://172.20.10.4:5000/public/shop/${shopId}/product/${productId}`
      );
      const product = resProduct.data.product;
      if (product?.offer && new Date(product.offer.expiresAt) > new Date()) {
        offer = {
          discountPercentage: product.offer.discountPercentage,
          expiresAt: product.offer.expiresAt,
        };
      }
    } catch (err) {
      console.warn("⚠️ Failed to fetch offer while adding to favorites:", err);
    }

    user.favorites.push({
      productId,
      title,
      image,
      color,
      price,
      shopId,
      offer,
    });
    await user.save();

    res
      .status(200)
      .json({ message: "Added to favorites", favorites: user.favorites });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/user/:userId/favorites", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let updated = false;

    for (let i = 0; i < user.favorites.length; i++) {
      const fav = user.favorites[i];

      try {
        const resProduct = await axios.get(
          `http://172.20.10.4:5000/public/shop/${fav.shopId}/product/${fav.productId}`
        );
        const product = resProduct.data.product;

        if (product?.offer && new Date(product.offer.expiresAt) > new Date()) {
          fav.offer = {
            discountPercentage: product.offer.discountPercentage,
            expiresAt: product.offer.expiresAt,
          };
          updated = true;
        } else if (fav.offer) {
          fav.offer = null;
          updated = true;
        }
      } catch (err) {
        console.warn("❌ Error fetching offer for:", fav.productId);
      }
    }

    if (updated) await user.save();

    res.status(200).json(user.favorites);
  } catch (error) {
    console.error("❌ Error fetching favorites:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put("/profile/:userId/cart/update-quantity", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, selectedColor, selectedSize, quantity } = req.body;

    if (!productId || !selectedColor || !selectedSize || !quantity) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const item = user.cart.find(
      (item) =>
        item.productId === productId &&
        item.selectedColor === selectedColor &&
        item.selectedSize === selectedSize
    );

    if (!item) return res.status(404).json({ message: "Cart item not found" });

    item.quantity = quantity;
    await user.save();

    res.status(200).json({ message: "Quantity updated", cart: user.cart });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/products/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
const axios = require("axios");

// Get personalized products for user
app.get("/personalized-products/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const favorites = await axios.get(
      `http://172.20.10.4:5001/user/${userId}/favorites`
    );
    const cart = await axios.get(`http://172.20.10.4:5001/user/${userId}/cart`);

    const favoriteProductIds = favorites.data.map((item) => item.productId);
    const cartProductIds = cart.data.map((item) => item.productId);

    const allInterestedProductIds = [
      ...new Set([...favoriteProductIds, ...cartProductIds]),
    ];

    const gender = await AsyncStorage.getItem("interest_gender");

    const allProducts = await User.aggregate([
      { $unwind: "$categories" },
      { $unwind: "$categories.products" },
      {
        $match: {
          $or: [
            {
              "categories.products._id": {
                $in: allInterestedProductIds.map((id) =>
                  mongoose.Types.ObjectId(id)
                ),
              },
            },
            gender ? { "categories.products.genderTarget": gender } : {},
          ],
        },
      },
      {
        $project: {
          _id: "$categories.products._id",
          title: "$categories.products.title",
          price: "$categories.products.price",
          MainImage: "$categories.products.MainImage",
          shopId: "$_id",
        },
      },
      { $sample: { size: 10 } },
    ]);

    res.json(allProducts);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Server error fetching personalized products" });
  }
});
app.post("/user/:userId/viewed", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId } = req.body;

    const user = await User.findById(userId); // أو حسب اسم موديل المستخدم عندك
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🔥 قبل الإضافة تأكدي ما يكرر نفس المنتج عدة مرات
    const alreadyViewed = user.viewedProducts.find(
      (item) => item.productId.toString() === productId
    );

    if (!alreadyViewed) {
      user.viewedProducts.push({ productId });
      await user.save();
    }

    res.status(200).json({ message: "View registered successfully" });
  } catch (err) {
    console.error("❌ Error registering view:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/user/:userId/personalized-products", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const favoriteCategories = user.favorites
      .map((fav) => fav.categoryName)
      .filter(Boolean);
    const cartCategories = user.cart
      .map((item) => item.categoryName)
      .filter(Boolean);

    const viewedIds = user.viewedProducts.map(
      (item) => new mongoose.Types.ObjectId(item.productId)
    );

    const allCategories = [
      ...new Set([...favoriteCategories, ...cartCategories]),
    ]; // بدون تكرار

    const productMatchConditions = [];

    if (viewedIds.length > 0) {
      productMatchConditions.push({ _id: { $in: viewedIds } });
    }

    if (allCategories.length > 0) {
      productMatchConditions.push({ categoryName: { $in: allCategories } });
    }

    let matchStage = {};
    if (productMatchConditions.length > 0) {
      matchStage = { $or: productMatchConditions };
    }

    const products = await Product.aggregate([
      ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
      {
        $project: {
          _id: 1,
          title: 1,
          price: 1,
          MainImage: 1,
          shopId: 1,
          categoryName: 1,
        },
      },
      { $sample: { size: 20 } }, // اختيار عشوائي لو أردت
    ]);

    res.json(products);
  } catch (err) {
    console.error("❌ Error fetching personalized products:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/orders/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { location, shippingCost } = req.body;

    const user = await User.findById(userId).populate("cart.shopId");
    if (!user || !user.cart || user.cart.length === 0) {
      return res
        .status(400)
        .json({ message: "Cart is empty or user not found." });
    }

    const failedItems = [];

    for (let item of user.cart) {
      const productRes = await axios.get(
        `http://172.20.10.4:5000/public/shop/${item.shopId._id}/product/${item.productId}`
      );

      const product = productRes.data.product;
      const color = product.colors.find((c) => c.name === item.selectedColor);
      const size = color?.sizes.find((s) => s.size === item.selectedSize);

      if (!size || size.stock < item.quantity) {
        failedItems.push({
          title: item.title,
          color: item.selectedColor,
          size: item.selectedSize,
          requested: item.quantity,
          available: size ? size.stock : 0,
        });
      }
    }

    if (failedItems.length > 0) {
      return res.status(409).json({
        message: "Some items in the cart are no longer available.",
        failedItems,
      });
    }

    const orderId = uuidv4();

    const newOrder = new Order({
  orderId,
  shopId: null,
  userId,
  userName: user.fullName,
  userPhone: user.PhoneNumber,
  userLocation: location,
  totalPrice: 0,
  products: user.cart
    .filter((item) => item.shopId)
    .map((item) => ({
      shopId:
        typeof item.shopId === "object" && item.shopId !== null
          ? item.shopId._id?.toString?.() || item.shopId.toString?.()
          : item.shopId?.toString?.(),
      productId: item.productId,
      title: item.title,
      image: item.image,
      price: item.price,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      quantity: item.quantity,
      categoryName: item.categoryName,
      offer: item.offer,
    })),
  status: "Pending",
  createdAt: new Date(),
});

    let total = 0;

    for (let item of user.cart) {
      const shop = await Shop.findById(item.shopId._id);

      const product = shop.categories
        ?.flatMap((cat) => cat.products)
        ?.find((prod) => prod._id.toString() === item.productId);

      if (!product) {
        console.warn(
          `❌ Product not found in shop ${shop._id} for productId ${item.productId}`
        );
        continue;
      }

      const color = product.colors.find((c) => c.name === item.selectedColor);
      const size = color?.sizes.find((s) => s.size === item.selectedSize);

      if (size && size.stock >= item.quantity) {
        size.stock -= item.quantity;
        total += item.quantity * item.price;
        await shop.save();
      }
    }

    newOrder.totalPrice = total + shippingCost;
    await newOrder.save();

    user.cart = [];
    await user.save();

    res.status(200).json({ message: "Order placed successfully", orderId });

    // ✅ بعد إرسال الرد، نرسل إشعارات للبائع إذا منتج أصبح سولد آوت
    try {
      for (const item of newOrder.products) {
        let shopId;

        if (item.shopId && typeof item.shopId === "object" && item.shopId._id) {
          shopId = item.shopId._id.toString();
        } else if (
          typeof item.shopId === "string" ||
          typeof item.shopId === "number"
        ) {
          shopId = item.shopId.toString();
        } else {
          console.warn("❌ Invalid shopId structure in item:", item);
          continue;
        }

        const shop = await Shop.findById(shopId);
        if (!shop) {
          console.warn("❌ Shop not found:", shopId);
          continue;
        }

        let foundProduct = null;

        // البحث داخل جميع الفئات
        for (let category of shop.categories) {
          for (let product of category.products) {
            // ✅ تأكد من مقارنة الأنواع بشكل صحيح
            if (
              product._id.toString() === item.productId.toString() &&
              product.colors?.some((c) => c.name === item.selectedColor)
            ) {
              foundProduct = product;
              break;
            }
          }
          if (foundProduct) break;
        }

        if (!foundProduct) {
          console.warn(
            "❌ Product not found for notification:",
            item.productId
          );
          continue;
        }

        const color = foundProduct.colors.find(
          (c) => c.name === item.selectedColor
        );
        if (!color) {
          console.warn("❌ Color not found:", item.selectedColor);
          continue;
        }

        const size = color.sizes.find((s) => s.size === item.selectedSize);
        if (!size) {
          console.warn("❌ Size not found:", item.selectedSize);
          continue;
        }

        // ✅ إذا المخزون صفر، أرسل إشعار
        if (size.stock === 0) {
          console.log("🟥 Sending notification for sold out:", {
            shopId,
            productId: foundProduct._id.toString(), // تأكد من إرساله كـ String
            color: item.selectedColor,
            size: item.selectedSize,
          });

          await axios.post("http://172.20.10.4:5000/notify-soldout", {
            shopId: shopId.toString(),
            productId: foundProduct._id.toString(),
            color: item.selectedColor,
            size: item.selectedSize,
          });
        }
      }
    } catch (notifyErr) {
      console.warn(
        "⚠️ Failed to send sold-out notifications:",
        notifyErr.message
      );
    }
  } catch (error) {
    console.error("❌ Order processing error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

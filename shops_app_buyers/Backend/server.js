require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const Order = require("../modals/Order");
const { v4: uuidv4 } = require("uuid");
const app = express();
const { NGROK_URL } = require("./ngrok-url");
const SELLER_API_BASE_URL = `${NGROK_URL}/shops_app_sellers`;
const API_BASE_URL = `${NGROK_URL}/shops_app_buyers`;
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const saltRounds = 10;
// Middleware
app.use(express.json());
app.use(cors());

// Serve the uploads folder (for images)
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
  status: {
    type: String,
    enum: ["approved", "pending"],
    default: "pending",
  },
});

// Models
const User = mongoose.model("Client", UserSchema);
const Shop = mongoose.model("Shops", ShopSchema);

// Login Route
app.post("/login", async (req, res) => {
  try {
    // Extract email and password from the request body
    const { email, password } = req.body;

    // Try to find the user in the database by email
    const user = await User.findOne({ email });

    // If no user is found, respond with 404 (Not Found)
    if (!user) return res.status(404).json({ message: "Email not found." });

    // Compare the entered password with the hashed password stored in the DB
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    // If passwords don’t match, return a 400 (Bad Request) error
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // If everything is correct, return a success response with user info
    res.status(200).json({
      message: "Login successful!",
      user: {
        _id: user._id,          // User ID
        fullName: user.fullName, // User's full name
        email: user.email,      // User's email
      },
    });

  } catch (error) {
    // If something goes wrong (e.g. DB down), log the error and return 500
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Reset Password
app.post("/reset-password", async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email does not exist" });

    //Compare new password with old hashed password
    const isSame = await bcrypt.compare(password, user.password);
    if (isSame)
      return res.status(400).json({
        message: "New password must be different from the old password.",
      });

    //Check if passwords match
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    //Hash new password and save
    user.password = await bcrypt.hash(password, saltRounds);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Register User
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
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
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
    const user = await User.findById(req.params.userId).populate("cart.shopId");

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.cart || !Array.isArray(user.cart)) user.cart = [];

    const updatedCart = [];

    for (const item of user.cart) {
      const { shopId, productId } = item;

      try {
        const resProduct = await axios.get(
          `${SELLER_API_BASE_URL}/public/shop/${shopId._id}/product/${productId}`
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
        `${SELLER_API_BASE_URL}/public/shop/${shopId}/product/${productId}`
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
          `${SELLER_API_BASE_URL}/public/shop/${fav.shopId}/product/${fav.productId}`
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
      `${API_BASE_URL}/user/${userId}/favorites`
    );
    const cart = await axios.get(`${API_BASE_URL}/user/${userId}/cart`);

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
    const { location, shippingCost = 0 } = req.body;

    const user = await User.findById(userId).populate("cart.shopId");
    if (!user || !user.cart.length) {
      return res
        .status(400)
        .json({ message: "User not found or cart is empty." });
    }

    const groupedByShop = {};
    for (let item of user.cart) {
      const shopKey =
        item.shopId._id?.toString?.() || item.shopId?.toString?.();
      if (!groupedByShop[shopKey]) groupedByShop[shopKey] = [];
      groupedByShop[shopKey].push(item);
    }

    const createdOrders = [];
    const failedItems = [];
    let globalOrderIndex = 0;

    for (const [shopId, items] of Object.entries(groupedByShop)) {
      let total = 0;
      const shop = await Shop.findById(shopId);
      if (!shop) continue;

      for (let item of items) {
        const product = shop.categories
          ?.flatMap((cat) => cat.products)
          ?.find((prod) => prod._id.toString() === item.productId);

        const color = product?.colors.find(
          (c) => c.name === item.selectedColor
        );
        const size = color?.sizes.find((s) => s.size === item.selectedSize);

        if (!size || size.stock < item.quantity) {
          failedItems.push({
            shopId,
            title: item.title,
            color: item.selectedColor,
            size: item.selectedSize,
            requested: item.quantity,
            
            available: size ? size.stock : 0,
          });
          continue;
        }

        size.stock -= item.quantity;
        total += item.price * item.quantity;
      }

      await shop.save();

      const includeShipping = globalOrderIndex === 0;
      const totalPrice = total;

      const order = new Order({
  orderId: uuidv4(),
  shopId,
  userId,
  userName: user.fullName,
  userPhone: user.PhoneNumber,
  userLocation: location,
  totalPrice,
  products: items.map(item => {
  let finalPrice = item.price;

  if (
    item.offer &&
    item.offer.discountPercentage &&
    new Date(item.offer.expiresAt) > new Date()
  ) {
    finalPrice = +(item.price * (1 - item.offer.discountPercentage / 100)).toFixed(2);
  }

  // ✅ نحصل على المنتج الحقيقي من shop
  const product = shop.categories
    ?.flatMap(cat => cat.products)
    ?.find(prod => prod._id.toString() === item.productId);

  return {
    shopId,
    productId: item.productId,
    title: item.title,
    image: product?.MainImage, 
    price: finalPrice,
    quantity: item.quantity,
    selectedColor: item.selectedColor,
    selectedSize: item.selectedSize,
  };
}),

  status: "New",
  createdAt: new Date(),
});

      await order.save();
      createdOrders.push(order);
      globalOrderIndex++;

      for (let item of items) {
        const product = shop.categories
          ?.flatMap((cat) => cat.products)
          ?.find((prod) => prod._id.toString() === item.productId);

        const color = product?.colors.find(
          (c) => c.name === item.selectedColor
        );
        const size = color?.sizes.find((s) => s.size === item.selectedSize);

        if (size?.stock === 0) {
          await axios.post(`${SELLER_API_BASE_URL}/notify-soldout`, {
            shopId,
            productId: product._id.toString(),
            color: item.selectedColor,
            size: item.selectedSize,
          });
        }
      }
    }

    user.cart = [];
    await user.save();

    if (failedItems.length > 0) {
      return res.status(409).json({
        message: "Some items couldn't be ordered due to stock limits.",
        failedItems,
        createdOrders,
      });
    }
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "cartchic14@gmail.com",
        pass: "yyjl iafr ontm nfck", // App Password
      },
    });

    const totalProductPrice = createdOrders.reduce((sum, order) => {
      return (
        sum +
        order.products.reduce((s, item) => s + item.price * item.quantity, 0)
      );
    }, 0);

    const totalPriceWithShipping = totalProductPrice + shippingCost;

    const allItems = createdOrders.flatMap((order) => order.products);
function getFullImageUrl(imagePath) {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  if (!imagePath.startsWith("/")) imagePath = "/" + imagePath;
  return `${NGROK_URL}${imagePath}`;
}
console.log("🧾 allItems images:", allItems.map(p => p.image));
console.log("🔗 NGROK_URL used in email:", NGROK_URL);

    const orderHtml = `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; color: #333;">
    <h2 style="color: #4CAF50;">Thank you for your order | ChicCart</h2>
    <p>Hello <strong>${user.fullName}</strong>,</p>
    <p>Your order has been successfully placed.</p>

    <hr style="margin: 20px 0;" />
    <p><strong>Shipping Address:</strong><br>${user.location}</p>
    <p><strong>Phone:</strong> 0${user.PhoneNumber}</p>

    <h3>Order Summary</h3>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="border-bottom:1px solid #ccc;text-align:left;">Image</th>
          <th style="border-bottom:1px solid #ccc;text-align:left;">Product</th>
          <th style="border-bottom:1px solid #ccc;text-align:left;">Qty</th>
          <th style="border-bottom:1px solid #ccc;text-align:left;">Color</th>
          <th style="border-bottom:1px solid #ccc;text-align:left;">Size</th>
          <th style="border-bottom:1px solid #ccc;text-align:left;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${allItems
          .map(
            (item) => `
          <tr>
            <td><img src="${SELLER_API_BASE_URL}${item.image}" alt="${
              item.title
            }" width="60" style="border-radius:4px;" /></td>
            <td>${item.title}</td>
            <td>${item.quantity}</td>
            <td>${item.selectedColor}</td>
            <td>${item.selectedSize}</td>
            <td>₪${item.price}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <p style="margin-top: 20px;"><strong>Shipping:</strong> ₪${shippingCost}</p>
    <p><strong>Total:</strong> ₪${totalPriceWithShipping}</p>

    <hr style="margin: 20px 0;" />
    <p style="margin-top: 10px;">Thanks for shopping with us!<br><strong>ChicCart Team</strong></p>
  </div>
`;

    const mailOptions = {
      from: "cartchic14@gmail.com",
      to: user.email,
      subject: "Your ChicCart Order Confirmation",
      html: orderHtml,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("📧 Email sent to:", user.email);
    } catch (emailErr) {
      console.error("❌ Failed to send email:", emailErr);
    }

    res
      .status(200)
      .json({ message: "Thanks for your order! Please prepare the payment. You’ll pay when the order arrives.", createdOrders });
  } catch (error) {
    console.error("❌ Order creation error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.delete("/admin/delete-shop-data/:shopId", async (req, res) => {
  const { shopId } = req.params;

  try {
    const users = await User.find({
      $or: [
        { "cart.shopId": shopId },
        { "favorites.shopId": shopId },
      ],
    });

    for (let user of users) {
      // حذف من السلة
      user.cart = user.cart.filter((item) => item.shopId.toString() !== shopId);

      // حذف من المفضلات
      user.favorites = user.favorites.filter((item) => item.shopId.toString() !== shopId);

      await user.save();
    }

    res.status(200).json({ message: "Client data related to shop deleted" });
  } catch (error) {
    console.error("❌ Error deleting client-side shop data:", error);
    res.status(500).json({ error: "Failed to clean client data" });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

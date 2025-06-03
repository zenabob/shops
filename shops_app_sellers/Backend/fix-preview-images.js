const mongoose = require("mongoose");
require("dotenv").config();

const path = require("path");

const Shop = mongoose.model(
  "Shops",
  new mongoose.Schema({
    shopName: String,
    fullName: String,
    email: String,
    password: String,
    logo: String,
    cover: String,
    location: String,
    phoneNumber: String,
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
  })
);

// ✅ Remove domain and keep only /uploads/filename.jpg
function extractRelativePath(url) {
  if (!url || typeof url !== "string") return url; // ✅ تفادي null أو undefined أو أي قيمة غير نصية
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch (e) {
    return url.startsWith("/uploads/") ? url : url;
  }
}


mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    const shops = await Shop.find();

    for (const shop of shops) {
      let updated = false;

      // ✅ Fix logo & cover
      if (shop.logo && !shop.logo.startsWith("/uploads/")) {
        shop.logo = extractRelativePath(shop.logo);
        updated = true;
      }

      if (shop.cover && !shop.cover.startsWith("/uploads/")) {
        shop.cover = extractRelativePath(shop.cover);
        updated = true;
      }

      for (const category of shop.categories) {
        for (const product of category.products) {
          // Main image
          if (product.MainImage && !product.MainImage.startsWith("/uploads/")) {
            product.MainImage = extractRelativePath(product.MainImage);
            updated = true;
          }

          // Images array
          if (Array.isArray(product.images)) {
            const fixed = (product.images || []).map(extractRelativePath);
            if (JSON.stringify(product.images) !== JSON.stringify(fixed)) {
              product.images = fixed;
              updated = true;
            }
          }

          // Colors
          for (const color of product.colors) {
            if (color.previewImage && !color.previewImage.startsWith("/uploads/")) {
              color.previewImage = extractRelativePath(color.previewImage);
              updated = true;
            }

            if (Array.isArray(color.images)) {
              const fixed = color.images.map(extractRelativePath);
              if (JSON.stringify(color.images) !== JSON.stringify(fixed)) {
                color.images = fixed;
                updated = true;
              }
            }
          }
        }
      }

      if (updated) {
        await shop.save();
        console.log(`✅ Cleaned URLs for: ${shop.shopName}`);
      }
    }

    console.log("🎉 All image links cleaned to relative paths");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

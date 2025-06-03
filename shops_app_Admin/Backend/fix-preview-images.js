// fix-preview-images.js
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const ngrokUrl = require("../ngrok-url").url;

// تعديل الرابط المحلي برابط ngrok
const LOCAL_URL = "http://172.20.10.4:5000";
const NEW_URL = ngrokUrl;

const Shop = require("../models/Shop"); // ✅ عدّل المسار حسب مكان المودل عندك

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ShopsDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    const shops = await Shop.find();

    for (const shop of shops) {
      let updated = false;

      if (shop.logo?.includes(LOCAL_URL)) {
        shop.logo = shop.logo.replace(LOCAL_URL, NEW_URL);
        updated = true;
      }

      if (shop.cover?.includes(LOCAL_URL)) {
        shop.cover = shop.cover.replace(LOCAL_URL, NEW_URL);
        updated = true;
      }

      for (const category of shop.categories) {
        for (const product of category.products) {
          if (product.MainImage?.includes(LOCAL_URL)) {
            product.MainImage = product.MainImage.replace(LOCAL_URL, NEW_URL);
            updated = true;
          }

          for (const color of product.colors) {
            if (color.previewImage?.includes(LOCAL_URL)) {
              color.previewImage = color.previewImage.replace(LOCAL_URL, NEW_URL);
              updated = true;
            }

            color.images = color.images.map(img => {
              if (img.includes(LOCAL_URL)) {
                updated = true;
                return img.replace(LOCAL_URL, NEW_URL);
              }
              return img;
            });
          }
        }
      }

      if (updated) {
        await shop.save();
        console.log(`✅ Updated: ${shop.shopName}`);
      }
    }

    console.log("🎉 All done!");
    process.exit();
  })
  .catch(err => {
    console.error("❌ Error updating shops:", err);
    process.exit(1);
  });

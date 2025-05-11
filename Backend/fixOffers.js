const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  shopName: String,
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
});

const User = mongoose.model("Shops", UserSchema);

mongoose
  .connect("mongodb://127.0.0.1:27017/shopsDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ Connected to DB");

    const shops = await User.find();

    for (const shop of shops) {
      let modified = false;

      for (const category of shop.categories) {
        for (const product of category.products) {
          if (
            !product.offer ||
            typeof product.offer.discountPercentage !== "number" ||
            !product.offer.expiresAt
          ) {
            product.offer = {
              discountPercentage: 0,
              expiresAt: new Date(0),
            };
            modified = true;
          }
        }
      }

      if (modified) {
        await shop.save();
        console.log(`✅ Updated shop: ${shop.shopName}`);
      }
    }

    console.log("🎉 All done");
    mongoose.disconnect();
  })
  .catch((err) => console.error("❌ DB Error:", err));

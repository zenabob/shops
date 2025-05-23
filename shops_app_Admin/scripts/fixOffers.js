const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const UserSchema = new mongoose.Schema({
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
});

const User = mongoose.model("Shops", UserSchema);

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("✅ Connected to DB");

    const shops = await User.find();

    for (const shop of shops) {
      let modified = false;

      for (const category of shop.categories) {
        for (const product of category.products) {
          if (!product.offer) {
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

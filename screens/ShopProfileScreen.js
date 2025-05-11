import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import axios from "axios";
import { ImageBackground } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ProductDetails from "../modals/ProductDetails";
import AsyncStorage from "@react-native-async-storage/async-storage";

const screenWidth = Dimensions.get("window").width;

const CustomerShopProfileScreen = ({ route }) => {
  const [shopData, setShopData] = useState({
    name: "",
    location: "",
    logo: null,
    cover: null,
  });
  const [categories, setCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const { shopId, userId } = route.params;
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [selectedColorName, setSelectedColorName] = useState(null);
  const [selectedMainImage, setSelectedMainImage] = useState(null);
  const [selectedColorImages, setSelectedColorImages] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null); // ✅ أضف هذا

  const navigation = useNavigation();
useEffect(() => {
  fetchShopData();
  fetchCategories();
  fetchCategoriesWithProducts();
  
  const intervalId = setInterval(() => {
    fetchCategoriesWithProducts(); // ✅ استخدم دالة موجودة فعلاً لتحديث المنتجات
  }, 10000);

  return () => clearInterval(intervalId);
}, [shopId]);

  const handleAddToCart = async (cartItem) => {
    try {
      if (!userId) {
        alert("User not logged in");
        return;
      }

      const response = await fetch(
        `http://172.20.10.4:5001/profile/${userId}/cart`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId: cartItem.shopId,
            shopName: cartItem.shopName,
            productId: cartItem.productId,
            title: cartItem.title,
            image: cartItem.image,
            price: cartItem.price,
            selectedColor: cartItem.selectedColor,
            selectedSize: cartItem.selectedSize,
          }),
        }
      );
      const text = await response.text();
      console.log("🔍 Raw response:", text);

      if (response.ok) {
        alert("Product added to cart!");
      } else {
        alert("Error: " + text);
      }
    } catch (err) {
      console.error("❌ Error adding to cart:", err);
      alert("Something went wrong");
    }
  };

  const fetchShopData = async () => {
    try {
      const res = await axios.get(`http://172.20.10.4:5000/profile/${shopId}`);
      setShopData(res.data);
    } catch (err) {
      console.error("Error fetching shop data:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        `http://172.20.10.4:5000/profile/${shopId}/category`
      );
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchCategoriesWithProducts = async () => {
    try {
      const res = await axios.get(
        `http://172.20.10.4:5000/profile/${shopId}/categories-with-products`
      );
      const result = {};
      res.data.forEach((category) => {
        result[category.name] = category.products;
      });
      setProductsByCategory(result);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  return (
    <View style={styles.background}>
      <TouchableOpacity
        onPress={() => navigation.navigate("Main")}
        style={styles.backButton}
      >
        <Image
          source={require("../assets/img/BlackArrow.png")}
          style={styles.backIcon}
        />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: shopData.cover }} style={styles.cover} />

        <View style={styles.logoContainer}>
          <Image source={{ uri: shopData.logo }} style={styles.logo} />
        </View>

        <Text style={styles.shopName}>{shopData.name}</Text>

        {categories.map((category) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {categories.length === 1 ? (
              // 🟢 Grid with 2 columns
              <View style={styles.gridWrapper}>
                {(productsByCategory[category] || []).map((product, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.productCardGrid}
                    onPress={() => {
                      setSelectedProduct(product);
                      setSelectedProductDetails(product);
                      const firstColor = product.colors?.[0];
                      setSelectedColorName(firstColor?.name || "");
                      setSelectedMainImage(
                        firstColor?.previewImage || product.MainImage
                      );
                      setSelectedColorImages(firstColor?.images || []);
                      setSelectedSize(null);
                      setShowDetailModal(true);
                    }}
                  >
                    <Image
                      source={{ uri: product.MainImage }}
                      style={styles.productImage}
                    />
                    <Text style={styles.productTitle} numberOfLines={1}>
                      {product.title}
                    </Text>
                    {product?.offer &&
                    new Date(product.offer.expiresAt) > new Date() ? (
                      <>
                        <Text style={styles.strikePrice}>
                          {product?.price} ILS
                        </Text>
                        <Text style={styles.discountPrice}>
                          {(
                            product.price *
                            (1 - product.offer.discountPercentage / 100)
                          ).toFixed(2)}{" "}
                          ILS
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.price}>{product?.price} ILS</Text>
                    )}
                    <TouchableOpacity style={styles.cartIconWrapper}>
                      <Image
                        source={require("../assets/img/cart_plus.png")}
                        style={styles.cartIcon}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              // 🟡 Horizontal scroll
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(productsByCategory[category] || []).map((product, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.productCard}
                    onPress={() => {
                      setSelectedProduct(product);
                      setSelectedProductDetails(product);

                      const firstColor = product.colors?.[0];
                      setSelectedColorName(firstColor?.name || "");
                      setSelectedMainImage(
                        firstColor?.previewImage || product.MainImage
                      );
                      setSelectedColorImages(firstColor?.images || []);
                      setSelectedSize(null);
                      setShowDetailModal(true);
                    }}
                  >
                    <Image
                      source={{ uri: product.MainImage }}
                      style={styles.productImage}
                    />
                    <Text style={styles.productTitle} numberOfLines={1}>
                      {product.title}
                    </Text>
                    {product?.offer &&
                    new Date(product.offer.expiresAt) > new Date() ? (
                      <>
                        <Text style={styles.strikePrice}>
                          {product?.price} ILS
                        </Text>
                        <Text style={styles.discountPrice}>
                          {(
                            product.price *
                            (1 - product.offer.discountPercentage / 100)
                          ).toFixed(2)}{" "}
                          ILS
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.price}>{product?.price} ILS</Text>
                    )}

                    <TouchableOpacity
                      style={styles.cartIconWrapper}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
                        setSelectedProductDetails(product);

                        const firstColor = product.colors?.[0];
                        setSelectedColorName(firstColor?.name || "");
                        setSelectedMainImage(
                          firstColor?.previewImage || product.MainImage
                        );
                        setSelectedColorImages(firstColor?.images || []);
                        setSelectedSize(null);
                        setShowDetailModal(true);
                      }}
                    >
                      <Image
                        source={require("../assets/img/cart_plus.png")}
                        style={styles.cartIcon}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        ))}
      </ScrollView>
      {selectedProductDetails && (
        <ProductDetails
          visible={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          selectedProductDetails={selectedProductDetails}
          selectedMainImage={selectedMainImage}
          selectedColorName={selectedColorName}
          selectedColorImages={selectedColorImages}
          setSelectedColorName={setSelectedColorName}
          setSelectedMainImage={setSelectedMainImage}
          setSelectedColorImages={setSelectedColorImages}
          onAddToCart={handleAddToCart}
          shopId={shopId}
          userId={userId}
          selectedSize={selectedSize} // ✅
          setSelectedSize={setSelectedSize} // ✅
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#E5E4E2",
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 10,
    paddingBottom: 30,
  },

  cover: {
    width: screenWidth,
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
    right: 10,
    borderColor: "#000",
    borderWidth: 4,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 2,
  },
  logo: {
    width: 130,
    height: 130,
    marginTop: -70,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: "#000",
  },
  shopName: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    color: "#333",
    marginBottom: 40,
  },

  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 10,
    marginLeft: 5,
  },
  productsRow: {
    paddingLeft: 5,
  },
  productCard: {
    width: 140,
    height: 220,
    marginRight: 10,
    backgroundColor: "#f8f8f8",
    // padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  productImage: {
    width: 140,
    height: 150,
    marginBottom: 5,
    resizeMode: "cover",
  },
  productTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  strikePrice: {
    textDecorationLine: "line-through",
    color: "gray",
    fontSize: 13,
  },
  discountPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e53935",
  },
  gridWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },

  productCardGrid: {
    width: "48%",
    height: 220,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
    position: "relative",
  },

  cartIconWrapper: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 20,
    padding: 6,
    elevation: 2,
  },

  cartIcon: {
    width: 20,
    height: 20,
    tintColor: "#000",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 1000,
  },
});

export default CustomerShopProfileScreen;

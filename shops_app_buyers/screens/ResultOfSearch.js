import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import ProductDetails from "../modals/ProductDetails";
import {API_BASE_URL} from "../config";
import { SELLER_API_BASE_URL } from "../seller-api";

const ResultOfSearch = ({ route, navigation }) => {
  const { shopId, categoryName, userId, results } = route.params;
  const [products, setProducts] = useState(results || []);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [selectedMainImage, setSelectedMainImage] = useState("");
  const [selectedColorName, setSelectedColorName] = useState("");
  const [selectedColorImages, setSelectedColorImages] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
  if (!results) fetchProducts();

  const intervalId = setInterval(() => {
    fetchProducts(); // refresh products every 10 seconds
  }, 10000);

  return () => clearInterval(intervalId);
}, []);


  const fetchProducts = async () => {
    try {
      let url = "";

      if (shopId) {
        url = `${SELLER_API_BASE_URL}/public/search-category-products?q=${categoryName}`;
      } else {
        url = `${SELLER_API_BASE_URL}/public/all-products`;
      }

      const res = await fetch(url);
      const data = await res.json();

      let filtered = [];

      const searchWords = categoryName.toLowerCase().split(" ");
      const isDoubleWord = searchWords.length === 2;
      const [firstWord, secondWord] = searchWords;

      const genderWords = [
        "woman",
        "women",
        "man",
        "men",
        "kid",
        "kids",
        "child",
        "children",
      ];
      const feminineCategories = ["dress", "dresses", "skirt", "skirts"];
      const categoryNameLower = categoryName.toLowerCase();

      const isExactCategoryMatch = data.some(
        (p) => p.categoryName?.toLowerCase() === categoryNameLower
      );
      if (isExactCategoryMatch) {
        const exactCategoryProducts = data.filter(
          (p) => p.categoryName?.toLowerCase() === categoryNameLower
        );
        setProducts(exactCategoryProducts);
        return;
      }

      const normalizeGender = (word) => {
        if (word === "woman") return "women";
        if (word === "man") return "men";
        if (word === "kids") return "kid";
        return word;
      };
      const normalizedWord = normalizeGender(categoryNameLower);
      const regex = new RegExp(`\\b${normalizedWord}\\b`);

      if (!shopId && !isDoubleWord && genderWords.includes(categoryNameLower)) {
        const partialCategoryProducts = data.filter((product) => {
          const cat = product.categoryName?.toLowerCase() || "";

          const matchNormalizedGender = regex.test(cat);
          const matchFeminine =
            normalizedWord === "women" && feminineCategories.includes(cat);

          return matchNormalizedGender || matchFeminine;
        });

        if (partialCategoryProducts.length > 0) {
          setProducts(partialCategoryProducts);
          return;
        }
      }

      if (!shopId && isDoubleWord && genderWords.includes(firstWord)) {
        const secondWordNormalized = normalizeGender(secondWord);
        const isExactCategory = data.some(
          (p) => p.categoryName?.toLowerCase() === secondWordNormalized
        );

        if (isExactCategory) {
          const filteredByColorAndCategory = data.filter((product) => {
            const cat = product.categoryName?.toLowerCase() || "";
            const colors =
              product.colors?.map((c) => c.name.toLowerCase()) || [];

            const colorMatch = colors.includes(firstWord);
            const categoryMatch = cat === secondWordNormalized;

            return colorMatch && categoryMatch;
          });

          setProducts(filteredByColorAndCategory);
          return;
        }
      }

      if (shopId) {
        filtered = data;
      } else {
        filtered = data.filter((product) => {
          const cat = product.categoryName?.toLowerCase() || "";
          const title = product.title?.toLowerCase() || "";
          const colors = product.colors?.map((c) => c.name.toLowerCase()) || [];

          if (isDoubleWord) {
            const colorMatch = colors.includes(firstWord);
            const categoryMatch = cat.includes(secondWord);
            if (colorMatch && categoryMatch) return true;
          }

          return title.includes(categoryNameLower);
        });
      }

      setProducts(filtered);
    } catch (err) {
      console.error("❌ Error fetching search result products", err);
    }
  };

  const handleAddToCart = async (cartItem) => {
    try {
      if (!userId) {
        Alert.alert("User not logged in");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/profile/${userId}/cart`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cartItem),
        }
      );

      const text = await response.text();
      if (response.ok) {
        Alert.alert("Product added to cart!");
      } else {
        Alert.alert("Error: " + text);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      Alert.alert("Something went wrong");
    }
  };

  const handleProductPress = async (item) => {
    try {
      const res = await fetch(
        `${SELLER_API_BASE_URL}/public/shop/${item.shopId}/product/${item._id}`
      );
      const data = await res.json();
      const product = data.product;

      if (product.colors && product.colors.length > 0) {
        const firstColor = product.colors[0];
        setSelectedColorName(firstColor.name);
        setSelectedMainImage(
          firstColor.previewImage || firstColor.images?.[0] || product.MainImage
        );
        setSelectedColorImages(firstColor.images || []);
      } else {
        setSelectedColorName("");
        setSelectedMainImage(product.MainImage);
        setSelectedColorImages([]);
      }

      setSelectedProductDetails({ ...product, shopId: item.shopId });
      setSelectedSize(null);
      setShowDetailModal(true);
    } catch (error) {
      console.error("❌ Error fetching full product details:", error);
      Alert.alert("Failed to load product details.");
    }
  };
  const renderItem = ({ item }) => {
  const hasValidOffer =
    item.offer && new Date(item.offer.expiresAt) > new Date();

  const discountedPrice = hasValidOffer
    ? (item.price * (1 - item.offer.discountPercentage / 100)).toFixed(2)
    : null;

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
    >
      <Image
  source={{
    uri: item.MainImage?.startsWith("http")
      ? item.MainImage
      : `${SELLER_API_BASE_URL}${item.MainImage}`,
  }}
  style={styles.productImage}
/>

      <Text style={styles.productTitle}>{item.title}</Text>
      {hasValidOffer ? (
        <View style={{ alignItems: "center" }}>
          <Text style={styles.originalPrice}>ILS {item.price}</Text>
          <Text style={styles.discountedPrice}>ILS {discountedPrice}</Text>
        </View>
      ) : (
        <Text style={styles.productPrice}>ILS {item.price}</Text>
      )}
    </TouchableOpacity>
  );
};

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.navigate("Main")}
        style={styles.backButton}
      >
        <Image
          source={require("../assets/img/BlackArrow.png")}
          style={styles.backIcon}
        />
      </TouchableOpacity>
      <Text style={styles.heading}>Results for "{categoryName}"</Text>

{products.length === 0 ? (
  <View style={styles.emptyContainer}>
    <Image
      source={require("../assets/img/no-results.png")} 
      style={styles.emptyImage}
    />
    <Text style={styles.emptyText}>No results found...</Text>
  </View>
) : (
  <FlatList
    data={products}
    keyExtractor={(item) => item._id}
    renderItem={renderItem}
    numColumns={2}
    contentContainerStyle={{ paddingBottom: 100 }}
  />
)}

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
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          onAddToCart={handleAddToCart}
          shopId={selectedProductDetails?.shopId}
          userId={userId}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: "#f7f7f7",
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 15,
    marginBottom: 15,
    marginTop: 20,
  },
  productCard: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  productImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  productTitle: {
    fontWeight: "bold",
    marginTop: 10,
  },
  productPrice: {
    color: "#e53935",
    fontWeight: "bold",
    marginBottom: 10,
  },
  backIcon: {
    left: 10,
  },
  originalPrice: {
  textDecorationLine: "line-through",
  color: "#888",
  fontSize: 14,
  fontWeight: "500",
},
discountedPrice: {
  color: "#e53935",
  fontSize: 16,
  fontWeight: "bold",
  marginTop: 2,
},
emptyContainer: {
  alignItems: "center",
  justifyContent: "center",
  marginTop: 50,
},

emptyImage: {
  width: 200,
  height: 200,
  marginBottom: 50,
  resizeMode: "contain",
  marginTop: 100,
},

emptyText: {
  fontSize: 30,
  color: "#000",
  fontWeight: "bold",
},

});

export default ResultOfSearch;

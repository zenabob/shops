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
import { API_BASE_URL } from "../config";
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

  useEffect(() => {
    if (!results) fetchProducts();
    const intervalId = setInterval(() => fetchProducts(), 10000);
    return () => clearInterval(intervalId);
  }, []);

  const phraseSynonyms = {
    "women pants": "women’s bottom",
    "women trousers": "women’s bottom",
    "ladies pants": "women’s bottom",
    "men pants": "men’s bottom",
    "kids pants": "kid's clothes",
    "girls dress": "dress",
    "women top": "women’s blouse",
    "women blouse": "women’s blouse",
    "women skirt": "skirt",
    "pants":"women’s bottom",
    "bottoms":"women’s bottom",
    "bottom":"women’s bottom",
    "tops": "women’s blouse",
    "top": "women’s blouse",
    "women dress": "dress",
  };

  const normalizePhrase = (input) => {
    const trimmed = input.toLowerCase().trim().replace(/[’']/g, "");
    const foundKey = Object.keys(phraseSynonyms).find((key) =>
      trimmed.includes(key)
    );
    return foundKey ? phraseSynonyms[foundKey] : input;
  };

  const fetchProducts = async () => {
    try {
      const url = shopId
        ? `${SELLER_API_BASE_URL}/public/search-category-products?q=${categoryName}`
        : `${SELLER_API_BASE_URL}/public/all-products`;

      const res = await fetch(url);
      const data = await res.json();

      const normalizedSearch = normalizePhrase(categoryName);
      const categoryNameLower = normalizedSearch.toLowerCase();

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

      const filtered = data.filter((product) => {
        const productCategory = product.categoryName?.toLowerCase().replace(/[’']/g, "");
        const productTitle = product.title?.toLowerCase().replace(/[’']/g, "");
        return (
          productCategory === categoryNameLower ||
          productTitle.includes(categoryNameLower) ||
          productCategory.includes(categoryNameLower)
        );
      });

      const availableProducts = filtered.filter((product) =>
        product.colors?.some((color) =>
          color.sizes?.some((s) => s.stock > 0)
        )
      );

      setProducts(availableProducts);
    } catch (err) {
      console.error("❌ Error fetching search result products", err);
    }
  };

  const handleAddToCart = () => {
    Alert.alert("Product added to cart");
  };

  const handleProductPress = (product) => {
    const mainImage = product.MainImage?.startsWith("http")
      ? product.MainImage
      : `${SELLER_API_BASE_URL}${product.MainImage}`;

    const firstColor = product.colors?.[0];
    const firstColorImages = firstColor?.images || [];

    setSelectedProductDetails(product);
    setSelectedMainImage(mainImage);
    setSelectedColorName(firstColor?.name || "");
    setSelectedColorImages(firstColorImages);
    setSelectedSize(null);
    setShowDetailModal(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate("Main")} style={styles.backButton}>
        <Image source={require("../assets/img/BlackArrow.png")} style={styles.backIcon} />
      </TouchableOpacity>
      <Text style={styles.heading}>Results for "{categoryName}"</Text>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image source={require("../assets/img/no-results.png")} style={styles.emptyImage} />
          <Text style={styles.emptyText}>No results found...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const hasValidOffer = item.offer && new Date(item.offer.expiresAt) > new Date();
            const discountedPrice = hasValidOffer
              ? (item.price * (1 - item.offer.discountPercentage / 100)).toFixed(2)
              : null;

            return (
              <TouchableOpacity style={styles.productCard} onPress={() => handleProductPress(item)}>
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
          }}
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
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 80 },
  heading: { fontSize: 22, fontWeight: "bold", margin: 10 },
  backButton: { position: "absolute", top: 35, left: 15, zIndex: 10 },
  backIcon: { width: 25, height: 25 },
  productCard: {
    flex: 1,
    margin: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  productImage: { width: 120, height: 120, resizeMode: "cover", borderRadius: 6 },
  productTitle: { fontSize: 14, fontWeight: "600", marginTop: 8, textAlign: "center" },
  productPrice: { fontSize: 16, fontWeight: "bold", color: "#444", marginTop: 4 },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: "line-through",
    color: "gray",
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#d32f2f",
  },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyImage: { width: 170, height: 170, marginBottom: 50 },
  emptyText: { fontSize: 20, color: "gray" },
});

export default ResultOfSearch;

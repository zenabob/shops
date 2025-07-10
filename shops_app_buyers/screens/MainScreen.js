import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  FlatList,
  ScrollView,
  Alert,
} from "react-native";
import { Image} from 'expo-image';

import { SELLER_API_BASE_URL } from "../seller-api";

import { TouchableWithoutFeedback, Keyboard } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProductDetails from "../modals/ProductDetails";
import { Pressable } from "react-native";
import SplitCircleTwoImages from "../components/SplitCircleTwoImages";
import SplitCircleThreeImages from "../components/SplitCircleThreeImages";
import {API_BASE_URL} from "../config";

const screenWidth = Dimensions.get("window").width;

const MainScreen = () => {
  const navigation = useNavigation();

  // State variables
  const [covers, setCovers] = useState([]); // Random shop cover images
  const [products, setProducts] = useState([]); // All products
  const [activeIndex, setActiveIndex] = useState(0); // Active slider index
  const [userId, setUserId] = useState(null); // Logged-in user ID

  const [selectedCategory, setSelectedCategory] = useState("ALL"); // Category filter

  // Modal and product selection
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [selectedMainImage, setSelectedMainImage] = useState("");
  const [selectedColorName, setSelectedColorName] = useState("");
  const [selectedColorImages, setSelectedColorImages] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);

  // Search functionality
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const fetchData = async () => {
  try {
    const userId = await AsyncStorage.getItem("userId");
    setUserId(userId);

    const res = await fetch(`${SELLER_API_BASE_URL}/public/all-products`);
    const data = await res.json();
    setProducts(data.length > 0 ? data : []);

    // ✅ Preload all MainImage URIs for better performance
    const imageList = data
      .filter((item) => typeof item.MainImage === "string")
      .map((item) => ({
        uri: item.MainImage.startsWith("http")
          ? item.MainImage
          : `${SELLER_API_BASE_URL}${item.MainImage}`,
      }));


  } catch (error) {
    console.error("❌ Error fetching all products:", error);
  }
};


  const fetchCovers = async () => {
    try {
      const res = await fetch(`${SELLER_API_BASE_URL}/random-covers`);
      const data = await res.json();
      setCovers(data);
    } catch (error) {
      console.error("❌ Error fetching covers:", error);
    }
  };
  const fetchSuggestions = async (text) => {
    setSearchText(text);

    if (text.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsFetchingSuggestions(true);

    try {
      const res = await fetch(
        `${SELLER_API_BASE_URL}/public/search-suggestions?q=${text}`
      );
      const data = await res.json();

      const shops = data.filter(
  (d) => d.type === "shop" && d.status === "approved"
);

      const categories = data.filter((d) => d.type === "category");
      const products = data.filter((d) => d.type === "product");
      const colors = data.filter((d) => d.type === "color");
      const queryLower = text.toLowerCase();

      const sortByMatch = (a, b) => {
        const aName = (a.name || a.colorName || "").toLowerCase();
        const bName = (b.name || b.colorName || "").toLowerCase();

        const aStarts = aName.startsWith(queryLower);
        const bStarts = bName.startsWith(queryLower);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return 0; // keep original order if both start or neither starts
      };

      const sorted = [...shops, ...categories, ...products, ...colors].sort(
        sortByMatch
      );

      setSuggestions(sorted);
    } catch (error) {
      console.error("❌ Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  useEffect(() => {
    fetchData(); // initial fetch
    fetchCovers();

    const intervalId = setInterval(() => {
      fetchData(); // refresh products every minute
    }, 10000);

    return () => clearInterval(intervalId); // cleanup
  }, []);

  const handleSuggestionPress = (suggestion) => {
    if (suggestion.type === "shop") {
      navigation.navigate("ShopProfile", {
        shopId: suggestion.shopId || null,
        shopName: suggestion.name,
        userId,

      });
    } else if (suggestion.type === "category") {
      navigation.navigate("ResultOfSearch", {
        shopId: suggestion.shopId,
        categoryName: suggestion.name,
        userId: userId,
      });
    } else if (suggestion.type === "product") {
      const product = products.find((p) => p.title === suggestion.name);
      if (product) handleProductPress(product);
    } else if (suggestion.type === "color") {
      const { colorName, categoryName } = suggestion;

      const matchingProducts = products.filter((p) => {
        const categoryMatch =
          p.categoryName?.toLowerCase() === categoryName.toLowerCase();
        const hasColor = p.colors?.some(
          (c) => c.name.toLowerCase() === colorName.toLowerCase()
        );
        return categoryMatch && hasColor;
      });

      navigation.navigate("ResultOfSearch", {
        results: matchingProducts,
        userId,
        categoryName: `${colorName} ${categoryName}`,
      });
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

  const handleAddToCart = async (cartItem) => {
  try {
    if (!userId) {
      Alert.alert("User not logged in");
      return;
    }

    // ✅ Add offer data if it exists and is still valid
    let offerData = null;
    if (
      cartItem.offer &&
      new Date(cartItem.offer.expiresAt) > new Date()
    ) {
      offerData = cartItem.offer;
    }

    const response = await fetch(
      `${API_BASE_URL}/profile/${userId}/cart`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cartItem,
          offer: offerData, 
        }),
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

  const highlightMatch = (text, query) => {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, "i");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <Text key={index} style={{ color: "#77BBA2", fontWeight: "bold" }}>
          {part}
        </Text>
      ) : (
        <Text key={index}>{part}</Text>
      )
    );
  };

  const filteredProducts = products.filter((item) => {
    if (selectedCategory === "ALL") return true;

    const category = item.categoryName?.toLowerCase() || "";

    if (selectedCategory === "Women") {
      return (
        /\bwomen'?s?\b|\bwoman'?s?\b/.test(category) ||
        category.includes("dress") ||
        category.includes("skirt")
      );
    }

    if (selectedCategory === "Men") {
      return (
        /\bmen'?s?\b|\bman'?s?\b/.test(category) &&
        !/\bwomen'?s?\b|\bwoman'?s?\b/.test(category)
      );
    }

    if (selectedCategory === "Kids") {
      return /\bkids?\b|\bboy\b|\bgirl\b|\bchild(ren)?\b/.test(category);
    }

    return category.includes(selectedCategory);
  });

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        setSuggestions([]); //
        Keyboard.dismiss(); //
      }}
    >
      <ImageBackground
        source={require("../assets/img/Background img.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {suggestions.length > 0 && (
          <Pressable
            onPress={() => {
              setSuggestions([]);
              Keyboard.dismiss();
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
            }}
          />
        )}

        {(suggestions.length > 0 || isFetchingSuggestions) && (
  <View style={styles.suggestionsContainer}>
            <ScrollView
              style={{ maxHeight: 250 }}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
             {suggestions.length === 0 && !isFetchingSuggestions && searchText.length >= 2 ? (
  <View style={styles.noSuggestions}>
    <Text style={styles.noSuggestionsText}>No suggestions found</Text>
  </View>
) :(
                suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    <Text>
                      {highlightMatch(
                        suggestion.type === "color"
                          ? `${suggestion.colorName} ${suggestion.categoryName}`
                          : suggestion.name,
                        searchText
                      )}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        )}

        <FlatList
          ListHeaderComponent={
            <>
              {/* Navbar */}
              <View style={styles.navbar1}>
                <View style={styles.leftIcons}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Cart", { userId })}
                  >
                    <Image
                      source={require("../assets/img/Cart.png")}
                      style={styles.icon}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("FavoritesScreen", { userId })
                    }
                  >
                    <Image
                      source={require("../assets/img/Heart.png")}
                      style={styles.icon}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                  <Image
                    source={require("../assets/img/Search.png")}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search..."
                    placeholderTextColor="#A9A9A9"
                    value={searchText}
                    onChangeText={fetchSuggestions}
                    onSubmitEditing={() => {
  const trimmed = searchText.trim().toLowerCase();

  const matchedShop = suggestions.find(
    (s) => s.type === "shop" && s.name.toLowerCase() === trimmed
  );

  if (matchedShop) {
    navigation.navigate("ShopProfile", {
      shopId: matchedShop.shopId || null,
      shopName: matchedShop.name,
      userId,
    });
    setSuggestions([]);
    Keyboard.dismiss();
    return;
  }

  // 2. تحقق من وجود منتج بالاسم
  const matchedProduct = products.find(
    (p) => p.title.toLowerCase() === trimmed
  );

  if (matchedProduct) {
    handleProductPress(matchedProduct);
    setSuggestions([]);
    Keyboard.dismiss();
    return;
  }

  // 3. إذا لم يكن محل أو منتج، نفذ البحث العادي
  if (trimmed.length > 0) {
    navigation.navigate("ResultOfSearch", {
      shopId: null,
      categoryName: searchText,
      userId: userId,
    });
    setSuggestions([]);
    Keyboard.dismiss();
  }
}}

                    returnKeyType="search"
                  />
                </View>
              </View>

              {/* Navbar 2 */}
              <View style={styles.navbar2}>
                <View style={styles.categories}>
                  {["ALL", "Women", "Men", "Kids"].map((cat, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.category,
                          selectedCategory === cat && {
                            textDecorationLine: "underline",
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Cover slider */}
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const scrollX = e.nativeEvent.contentOffset.x;
                  const index = Math.round(scrollX / screenWidth);
                  setActiveIndex(index);
                }}
                scrollEventThrottle={16}
                style={styles.sliderContainer}
              >
                {covers.map((shop) => (
                  <TouchableOpacity
                    key={shop._id}
                    onPress={() =>
                      navigation.navigate("ShopProfile", {
                        shopId: shop._id,
                        userId,
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <Image
 source={{
    uri: shop.cover?.startsWith("http")
      ? shop.cover
      : `${SELLER_API_BASE_URL}${shop.cover}`,
 
  }}
  style={styles.sliderImage}
/>

                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Dots */}
              <View style={styles.dotsContainer}>
                {covers.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      activeIndex === index && styles.activeDot,
                    ]}
                  />
                ))}
              </View>

              {/* Categories circles */}
              <FlatList
                data={[
                  {
                    name: "Dress",
                    img: require("../assets/img/Women.png"),
                    isSplit: false,
                    isTriple: false,
                  },
                  {
                    name: "Set",
                    isSplit: true,
                    isTriple: false,
                    img1: require("../assets/img/Man.png"),
                    img2: require("../assets/img/suit.png"),
                  },
                  {
                    name: "Kid's",
                    img: require("../assets/img/Kids.png"),
                    isSplit: false,
                    isTriple: false,
                  },
                  {
                    name: "skirt",
                    img: require("../assets/img/skirt.png"),
                    isSplit: false,
                    isTriple: false,
                  },
                  {
                    name: "Shoes",
                    isTriple: true,
                    isSplit: false,
                    img1: require("../assets/img/smart-shoe.png"),
                    img2: require("../assets/img/high-heel.png"),
                    img3: require("../assets/img/sport-shoe.png"),
                  },
                  {
                    name: "Pant",
                    img: require("../assets/img/pants.png"),
                    isSplit: false,
                    isTriple: false,
                  },
                  {
                    name: "Shirt",
                    img: require("../assets/img/polo-shirt.png"),
                    isSplit: false,
                    isTriple: false,
                  },
                  {
                    name: "Blouse",
                    img: require("../assets/img/blouse.png"),
                    isSplit: false,
                    isTriple: false,
                  },
                ]}
                keyExtractor={(item, index) => index.toString()}
                numColumns={4}
                contentContainerStyle={{
                  alignItems: "center",
                  paddingBottom: 20,
                }}
                renderItem={({ item }) => (
                  <View style={styles.categoryItem}>
                    <TouchableOpacity
                      style={[styles.categoryCircle]}
                      onPress={() => {
                        const name = item.name.toLowerCase();
                        if (name === "pant") {
                          setSelectedCategory("bottom");
                        } else if (name === "kid's") {
                          setSelectedCategory("kid's");
                        } else {
                          setSelectedCategory(name); // مثل dress, blouse, skirt, shirt
                        }
                      }}
                    >
                      {item.isTriple ? (
                        <SplitCircleThreeImages
                          image1={item.img1}
                          image2={item.img2}
                          image3={item.img3}
                        />
                      ) : item.isSplit ? (
                        <SplitCircleTwoImages
                          image1={item.img1}
                          image2={item.img2}
                        />
                      ) : (
  <Image
  source={
    typeof item.img === "string"
      ? {
          uri: item.img.startsWith("http")
            ? item.img
            : `${SELLER_API_BASE_URL}${item.img}`,
          
        }
      : item.img
  }
  style={styles.categoryImage}
/>



                      )}
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory ===
                          (item.name.toLowerCase() === "pant"
                            ? "bottom"
                            : item.name.toLowerCase()) && { color: "#77BBA2" },
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                )}
              />

              {products.length > 0 && (
                <Text style={styles.sectionTitle}>Recommended For You</Text>
              )}
            </>
          }
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item, index) => item?._id || `fallback-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleProductPress(item)}
              style={styles.productCard}
            >
              <Image
  source={{
    uri:
      typeof item.MainImage === "string"
        ? item.MainImage.startsWith("http")
          ? item.MainImage
          : `${SELLER_API_BASE_URL}${item.MainImage}`
        : "https://via.placeholder.com/150",
 
  }}
  style={styles.productImage}
/>


              <Text numberOfLines={1} style={styles.productTitle}>
                {item.title}
              </Text>
              {item.offer && new Date(item.offer.expiresAt) > new Date() ? (
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.originalPrice}>{item.price}ILS</Text>
                  <Text style={styles.discountedPrice}>
                    {(
                      item.price *
                      (1 - item.offer.discountPercentage / 100)
                    ).toFixed(2)}{" "}
                    ILS
                  </Text>
                </View>
              ) : (
                <Text style={styles.productPrice}> {item.price}ILS</Text>
              )}
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />

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
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
};
const styles = StyleSheet.create({
  background: {
    flex: 1,
    paddingTop: 40,
  },
  navbar1: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#77BBA2",
    paddingHorizontal: 10,
    height: 60,
    width: "100%",
  },
  navbar2: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#77BBA2",
    paddingHorizontal: 5,
    height: 50,
    width: "100%",
    justifyContent: "space-between",
  },
  leftIcons: {
    flexDirection: "row",
    gap: 5,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
    marginHorizontal: 5,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 8,
    flex: 1,
    marginHorizontal: 10,
    height: 30,
  },
  searchIcon: {
    width: 15,
    height: 15,
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
  },
  categories: {
    flexDirection: "row",
    alignItems: "center",
  },
  category: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    marginHorizontal: 30,
  },
  menuButton: {
    position: "absolute",
    right: 10,
    top: 15,
  },
  sliderContainer: {
    marginTop: 10,
    resizeMode: "contain",
  },
  sliderImage: {
    width: screenWidth,
    height: 230,
    backgroundColor: "#fff",
    resizeMode: "contain",
  },
  dotsContainer: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 130,
    left: 180,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#77BBA2",
    width: 10,
    height: 10,
  },
  categoryCircleContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 90,
    width: "100%",
    paddingHorizontal: 10,
  },
  categoryCircle: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#cce7dd",
    borderRadius: 50,
    width: 70,
    height: 70,
    borderColor: "#000",
    borderWidth: 2,
  },
  categoryImage: {
    width: 30,
    height: 100,
    resizeMode: "contain",
    tintColor: "black",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    marginTop: 5,
    textAlign: "center",
  },
  categoryItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  productsContainer: {
    paddingHorizontal: 10,
    marginTop: 40,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 5,
    marginBottom: 10,
    marginTop: 25,
  },
  productCard: {
    flex: 1,
    height: 370,
    margin: 5,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  productImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  productTitle: {
    fontWeight: "bold",
    marginTop: 5,
  },
  productPrice: {
    color: "#e53935",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 7,
  },
  suggestionsContainer: {
    backgroundColor: "#fff",
    position: "absolute",
    top: 85,
    left: 85,
    right: 10,
    zIndex: 999,
    padding: 5,
    maxHeight: 250,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    width: 323,
    overflow: "hidden",
  },

  suggestionItem: {
    paddingVertical: 8,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  categoryItem: {
    alignItems: "center",
    justifyContent: "center",
    margin: 10,
    width: 80,
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
});

export default MainScreen;

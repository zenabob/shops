import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import ProductDetails from "../modals/ProductDetails";

const { width } = Dimensions.get("window");
const cardWidth = (width - 40) / 2;
const FavoritesScreen = ({ route }) => {
  const { shopId, userId } = route.params;
  const [favorites, setFavorites] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [selectedColorName, setSelectedColorName] = useState(null);
  const [selectedMainImage, setSelectedMainImage] = useState(null);
  const [selectedColorImages, setSelectedColorImages] = useState([]);
  const [removedProductId, setRemovedProductId] = useState(null);

  const navigation = useNavigation();

  useEffect(() => {
    if (userId) fetchFavorites();
  }, [userId]);

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`http://172.20.10.4:5001/user/${userId}/favorites`);
      setFavorites(res.data);
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
    }
  };

  const handleAddToCart = async (cartItem) => {
    try {
      if (!userId) {
        alert("User not logged in");
        return;
      }

      const response = await fetch(`http://172.20.10.4:5001/profile/${userId}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartItem),
      });

      const text = await response.text();
      if (response.ok) {
        alert("Product added to cart!");
      } else {
        alert("Error: " + text);
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert("Something went wrong");
    }
  };
  const handleCloseModal = () => {
    setShowDetailModal(false);
  
    if (removedProductId) {
      setFavorites((prev) =>
        prev.filter((item) => item.productId !== removedProductId)
      );
      setRemovedProductId(null); // نرجع نفضيها
    }
  };
  
  const handleFavoriteToggle = (productId, isNowFavorite) => {
    if (!isNowFavorite) {
      setRemovedProductId(productId); 
    }
  };
  
  
  const openProductDetails = async (item) => {
    try {
      const resolvedShopId = item.shopId?._id || item.shopId;
  
      if (!resolvedShopId || !item.productId) {
        alert("Missing product or shop ID.");
        return;
      }
  
      const res = await axios.get(
        `http://172.20.10.4:5000/public/shop/${resolvedShopId}/product/${item.productId}`
      );
  
      const fullProduct = res.data.product;
      const firstColor = fullProduct.colors?.[0];
  
      setSelectedProductDetails({ ...fullProduct, shopId: resolvedShopId }); // 👈 save shopId here
      setSelectedColorName(firstColor?.name || "");
      setSelectedMainImage(
        firstColor?.previewImage || firstColor?.images?.[0] || fullProduct.MainImage
      );
      setSelectedColorImages(firstColor?.images || []);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching product details:", error);
      alert("Could not load product details.");
    }
  };
  
  
  

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      key={`${item.productId}_${index}`}
      onPress={() => openProductDetails(item)}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.price}>{item.price} ILS</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate("Main")} style={styles.backButton}>
        <Image source={require("../assets/img/BlackArrow.png")} style={styles.backIcon} />
      </TouchableOpacity>

      <FlatList
        data={favorites}
        keyExtractor={(item, index) => `${item.productId}_${index}`}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={renderItem}
      />

      {selectedProductDetails && (
        <ProductDetails
          visible={showDetailModal}
          onClose={handleCloseModal}
          selectedProductDetails={selectedProductDetails}
          selectedMainImage={selectedMainImage}
          selectedColorName={selectedColorName}
          selectedColorImages={selectedColorImages}
          setSelectedColorName={setSelectedColorName}
          setSelectedMainImage={setSelectedMainImage}
          setSelectedColorImages={setSelectedColorImages}
          onAddToCart={handleAddToCart}
          shopId={selectedProductDetails?.shopId}
          userId={userId}
          onFavoriteToggle={handleFavoriteToggle}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 80,
    flex: 1,
    backgroundColor: "#E5E4E2",
    paddingHorizontal: 10,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 15,
  },
  card: {
    width: cardWidth,
    height: 270,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#ccc",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    marginTop: 20,
  },
  image: {
    width: "100%",
    height: 190,
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    padding:5,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: "#e53935",
    fontWeight: "bold",
    padding:5,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 15,
    zIndex: 10,
    marginTop: 20,
  },
  backIcon: {
    width: 25,
    height: 25,
    tintColor: "#333",
  },
});

export default FavoritesScreen;

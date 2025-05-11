import React, { useEffect, useState, useRef } from "react";

import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import { Animated } from "react-native";

const CartScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params || {};
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const swipeableRefs = useRef({});

  useEffect(() => {
    if (userId) {
      fetchCart();
    } else {
      console.warn("⚠️ userId is undefined");
    }
  }, [userId]);

  const fetchCart = async () => {
    try {
      const res = await axios.get(
        `http://172.20.10.4:5001/profile/${userId}/cart`
      );
      setCart(res.data);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
  };
  const deleteFromCart = async (productId, color, size) => {
    try {
      await axios.delete(`http://172.20.10.4:5001/profile/${userId}/cart`, {
        data: {
          productId,
          selectedColor: color,
          selectedSize: size,
        },
      });
      fetchCart();
    } catch (err) {
      console.error("Error deleting item from cart:", err);
    }
  };
  const renderRightActions = (progress, dragX, product) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });

    const confirmDelete = () => {
      Alert.alert(
        "Delete Product",
        "Are you sure you want to remove this item from your cart?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            onPress: () =>
              deleteFromCart(
                product.productId,
                product.selectedColor,
                product.selectedSize
              ),
            style: "destructive",
          },
        ]
      );
    };

    return (
      <RectButton style={styles.deleteButton} onPress={confirmDelete}>
        <Animated.Image
          source={require("../assets/img/delete.png")}
          style={[styles.deleteIcon, { transform: [{ scale }] }]}
        />
      </RectButton>
    );
  };

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(
        `http://172.20.10.4:5001/user/${userId}/favorites`
      );
      setFavorites(res.data);
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchCart();
      fetchFavorites();
    }
  }, [userId]);
  const toggleFavorite = async (product) => {
    const isFav = favorites.some((fav) => fav.productId === product.productId);

    try {
      if (isFav) {
        await axios.delete(
          `http://172.20.10.4:5001/user/${userId}/favorites/${product.productId}`
        );
      } else {
        const favoriteItem = {
          productId: product.productId,
          title: product.title,
          image: product.image,
          color: product.selectedColor,
          price: product.price,
          shopId: product.shopId._id,
        };
        await axios.post(
          `http://172.20.10.4:5001/user/${userId}/favorites`,
          favoriteItem
        );
      }

      fetchFavorites();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const groupedByShop = cart.reduce((acc, item) => {
    const shopKey =
      typeof item.shopId === "object" ? item.shopId._id : item.shopId;

    if (!acc[shopKey]) {
      acc[shopKey] = { shop: item.shopId, products: [] };
    }
    acc[shopKey].products.push(item);
    return acc;
  }, {});

  const shopGroups = Object.values(groupedByShop);
  const updateCartQuantity = async (productId, color, size, newQuantity) => {
    try {
      await axios.put(
        `http://172.20.10.4:5001/profile/${userId}/cart/update-quantity`,
        {
          productId,
          selectedColor: color,
          selectedSize: size,
          quantity: newQuantity,
        }
      );

      fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        onPress={() => navigation.navigate("Main")}
        style={styles.backButton}
      >
        <Image
          source={require("../assets/img/BlackArrow.png")}
          style={styles.backIcon}
        />
      </TouchableOpacity>

      <FlatList
        data={shopGroups}
        keyExtractor={(item) => item.shop._id}
        renderItem={({ item }) => (
          <View style={styles.shopSection}>
            <View style={styles.shopHeader}>
              <Image
                source={require("../assets/img/store.png")}
                style={styles.shopIcon}
              />
              <Text style={styles.shopName}>
                {typeof item.shop === "object" ? item.shop.shopName : "Shop"}
              </Text>
            </View>

            {item.products.map((product) => {
              const isFav = favorites.some(
                (fav) => fav.productId === product.productId
              );

              return (
                <Swipeable
                  ref={(ref) => {
                    if (ref) {
                      const key = `${product.productId}_${product.selectedColor}_${product.selectedSize}`;
                      swipeableRefs.current[key] = ref;
                    }
                  }}
                  onSwipeableWillOpen={() => {
                    Object.entries(swipeableRefs.current).forEach(
                      ([key, ref]) => {
                        const currentKey = `${product.productId}_${product.selectedColor}_${product.selectedSize}`;
                        if (key !== currentKey && ref) {
                          ref.close();
                        }
                      }
                    );
                  }}
                  renderRightActions={(progress, dragX) =>
                    renderRightActions(progress, dragX, product)
                  }
                  key={`${product.productId}_${product.selectedColor}_${product.selectedSize}`}
                  rightThreshold={20}
                  overshootRight={false}
                  friction={2}
                >
                  <View style={styles.productCard}>
                    {product.image && (
                      <Image
                        source={{ uri: product.image }}
                        style={styles.productImage}
                      />
                    )}

                    <View style={styles.productDetails}>
                      <Text style={styles.title}>
                        {product.title || "No title"}
                      </Text>
                      <Text style={styles.price}>
                        {product.price ? `${product.price} ILS` : "No price"}
                      </Text>
                      <Text style={styles.options}>
                        Color: {product.selectedColor} | Size:{" "}
                        {product.selectedSize}
                      </Text>

                      <View style={styles.actions}>
                        <View style={styles.quantityBox}>
                          <TouchableOpacity
                            onPress={() =>
                              updateCartQuantity(
                                product.productId,
                                product.selectedColor,
                                product.selectedSize,
                                product.quantity > 1 ? product.quantity - 1 : 1
                              )
                            }
                          >
                            <Text style={styles.quantityButton}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>
                            {product.quantity}
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              updateCartQuantity(
                                product.productId,
                                product.selectedColor,
                                product.selectedSize,
                                product.quantity + 1
                              )
                            }
                          >
                            <Text style={styles.quantityButton}>+</Text>
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          onPress={() => toggleFavorite(product)}
                        >
                          <Image
                            source={
                              isFav
                                ? require("../assets/img/BlackFullHeart.png")
                                : require("../assets/img/BlackHeart.png")
                            }
                            style={styles.heartIcon}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Swipeable>
              );
            })}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 40,
    left: 15,
    zIndex: 10,
  },
  backIcon: {
    width: 25,
    height: 25,
    tintColor: "#333",
  },
  shopSection: {
    marginTop: 80,
    marginBottom: 2,
    paddingHorizontal: 10,
  },
  shopHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  shopIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  shopName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 7,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    marginRight: 10,
    borderRadius: 8,
  },
  productDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
  },
  price: {
    fontSize: 14,
    color: "#e53935",
    marginVertical: 4,
  },
  options: {
    fontSize: 12,
    color: "#555",
  },
  actions: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quantityBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  quantityButton: {
    fontSize: 16,
    marginHorizontal: 10,
    color: "#333",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  heartIcon: {
    width: 27,
    height: 24,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: "#FF4D4F",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 20,
    width: 300,
    borderRadius: 10,
    marginBottom: 7,
  },

  deleteIcon: {
    width: 30,
    height: 30,
    tintColor: "white",
  },
});

export default CartScreen;

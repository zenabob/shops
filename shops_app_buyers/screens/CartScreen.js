import React, { useEffect, useState, useRef } from "react";
import uuid from "react-native-uuid";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from "react-native";
import axios from "axios";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Swipeable, RectButton } from "react-native-gesture-handler";

const CartScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params || {};
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [soldOutItems, setSoldOutItems] = useState([]);
  const swipeableRefs = useRef({});

  useEffect(() => {
    if (userId) {
      fetchCart();
      fetchFavorites();
      const intervalId = setInterval(fetchCart, 10000);
      return () => clearInterval(intervalId);
    } else {
      console.warn("⚠️ userId is undefined");
    }
  }, [userId]);

  const fetchCart = async () => {
    try {
      const res = await axios.get(
        `http://172.20.10.4:5001/profile/${userId}/cart`
      );
      const freshCart = res.data;

      const available = [];
      const soldOut = [];

      for (let item of freshCart) {
        const resProduct = await axios.get(
          `http://172.20.10.4:5000/public/shop/${item.shopId._id}/product/${item.productId}`
        );

        const product = resProduct.data.product;
        const color = product.colors.find((c) => c.name === item.selectedColor);
        const size = color?.sizes.find((s) => s.size === item.selectedSize);

        if (!size || size.stock === 0) {
          soldOut.push(item);
        } else {
          available.push(item);
        }
      }

      setCart(available);
      setSoldOutItems(soldOut);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    }
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

  const deleteFromCart = async (productId, color, size) => {
    try {
      await axios.delete(`http://172.20.10.4:5001/profile/${userId}/cart`, {
        data: { productId, selectedColor: color, selectedSize: size },
      });
      fetchCart();
    } catch (err) {
      console.error("Error deleting item from cart:", err);
    }
  };

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

  const calculateTotals = () => {
    let total = 0;
    let saved = 0;

    cart.forEach((item) => {
      const quantity = item.quantity;

      const originalPrice =
        item.offer && item.offer.discountPercentage
          ? +(item.price / (1 - item.offer.discountPercentage / 100)).toFixed(2)
          : item.price;

      const actualPrice = item.price;

      if (item.offer && new Date(item.offer.expiresAt) > new Date()) {
        saved += (originalPrice - actualPrice) * quantity;
      }

      let finalPrice = item.price;

if (
  item.offer &&
  item.offer.discountPercentage &&
  new Date(item.offer.expiresAt) > new Date()
) {
  finalPrice = +(item.price * (1 - item.offer.discountPercentage / 100)).toFixed(2);
}

total += finalPrice * item.quantity;

    });

    return {
      total: total.toFixed(2),
      saved: saved.toFixed(2),
    };
  };

  useEffect(() => {
    const refs = {};
    cart.forEach((item) => {
      const key = `${item.productId}_${item.selectedColor}_${item.selectedSize}`;
      refs[key] = React.createRef();
    });
    swipeableRefs.current = refs;
  }, [cart]);

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

  const handleCheckout = async () => {
    const { total } = calculateTotals();

    if (parseFloat(total) === 0) {
      Alert.alert("Cart is empty", "You cannot checkout with an empty cart.");
      return;
    }

    try {
      let changesMade = false;
      let message = "";

      for (const item of cart) {
        const res = await axios.get(
          `http://172.20.10.4:5000/public/shop/${item.shopId._id}/product/${item.productId}`
        );

        const productData = res.data.product;
        const selectedColor = productData.colors.find(
          (c) => c.name === item.selectedColor
        );
        const selectedSize = selectedColor?.sizes.find(
          (s) => s.size === item.selectedSize
        );

        const availableStock = selectedSize ? selectedSize.stock : 0;

       if (!selectedSize || availableStock === 0) {
  console.log("🟥 Sold out detected:", item);

  await axios.delete(`http://172.20.10.4:5001/profile/${userId}/cart`, {
    data: {
      productId: item.productId,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
    },
  });

  message += `• ${item.title} (Color: ${item.selectedColor}, Size: ${item.selectedSize}) was removed – out of stock.\n\n`;
  changesMade = true;
}
else if (item.quantity > availableStock) {
          await axios.put(
            `http://172.20.10.4:5001/profile/${userId}/cart/update-quantity`,
            {
              productId: item.productId,
              selectedColor: item.selectedColor,
              selectedSize: item.selectedSize,
              quantity: availableStock,
            }
          );

          message += `• ${item.title} (Color: ${item.selectedColor}, Size: ${item.selectedSize})\n  Requested quantity (${item.quantity}) is not available.\n  Only ${availableStock} left in stock. We have updated your cart to reflect the available quantity.\n\n`;


          changesMade = true;
        }
      }

      if (changesMade) {
        fetchCart();
        Alert.alert(
          "Cart Updated",
          `We made some updates to your cart:\n\n${message}`
        );
        return; 
      }

   
      Alert.alert(
        "Select delivery area",
        "Please choose your location",
        [
          {
            text: "Jerusalem   30",
            onPress: () => confirmLocation("Jerusalem", 30),
          },
          { text: "Israel   70", onPress: () => confirmLocation("Israel", 70) },
          {
            text: "West Bank   20",
            onPress: () => confirmLocation("West Bank", 20),
          },
          { text: "Cancel", style: "cancel" },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error("❌ Error validating cart stock:", error);
      Alert.alert("Error", "Could not verify product availability.");
    }
  };

  const confirmLocation = async (location, shippingCost) => {
    const { total } = calculateTotals();
    const finalAmount = (parseFloat(total) + shippingCost).toFixed(2);

    Alert.alert(
      "Confirm your order",
      `Do you want to confirm your order to ${location}?\n\nTotal price = ₪${finalAmount}`,
      [
        {
          text: "Yes",
          onPress: async () => {
            try {
              const res = await axios.post(
                `http://172.20.10.4:5001/orders/${userId}`,
                {
                  location,
                  shippingCost,
                }
              );

              Alert.alert("Order Confirmed", "Your order has been confirmed.");
              fetchCart(); // clear the cart
            } catch (error) {
              const status = error.response?.status;
              const data = error.response?.data;

              if (status === 409 && data?.failedItems?.length > 0) {
                const alertMessage = data.failedItems
                  .map(
                    (item) =>
                      `• ${item.title} (Color: ${item.color}, Size: ${item.size})\n  Requested: ${item.requested}, Available: ${item.available}`
                  )
                  .join("\n\n");

                Alert.alert(
                  "Stock issue",
                  `Please review your cart:\n\n${alertMessage}`
                );
              } else {
                console.error("❌ Order error:", error);
                Alert.alert(
                  "Error",
                  "Failed to confirm the order. Please try again."
                );
              }
            }
          },
        }, 
        {
          text: "No",
          style: "cancel",
        },
      ]
    );
  };

  const groupedByShop = cart.reduce((acc, item) => {
    const shop = item.shopId;
    const shopKey = shop?._id?.toString() || item.shopId?.toString();

    if (!acc[shopKey]) {
      acc[shopKey] = {
        shopId: shop._id,
        shopName: shop.shopName || "Shop",
        products: [],
      };
    }

    acc[shopKey].products.push(item);
    return acc;
  }, {});

  const shopGroups = Object.values(groupedByShop);
  const { total, saved } = calculateTotals();

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
        keyExtractor={(item, index) =>
          item.shopId.toString() || `shop-${index}`
        }
        renderItem={({ item }) => (
          <View style={styles.shopSection}>
            <Text style={styles.shopName}>{item.shopName}</Text>

            {item.products.map((product) => {
              const key = `${product.productId}_${product.selectedColor}_${product.selectedSize}`;
              const isFav = favorites.some(
                (fav) => fav.productId === product.productId
              );

              return (
                <Swipeable
                  key={key}
                  ref={swipeableRefs.current[key]}
                  onSwipeableWillOpen={() => {
                    Object.entries(swipeableRefs.current).forEach(
                      ([k, refObj]) => {
                        if (k !== key && refObj?.current) {
                          refObj.current.close();
                        }
                      }
                    );
                  }}
                  renderRightActions={(progress, dragX) =>
                    renderRightActions(progress, dragX, product)
                  }
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

                      {product.offer &&
                      new Date(product.offer.expiresAt) > new Date() ? (
                        <View>
                          <Text style={styles.originalPrice}>
                            {(
                              product.price /
                              (1 - product.offer.discountPercentage / 100)
                            ).toFixed(2)}{" "}
                            ILS
                          </Text>
                          <Text style={styles.discountedPrice}>
                            {product.price} ILS
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.price}>{product.price} ILS</Text>
                      )}

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
                            onPress={async () => {
                              try {
                                const res = await axios.get(
                                  `http://172.20.10.4:5000/public/shop/${product.shopId._id}/product/${product.productId}`
                                );

                                const productData = res.data.product;
                                const selectedColor = productData.colors.find(
                                  (c) => c.name === product.selectedColor
                                );
                                const selectedSizeObj =
                                  selectedColor?.sizes.find(
                                    (s) => s.size === product.selectedSize
                                  );

                                if (!selectedSizeObj) {
                                  Alert.alert(
                                    "Error",
                                    "Size not found in product data."
                                  );
                                  return;
                                }

                                if (
                                  product.quantity + 1 >
                                  selectedSizeObj.stock
                                ) {
                                  Alert.alert(
                                    "Insufficient Stock",
                                    `Only ${selectedSizeObj.stock} pieces available in stock.`
                                  );
                                  return;
                                }

                                updateCartQuantity(
                                  product.productId,
                                  product.selectedColor,
                                  product.selectedSize,
                                  product.quantity + 1
                                );
                              } catch (error) {
                                console.error("Error checking stock:", error);
                                Alert.alert(
                                  "Error",
                                  "Failed to check stock. Please try again."
                                );
                              }
                            }}
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
        ListFooterComponent={<View style={{ height: 120 }} />}
      />
      {soldOutItems.length > 0 && (
        <View style={{ marginTop: 30, paddingHorizontal: 15 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "red" }}>
            Sold Out Items
          </Text>
          {soldOutItems.map((item, index) => (
            <View
              key={index}
              style={{
                marginTop: 10,
                backgroundColor: "#fdd",
                padding: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ fontWeight: "bold" }}>{item.title}</Text>
              <Text style={{ color: "#555" }}>
                Color: {item.selectedColor} | Size: {item.selectedSize}
              </Text>
              <Text style={{ color: "red" }}>Out of stock</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.summaryContainer}>
        <TouchableOpacity
          onPress={handleCheckout}
          style={styles.checkoutButton}
        >
          <Text style={styles.checkoutButtonText}>Checkout</Text>
        </TouchableOpacity>

        <Text style={styles.totalText}>
          <Text style={styles.savedText}>saved ₪{saved} </Text> ₪{total}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backButton: { position: "absolute", top: 40, left: 15, zIndex: 10 },
  backIcon: { width: 25, height: 25, tintColor: "#333" },
  shopSection: { marginTop: 80, paddingHorizontal: 10 },
  shopName: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 7,
    elevation: 2,
  },
  productImage: { width: 80, height: 80, marginRight: 10, borderRadius: 8 },
  productDetails: { flex: 1 },
  title: { fontSize: 14, fontWeight: "bold" },
  price: { fontSize: 14, color: "#e53935", marginVertical: 4 },
  originalPrice: {
    textDecorationLine: "line-through",
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
  },
  discountedPrice: {
    color: "#e53935",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 2,
  },
  options: { fontSize: 12, color: "#555" },
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
  quantityButton: { fontSize: 16, marginHorizontal: 10, color: "#333" },
  quantityText: { fontSize: 14, fontWeight: "bold" },
  heartIcon: { width: 27, height: 24, marginRight: 10 },
  deleteButton: {
    backgroundColor: "#FF4D4F",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 20,
    width: 300,
    borderRadius: 10,
    marginBottom: 7,
  },
  deleteIcon: { width: 30, height: 30, tintColor: "white" },
  summaryContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 10,
    height: 90,
  },
  checkoutButton: {
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: 140,
    height: 40,
    marginLeft: 10,
    marginBottom: 15,
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  totalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e67e22",
    marginBottom: 25,
  },
  savedText: {
    fontSize: 13,
    color: "#888",
    marginLeft: 8,
  },
});

export default CartScreen;

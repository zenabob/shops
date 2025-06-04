import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import axios from "axios";
import {API_BASE_URL} from "../config";
import { SELLER_API_BASE_URL } from "../seller-api";

const ProductDetails = ({
  visible,
  onClose,
  selectedProductDetails,
  selectedMainImage,
  selectedColorName,
  selectedColorImages = [],
  setSelectedColorName,
  setSelectedMainImage,
  setSelectedColorImages,
  selectedSize,
  setSelectedSize,
  onAddToCart,
  shopId,
  userId,
  onFavoriteToggle,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [tick, setTick] = useState(0);
  const [localSelectedSize, setLocalSelectedSize] = useState(null);

  const hasValidOffer =
    selectedProductDetails?.offer &&
    new Date(selectedProductDetails.offer.expiresAt) > new Date();

  const discountedPrice = hasValidOffer
    ? (
        selectedProductDetails.price *
        (1 - selectedProductDetails.offer.discountPercentage / 100)
      ).toFixed(2)
    : null;

  const sizes =
    selectedProductDetails?.colors?.find((c) => c.name === selectedColorName)
      ?.sizes || [];

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkFavorite = async () => {
      if (!userId || !selectedProductDetails?._id) return;
      try {
        const res = await axios.get(
          `${API_BASE_URL}/user/${userId}/favorites`
        );
        const found = res.data.find(
          (item) => item.productId === selectedProductDetails._id
        );
        setIsFavorite(!!found);
      } catch (error) {
        console.error("Error checking favorites:", error);
      }
    };

    checkFavorite();
  }, [selectedProductDetails, userId]);

  useEffect(() => {
    const registerView = async () => {
      if (userId && selectedProductDetails?._id) {
        try {
          await axios.post(`${API_BASE_URL}/user/${userId}/viewed`, {
            productId: selectedProductDetails._id,
          });
        } catch (error) {
          console.error("❌ Error registering view:", error);
        }
      }
    };

    registerView();
  }, [selectedProductDetails, userId]);

  const toggleFavorite = async () => {
    if (!selectedProductDetails || !userId) return;

    try {
      if (isFavorite) {
        await axios.delete(
          `${API_BASE_URL}/user/${userId}/favorites/${selectedProductDetails._id}`
        );
        setIsFavorite(false);
        if (onFavoriteToggle) {
          onFavoriteToggle(selectedProductDetails._id, false);
        }
      } else {
        let offer = null;
        if (
          selectedProductDetails.offer &&
          new Date(selectedProductDetails.offer.expiresAt) > new Date()
        ) {
          offer = {
            discountPercentage: selectedProductDetails.offer.discountPercentage,
            expiresAt: selectedProductDetails.offer.expiresAt,
          };
        }

        const favoriteItem = {
          productId: selectedProductDetails._id,
          title: selectedProductDetails.title,
          image: selectedMainImage,
          color: selectedColorName,
          price: selectedProductDetails.price,
          shopId: typeof shopId === "object" ? shopId._id : shopId,
          offer,
        };

        await axios.post(
          `${API_BASE_URL}/user/${userId}/favorites`,
          favoriteItem
        );
        setIsFavorite(true);
        if (onFavoriteToggle) {
          onFavoriteToggle(selectedProductDetails._id, true);
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.alertContainer}>
          {Array.isArray(selectedColorImages) &&
            selectedColorImages.length > 0 && (
              <View style={styles.leftGalleryColumn}>
                {selectedColorImages.map((img, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedMainImage(img)}
                  >
<Image
  source={{
    uri: img?.startsWith("http")
      ? img
      : `${SELLER_API_BASE_URL}${img.startsWith("/") ? "" : "/"}${img}`,
  }}
  style={styles.galleryImage}
/>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          <View style={styles.detailContent}>
            {selectedMainImage && (
              <Image
  source={{
    uri: selectedMainImage?.startsWith("http")
      ? selectedMainImage
      : `${SELLER_API_BASE_URL}${selectedMainImage.startsWith("/") ? "" : "/"}${selectedMainImage}`,
  }}
  style={styles.mainAlertImage}
/>

            )}

            <Text style={styles.productName} numberOfLines={9}>
              {selectedProductDetails?.title || "No Title"}
            </Text>

            <Text style={{ fontWeight: "bold", fontSize: 15, marginTop: 10 }}>
              Color: {selectedColorName}
            </Text>
            {(() => {
              const selectedColor = selectedProductDetails?.colors?.find(
                (c) => c.name === selectedColorName
              );
              const isSelectedColorSoldOut =
                Array.isArray(selectedColor?.sizes) &&
                selectedColor.sizes.length > 0 &&
                selectedColor.sizes.every((s) => s.stock === 0);

              return isSelectedColorSoldOut ? (
                <Text style={{ color: "red", fontSize: 14, marginTop: 4 }}>
                  Sold Out!
                </Text>
              ) : null;
            })()}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.colorScroll}
            >
              {selectedProductDetails?.colors?.map((c, i) => (
                <TouchableOpacity
                  key={`${c.name}_${i}`}
                  onPress={() => {
                    setSelectedColorName(c.name);
                    setSelectedColorImages(c.images || []);
                    setSelectedMainImage(
                      c.previewImage ||
                        c.images?.[0] ||
                        selectedProductDetails.MainImage
                    );
                    setLocalSelectedSize(null);
                  }}
                >
                  <Image
  source={{
    uri: c.previewImage?.startsWith("http")
      ? c.previewImage
      : `${SELLER_API_BASE_URL}${c.previewImage.startsWith("/") ? "" : "/"}${c.previewImage}`,
  }}
  style={styles.colorPreview}
/>

                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.productPrice}>
              {hasValidOffer ? (
                <View style={{ alignItems: "flex-start", marginTop: 10 }}>
                  <Text style={styles.originalPrice}>
                    ILS {selectedProductDetails.price}
                  </Text>
                  <Text style={styles.discountedPrice}>
                    ILS {discountedPrice}
                  </Text>
                </View>
              ) : (
                `${selectedProductDetails?.price || "No Price"} ILS`
              )}
            </Text>

            <Text style={{ fontWeight: "bold", fontSize: 15, marginTop: 10 }}>
              Size:
            </Text>
            <View style={styles.sizesContainer}>
              {sizes.length > 0 ? (
                sizes.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    disabled={s.stock === 0}
                    style={[
                      styles.sizeBox,
                      s.stock === 0 && { backgroundColor: "#ccc" },
                      localSelectedSize === s.size && styles.selectedSizeBox,
                    ]}
                    onPress={() => setLocalSelectedSize(s.size)}
                  >
                    <Text
                      style={[
                        styles.sizeText,
                        s.stock === 0 && {
                          textDecorationLine: "line-through",
                          color: "#777",
                        },
                        localSelectedSize === s.size && styles.selectedSizeText,
                      ]}
                    >
                      {s.size}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ color: "#777" }}>No sizes available</Text>
              )}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={() => {
                  if (
                    !selectedProductDetails ||
                    !selectedColorName ||
                    !localSelectedSize
                  ) {
                    alert("Please select product, color, and size.");
                    return;
                  }

                  const selectedColor = selectedProductDetails.colors.find(
                    (c) => c.name === selectedColorName
                  );

                  const selectedSizeObject = selectedColor?.sizes?.find(
                    (s) => s.size === localSelectedSize
                  );
                  if (!selectedSizeObject || selectedSizeObject.stock === 0) {
                    alert("This size is out of stock.");
                    return;
                  }

                  const cartItem = {
                    productId: selectedProductDetails._id,
                    title: selectedProductDetails.title,
                    image: selectedMainImage,
                    price: selectedProductDetails.price,
                    selectedColor: selectedColorName,
                    selectedSize: localSelectedSize,
                    quantity: 1,
                    shopId: typeof shopId === "object" ? shopId._id : shopId,
                    offer:
                      selectedProductDetails.offer &&
                      new Date(selectedProductDetails.offer.expiresAt) >
                        new Date()
                        ? selectedProductDetails.offer
                        : null,
                  };

                  onAddToCart(cartItem);
                  onClose();
                }}
              >
                <Text style={styles.addToCartText}>Add to cart</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleFavorite}>
                <Image
                  source={
                    isFavorite
                      ? require("../assets/img/BlackFullHeart.png")
                      : require("../assets/img/BlackHeart.png")
                  }
                  style={[
                    styles.heartIcon,
                    isFavorite ? styles.heartFavorite : styles.heartNotFavorite,
                  ]}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    width: "90%",
    maxHeight: "90%",
    borderRadius: 10,
    padding: 15,
  },
  mainAlertImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    resizeMode: "contain",
    marginBottom: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e53935",
    marginBottom: 10,
  },
  leftGalleryColumn: {
    width: 80,
    marginRight: 10,
    alignItems: "center",
  },
  galleryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  detailContent: {
    flex: 1,
  },
  sizesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10,
  },
  sizeBox: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: "#eee",
  },
  sizeText: {
    fontSize: 14,
    color: "#000",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  addToCartButton: {
    backgroundColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: 220,
    alignItems: "center",
    right: 10,
    height: 40,
  },
  addToCartText: {
    color: "#fff",
    fontWeight: "bold",
  },
  colorScroll: {
    marginVertical: 10,
  },
  colorPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 5,
  },
  cancelButton: {
    backgroundColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  selectedSizeBox: {
    backgroundColor: "#000",
  },
  selectedSizeText: {
    color: "#fff",
  },
  heartFavorite: {
    width: 35,
    height: 35,
    zIndex: 1000,
  },
  heartNotFavorite: {
    width: 28,
    height: 25,
    zIndex: 1000,
  },
  originalPrice: {
    textDecorationLine: "line-through",
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  discountedPrice: {
    color: "#e53935",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProductDetails;

import React from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import EditColorModal from "../MainScreen/EditColorModal";
import AddColorModal from "../MainScreen/AddColorModal";
import { API_BASE_URL } from "../../config";
import { Image as ExpoImage } from 'expo-image';

const ProductDetails = ({
  visible,
  product,
  selectedColorName,
  selectedColorImages,
  selectedMainImage,
  onClose,
  setShowAddColorModal,
  setSelectedColorName,
  setSelectedMainImage,
  setSelectedColorImages,
  setSelectedProductDetails,
  handleAddImage,
  handleDeleteGalleryImage,
  handleDeletePreviewImage,
  setColorModalVisible,
  setColorForm,
  setShowDetailModal,
  showAddColorModal,
  selectedProductDetails,
  pickPreviewImage,
  pickColorImages,
  handleDeleteColorImage,
  addSizeToColor,
  validateColorFields,
  handleSaveProduct,
  onCancel,
  selectedCategory,
  fetchCategoriesWithProducts,
  newColor,
  newSize,
  newStock,
  colorErrors,
  setNewColor,
  setNewSize,
  setNewStock,
  setColorErrors,
  colorModalVisible,
  colorForm,
  colorFormErrors,
  setColorFormErrors,
  validateEditColorFields,
  setProductsByCategory,
  userId,
}) => {
  const handleAddNewColor = (newColor) => {
    setSelectedProductDetails((prevDetails) => ({
      ...prevDetails,
      colors: [...(prevDetails.colors || []), newColor],
    }));
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertContainer}>
            {/* Left Gallery Column */}
            {selectedColorName &&
              selectedProductDetails?.colors?.find(
                (c) => c.name === selectedColorName
              ) && (
                <View style={styles.leftGalleryColumn}>
                  {(() => {
                    const currentColor = selectedProductDetails?.colors?.find(
                      (c) => c.name === selectedColorName
                    );
                    const preview = currentColor?.previewImage;
                    const rest =
                      currentColor?.images?.filter((img) => img !== preview) ||
                      [];
                    const orderedImages = preview ? [preview, ...rest] : rest;

                    return orderedImages.map((img, index) => (
                      <View key={index} style={styles.galleryImageWrapper}>
                        <TouchableOpacity
                          onPress={() => setSelectedMainImage(img)}
                        >
                          <ExpoImage
                            source={{
                              uri: img?.startsWith("http")
                                ? img
                                : `${API_BASE_URL}${img}`,
                            }}
                            style={styles.galleryImage}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteGalleryImage(img)}
                        >
                          <Text style={styles.deleteText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ));
                  })()}
                  {selectedColorImages.length < 6 && (
                    <TouchableOpacity
                      style={styles.addImageBtn}
                      onPress={handleAddImage}
                    >
                      <Text style={styles.addImageText}>＋</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

            {/* Right Side Content */}
            <View style={styles.detailContent}>
              <TouchableOpacity
                onPress={() => {
                  const selectedColor = selectedProductDetails?.colors?.find(
                    (c) => c.name === selectedColorName
                  );

                  const fullImage =
                    selectedMainImage === selectedColor?.previewImage
                      ? selectedColor?.originalPreviewImage
                      : selectedColor?.originalImages?.[
                          selectedColor?.images.indexOf(selectedMainImage)
                        ];

                  if (fullImage) {
                    // Show original image in modal
                    setFullImageModalUrl(fullImage); // create state for this
                    setShowFullImageModal(true);
                  }
                }}
              >
                <ExpoImage
                  source={{
                    uri: selectedMainImage?.startsWith("http")
                      ? selectedMainImage
                      : `${API_BASE_URL}${selectedMainImage}`,
                  }}
                  style={styles.mainAlertImage}
                />
              </TouchableOpacity>

              <Text style={styles.productName}>
                {selectedProductDetails?.title}
              </Text>
              {product?.offer &&
              new Date(product.offer.expiresAt) > new Date() ? (
                <>
                  <Text
                    style={{
                      textDecorationLine: "line-through",
                      color: "gray",
                    }}
                  >
                    {product?.price} ILS
                  </Text>
                  <Text style={styles.productPrice}>
                    {(
                      product.price *
                      (1 - product.offer.discountPercentage / 100)
                    ).toFixed(2)}{" "}
                    ILS
                  </Text>
                </>
              ) : (
                <Text style={styles.productPrice}>{product?.price} ILS</Text>
              )}

              <TouchableOpacity
                onPress={() => setShowAddColorModal(true)}
                style={styles.addColorBtn}
              >
                <Text style={styles.addColorText}>＋ Add Color Image Set</Text>
              </TouchableOpacity>

              {selectedColorName && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginVertical: 5,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "bold" }}>
                    Color: {selectedColorName}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      const selectedColor = selectedProductDetails.colors.find(
                        (c) => c.name === selectedColorName
                      );
                      if (selectedColor) {
                        setColorForm({
                          name: selectedColor.name,
                          previewImage: selectedColor.previewImage,
                          images: selectedColor.images,
                          sizes: selectedColor.sizes,
                        });
                        setColorModalVisible(true);
                      }
                    }}
                    style={{ marginLeft: 10 }}
                  >
                    <ExpoImage
                      source={require("../../assets/img/Edit.png")}
                      style={{ width: 15, height: 15 }}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Preview images for color options */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginVertical: 10,
                }}
              >
                {selectedProductDetails?.colors?.map((c, i) => (
                  <View
                    key={`${c.name}_${c.previewImage}_${i}`}
                    style={styles.imageContainer}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedColorName(c.name);
                        setSelectedMainImage(c.previewImage);
                        setSelectedColorImages(c.images);
                        setSelectedProductDetails((prev) => ({
                          ...prev,
                          sizes: c.sizes || [],
                        }));
                      }}
                    >
                      <ExpoImage
                        source={{
                          uri: c.previewImage?.startsWith("http")
                            ? c.previewImage
                            : `${API_BASE_URL}${c.previewImage}`,
                        }}
                        style={[
                          styles.circularImage,
                          selectedProductDetails?.colors?.length > 6 && {
                            width: 45,
                            height: 45,
                            borderRadius: 22.5,
                          },
                        ]}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeletePreviewImage(c)}
                    >
                      <Text style={styles.deleteText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Sizes */}
              <Text style={{ fontWeight: "bold", fontSize: 15 }}>Size:</Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginVertical: 10,
                }}
              >
                {selectedProductDetails?.sizes?.map((s, i) => {
                  const isCompact = selectedProductDetails?.sizes?.length > 6;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.sizeBox,
                        isCompact && {
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: 4,
                        },
                        s.stock === 0 && { backgroundColor: "#77BBA2" },
                      ]}
                    >
                      <Text
                        style={[styles.sizeText, isCompact && { fontSize: 12 }]}
                      >
                        {s.size} ({s.stock})
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDetailModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            {showAddColorModal && (
              <AddColorModal
                visible={showAddColorModal}
                onCancel={() => setShowAddColorModal(false)}
                newColor={newColor}
                newSize={newSize}
                newStock={newStock}
                colorErrors={colorErrors}
                setNewColor={setNewColor}
                setNewSize={setNewSize}
                setNewStock={setNewStock}
                setColorErrors={setColorErrors}
                pickPreviewImage={pickPreviewImage("add")}
                pickColorImages={pickColorImages}
                handleDeleteColorImage={handleDeleteColorImage}
                addSizeToColor={addSizeToColor}
                validateColorFields={validateColorFields}
                handleSaveColor={handleSaveProduct}
                selectedProductDetails={selectedProductDetails}
                selectedCategory={selectedCategory}
                setSelectedProductDetails={setSelectedProductDetails}
                setSelectedColorName={setSelectedColorName}
                setSelectedMainImage={setSelectedMainImage}
                setSelectedColorImages={setSelectedColorImages}
                setShowAddColorModal={setShowAddColorModal}
                fetchCategoriesWithProducts={fetchCategoriesWithProducts}
                userId={userId}
                setProductsByCategory={setProductsByCategory}
              />
            )}
            {colorModalVisible && (
              <EditColorModal
                visible={colorModalVisible}
                colorForm={colorForm}
                setColorForm={setColorForm}
                colorFormErrors={colorFormErrors}
                setColorFormErrors={setColorFormErrors}
                pickPreviewImage={pickPreviewImage("edit")}
                validateEditColorFields={validateEditColorFields}
                selectedProductDetails={selectedProductDetails}
                setSelectedProductDetails={setSelectedProductDetails}
                selectedCategory={selectedCategory}
                selectedColorName={selectedColorName}
                setSelectedColorImages={setSelectedColorImages}
                setSelectedMainImage={setSelectedMainImage}
                setColorModalVisible={setColorModalVisible}
                setSelectedColorName={setSelectedColorName}
                setColorErrors={setColorErrors}
                userId={userId}
                setProductsByCategory={setProductsByCategory}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
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
    maxHeight: "95%",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  mainAlertImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    marginBottom: 10,
    resizeMode: "contain",
  },
  productName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  productPriceAlert: {
    color: "#e53935",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: "600",
    color: "#e53935",
    marginBottom: 20,
  },
  galleryColumn: {
    marginRight: 10,
    justifyContent: "flex-start",
  },
  imageContainer: {
    position: "relative",
    marginBottom: 10,
    marginRight: 10,
  },
  circularImage: {
    width: 60,
    height: 60,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  deleteButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#000",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  deleteText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 16,
  },
  sizeBox: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: "#eee",
  },
  sizeText: {
    fontSize: 14,
    color: "#000",
  },
  cancelButton: {
    backgroundColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  galleryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginVertical: 10,
  },

  galleryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },

  leftGalleryColumn: {
    width: 80,
    alignItems: "center",
    marginRight: 10,
  },

  galleryImageWrapper: {
    marginBottom: 10,
    position: "relative",
  },

  addImageBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },

  addImageText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
  },

  detailContent: {
    flex: 1,
  },
});
export default ProductDetails;

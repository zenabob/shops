import React from "react";
import { ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from "react-native";
import axios from "axios";
import { Alert } from "react-native";
import {API_BASE_URL} from "../../config";
const AddColorModal = ({
  visible,
  newColor,
  newSize,
  newStock,
  colorErrors,
  setNewColor,
  setNewSize,
  setNewStock,
  setColorErrors,
  pickPreviewImage,
  pickColorImages,
  handleDeleteColorImage,
  addSizeToColor,
  validateColorFields,
  handleSaveColor,
  onCancel,
  selectedProductDetails,
  selectedCategory,
  setSelectedProductDetails,
  setSelectedColorName,
  setSelectedMainImage,
  setSelectedColorImages,
  setShowAddColorModal,
  fetchCategoriesWithProducts,
  userId,
}) => {
  console.log("AddColorModal visible prop:", visible);
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" ? "padding" : "height"}
                  style={{ flex: 1 }}
        >
        <View style={styles.modalOverlay}>
          <View style={styles.editingModal}>
            <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false} 
                            keyboardShouldPersistTaps="handled"
                          >
            <Text style={{ fontWeight: "bold", marginTop: 10 }}>
              Color name
            </Text>
            <TextInput
              placeholder="Color Name"
              style={styles.modalInput}
              value={newColor.name}
              onChangeText={(text) => {
                setNewColor((prev) => ({ ...prev, name: text }));
                if (colorErrors.name !== "") {
                  setColorErrors((prev) => ({
                    ...prev,
                    name: "",
                  }));
                }
              }}
            />
            {colorErrors.name !== "" && (
              <Text style={{ color: "red", fontSize: 12 }}>
                {colorErrors.name}
              </Text>
            )}

            <TouchableOpacity onPress={pickPreviewImage}>
              <Text style={{ color: "blue" }}>
                {newColor.previewImage
                  ? "Change Preview Image"
                  : "Pick Preview Image"}
              </Text>
            </TouchableOpacity>

            {newColor.previewImage && (
              <Image
  source={{
    uri: newColor.previewImage?.startsWith("http")
      ? newColor.previewImage
      : `${API_BASE_URL}${newColor.previewImage}`,
  }}
  style={{
    width: 60,
    aspectRatio: 3 / 4,
    marginVertical: 8,
    borderRadius: 4,
    resizeMode: "contain",
  }}
/>

            )}
            {colorErrors.previewImage !== "" && (
              <Text style={{ color: "red", fontSize: 12 }}>
                {colorErrors.previewImage}
              </Text>
            )}

            <TouchableOpacity
              onPress={pickColorImages}
              disabled={newColor.images.length >= 6}
            >
              <Text
                style={{
                  color: newColor.images.length >= 6 ? "gray" : "blue",
                }}
              >
                {newColor.images.length >= 6
                  ? "Max 6 images"
                  : "Pick Color Images"}
              </Text>
            </TouchableOpacity>
            {newColor.images.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginTop: 10,
                }}
              >
                {newColor.images.map((img, idx) => (
                  <View
                    key={idx}
                    style={{
                      position: "relative",
                      marginRight: 10,
                      marginBottom: 10,
                    }}
                  >
                    <Image
  source={{
    uri: img?.startsWith("http")
      ? img
      : `${API_BASE_URL}${img}`,
  }}
  style={{
    width: 70,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    aspectRatio: 3 / 4,
    resizeMode: "contain",
  }}
/>

                    <TouchableOpacity
                      onPress={() => handleDeleteColorImage(img)}
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        backgroundColor: "#000",
                        borderRadius: 12,
                        width: 24,
                        height: 24,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "bold",
                          fontSize: 16,
                        }}
                      >
                        ×
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {colorErrors.images !== "" && (
              <Text style={{ color: "red", fontSize: 12 }}>
                {colorErrors.images}
              </Text>
            )}

            {/* Sizes */}
            <Text style={{ fontWeight: "bold", marginTop: 10 }}>
              Sizes and Stock
            </Text>
            <View style={{ flexDirection: "row", marginBottom: 10 }}>
              <TextInput
                placeholder="Size"
                value={newSize}
                onChangeText={(text) => {
                  setNewSize(text);
                  if (colorErrors.newSize !== "") {
                    setColorErrors((prev) => ({
                      ...prev,
                      newSize: "",
                    }));
                  }
                }}
                style={[styles.modalInput, { flex: 1, marginRight: 5 }]}
              />
              <TextInput
                placeholder="Stock"
                value={newStock}
                onChangeText={(text) => {
                  setNewStock(text);
                  if (colorErrors.newStock !== "") {
                    setColorErrors((prev) => ({
                      ...prev,
                      newStock: "",
                    }));
                  }
                }}
                keyboardType="numeric"
                style={[styles.modalInput, { flex: 1, marginLeft: 5 }]}
              />
            </View>
            {(colorErrors.newSize ||
              colorErrors.newStock ||
              colorErrors.sizes) !== "" && (
              <View style={{ marginTop: 5 }}>
                {colorErrors.newSize !== "" && (
                  <Text style={{ color: "red", fontSize: 12 }}>
                    {colorErrors.newSize}
                  </Text>
                )}
                {colorErrors.newStock !== "" && (
                  <Text style={{ color: "red", fontSize: 12 }}>
                    {colorErrors.newStock}
                  </Text>
                )}
                {colorErrors.sizes !== "" && (
                  <Text style={{ color: "red", fontSize: 12 }}>
                    {colorErrors.sizes}
                  </Text>
                )}
              </View>
            )}
            <View>
              {newColor.sizes.map((s, idx) => (
                <Text key={idx}>
                  {s.size} - {s.stock} pcs
                </Text>
              ))}
            </View>
            <TouchableOpacity
              onPress={addSizeToColor}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Add Size</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={async () => {
                const isValid = validateColorFields();
                if (!isValid) return;

                try {
                  const updatedColors = [
                    ...(selectedProductDetails.colors || []),
                    newColor,
                  ];

                  const formData = new FormData();
                  formData.append("title", selectedProductDetails.title);
                  formData.append("price", selectedProductDetails.price);
                  formData.append("colors", JSON.stringify(updatedColors));
                  formData.append(
                    "images",
                    JSON.stringify(selectedProductDetails.images || [])
                  );
                  formData.append(
                    "sizes",
                    JSON.stringify(selectedProductDetails.sizes || [])
                  );

                  await axios.put(
                    `${API_BASE_URL}/profile/${userId}/category/${selectedCategory}/product/${selectedProductDetails._id}`,
                    formData,
                    {
                      headers: {
                        "Content-Type": "multipart/form-data",
                      },
                    }
                  );

                  // 🟢 Now make sure ProductDetails shows the new color info
                  setSelectedColorName(newColor.name);
                  setSelectedMainImage(newColor.previewImage);
                  setSelectedColorImages(newColor.images);
                  setSelectedProductDetails((prev) => ({
                    ...prev,
                    colors: updatedColors,
                    sizes: newColor.sizes, // 🟢 Add this so sizes show up too
                  }));

                  setShowAddColorModal(false);
                  setNewColor({
                    name: "",
                    previewImage: null,
                    images: [],
                    sizes: [],
                  });

                  await fetchCategoriesWithProducts();
                } catch (err) {
                  console.error("Error saving color set:", err);
                  Alert.alert("Error", "Something went wrong");
                }
              }}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowAddColorModal(false);
                setNewColor({
                  name: "",
                  previewImage: null,
                  images: [],
                  sizes: [],
                });
                setNewSize("");
                setNewStock("");
                setColorErrors({
                  name: "",
                  previewImage: "",
                  images: "",
                  sizes: "",
                });
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  editingModal: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
    maxWidth: 400,
  },
  modalInput: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#899499",
    borderRadius: 5,
    padding: 10,
    marginVertical: 8,
    backgroundColor: "#EEEEEE",
  },
  saveButton: {
    backgroundColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
});
export default AddColorModal;

import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import axios from "axios";
import { Alert } from "react-native";
import {API_BASE_URL} from "../../config";

const EditColorModal = ({
  visible,
  colorForm,
  colorFormErrors,
  setColorForm,
  setColorFormErrors,
  pickPreviewImage,
  validateEditColorFields,
  selectedProductDetails,
  setColorModalVisible,
  selectedCategory,
  setSelectedProductDetails,
  selectedColorName,
  setSelectedColorImages,
  setSelectedMainImage,
  setColorErrors,
  setSelectedColorName,
  setProductsByCategory,
  userId,
}) => {
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
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 18,
                    marginBottom: 10,
                  }}
                >
                  Edit Color
                </Text>

                {/* Color Name Input */}
                <Text style={{ fontWeight: "bold" }}>Color Name</Text>
                <TextInput
                  placeholder="Color Name"
                  value={colorForm.name}
                  style={styles.modalInput}
                  onChangeText={(text) => {
                    setColorForm((prev) => ({ ...prev, name: text }));
                    if (colorFormErrors.name) {
                      setColorFormErrors((prev) => ({
                        ...prev,
                        name: "",
                      }));
                    }
                  }}
                />
                {colorFormErrors.name !== "" && (
                  <Text style={styles.errorText}>{colorFormErrors.name}</Text>
                )}
                {/* Preview Image Picker */}
                <Text style={{ fontWeight: "bold", marginTop: 10 }}>
                  Preview Image
                </Text>
                <TouchableOpacity onPress={pickPreviewImage}>
                  <Text style={{ color: "blue" }}>
                    {colorForm.previewImage
                      ? "Change Preview Image"
                      : "Pick Preview Image"}
                  </Text>
                </TouchableOpacity>

                {colorForm.previewImage && (
                  <Image
                    source={{ uri: colorForm.previewImage }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 5,
                      marginVertical: 8,
                    }}
                  />
                )}
                {colorFormErrors.previewImage !== "" && (
                  <Text style={styles.errorText}>
                    {colorFormErrors.previewImage}
                  </Text>
                )}
                {/* Sizes + Add Button */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 10,
                    marginBottom: 5,
                  }}
                >
                  <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                    Sizes and Stock
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setColorForm((prev) => ({
                        ...prev,
                        sizes: [...prev.sizes, { size: "", stock: "" }],
                      }))
                    }
                  >
                    <Text style={{ fontSize: 24, marginLeft: 8 }}>＋</Text>
                  </TouchableOpacity>
                </View>
                {colorFormErrors.sizes !== "" && (
                  <Text
                    style={{
                      color: "red",
                      fontSize: 12,
                      marginBottom: 5,
                    }}
                  >
                    {colorFormErrors.sizes}
                  </Text>
                )}

                {colorForm.sizes.map((s, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <TextInput
                      value={s.size}
                      placeholder="Size"
                      style={[styles.modalInput, { flex: 1, marginRight: 5 }]}
                      onChangeText={(text) => {
                        const updated = [...colorForm.sizes];
                        updated[idx].size = text;
                        setColorForm((prev) => ({
                          ...prev,
                          sizes: updated,
                        }));
                        setColorFormErrors((prev) => ({
                          ...prev,
                          sizes: "",
                        })); // clear error
                      }}
                    />
                    <TextInput
                      value={String(s.stock)}
                      placeholder="Stock"
                      keyboardType="numeric"
                      style={[styles.modalInput, { flex: 1, marginLeft: 5 }]}
                      onChangeText={(text) => {
                        const updated = [...colorForm.sizes];
                        updated[idx].stock = text;
                        setColorForm((prev) => ({
                          ...prev,
                          sizes: updated,
                        }));
                        setColorErrors((prev) => ({
                          ...prev,
                          sizes: "",
                        }));
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        if (colorForm.sizes.length <= 1) {
                          setColorFormErrors((prev) => ({
                            ...prev,
                            sizes: "You must keep at least one size",
                          }));
                          return;
                        }
                        const updated = colorForm.sizes.filter(
                          (_, i) => i !== idx
                        );
                        setColorForm((prev) => ({
                          ...prev,
                          sizes: updated,
                        }));
                      }}
                      style={{
                        backgroundColor: "red",
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 6,
                        marginLeft: 5,
                      }}
                    >
                      <Text style={{ color: "white", fontWeight: "bold" }}>
                        ×
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Save Button */}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={async () => {
                    console.log("Save button pressed ✅");
                    const isValid = validateEditColorFields();
                    console.log("Validation result:", isValid);
                    if (!isValid) {
                      console.log("Validation failed ❌");
                      return;
                    }
                    console.log("Validation passed ✅");

                    try {
                      const updatedColors = selectedProductDetails.colors.map(
                        (c) => (c.name === selectedColorName ? colorForm : c)
                      );

                      const formData = new FormData();
                      formData.append("title", selectedProductDetails.title);
                      formData.append("price", selectedProductDetails.price);
                      formData.append(
                        "images",
                        JSON.stringify(selectedProductDetails.images || [])
                      );
                      formData.append("colors", JSON.stringify(updatedColors));
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

                      setSelectedProductDetails((prev) => ({
                        ...prev,
                        colors: updatedColors,
                        sizes:
                          selectedColorName === colorForm.name
                            ? colorForm.sizes || []
                            : prev.sizes,
                      }));
                      setProductsByCategory((prev) => {
                        const updated = { ...prev };
                        const products = [...(updated[selectedCategory] || [])];
                        const index = products.findIndex(
                          (p) => p._id === selectedProductDetails._id
                        );

                        if (index !== -1) {
                          products[index] = {
                            ...products[index],
                            colors: updatedColors,
                            sizes:
                              selectedColorName === colorForm.name
                                ? colorForm.sizes
                                : products[index].sizes,
                          };
                          updated[selectedCategory] = products;
                        }

                        return updated;
                      });

                      if (selectedColorName !== colorForm.name) {
                        setSelectedColorName(colorForm.name);
                      }

                      if (selectedColorName === colorForm.name) {
                        setSelectedMainImage(colorForm.previewImage);
                        setSelectedColorImages(colorForm.images || []);
                      }

                      setColorModalVisible(false);
                    } catch (err) {
                      console.error("Error saving color:", err);
                      Alert.alert("Failed to save color details");
                    }
                    await fetchCategoriesWithProducts();
                  }}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setColorModalVisible(false);
                    setColorFormErrors({
                      name: "",
                      previewImage: "",
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
  modalInput: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#899499",
    borderRadius: 5,
    padding: 10,
    marginVertical: 8,
    backgroundColor: "#EEEEEE",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 2,
    marginBottom: 5,
  },
});

export default EditColorModal;

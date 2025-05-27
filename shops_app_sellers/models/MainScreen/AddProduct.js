// AddProduct.js
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  StyleSheet,
} from "react-native";
const AddProduct = ({
    visible,
    selectedCategory,
    newProduct,
    onPickImage,
    onChangeField,
    onCancel,
    onSave,
    errors,
    
  }) => {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.editingModal}>
              <Text style={styles.title}>Add Product to {selectedCategory}</Text>
  
              <Text style={styles.label}>Image</Text>
              <TouchableOpacity onPress={onPickImage}>
                <Text style={{ color: "blue" }}>
                  {newProduct.image ? "Change Image" : "Pick Image"}
                </Text>
              </TouchableOpacity>
              {errors?.image !== "" && (
                <Text style={styles.errorText}>{errors.image}</Text>
              )}
  
              {newProduct.image && (
                <Image
                  source={{ uri: newProduct.image }}
                  style={{
                    width: 100,
                    height: 100,
                    marginVertical: 10,
                    borderRadius: 8,
                  }}
                />
              )}
  
              <Text style={styles.label}>The name of product</Text>
              <TextInput
                placeholder="Product Title"
                style={styles.modalInput}
                value={newProduct.title}
                onChangeText={(text) => onChangeField("title", text)}
              />
              {errors?.title !== "" && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
  
              <Text style={styles.label}>Price</Text>
              <TextInput
                placeholder="Product Price"
                style={styles.modalInput}
                keyboardType="numeric"
                value={newProduct.price}
                onChangeText={(text) => onChangeField("price", text)}
              />
              {errors?.price !== "" && (
                <Text style={styles.errorText}>{errors.price}</Text>
              )}
  
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
  
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
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
  label: {
    fontWeight: "bold",
    marginBottom: 4,
    marginTop: 10,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 2,
    marginBottom: 5,
  },
  saveButton: {
    backgroundColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginLeft: 5,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
});

export default AddProduct;

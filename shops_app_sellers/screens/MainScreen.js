import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import {
  Modal,
  FlatList,
  Alert,
  Pressable,
  Animated,
  Easing,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

import axios from "axios";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import EditShopInfoModal from "../models/MainScreen/EditShopInfoModal.js"; // Adjust path as needed
import AddProduct from "../models/MainScreen/AddProduct";
import ProductDetails from "../models/MainScreen/productDetails.js";
import AddColorModal from "../models/MainScreen/AddColorModal";
import { API_BASE_URL } from "../config";

const DEFAULT_LOGO = require("../assets/img/default_Profile__picture.png");
const DEFAULT_COVER = require("../assets/img/cover_image.png");
const DELETE_ICON = require("../assets/img/delete.png");
const MENU_ICON = require("../assets/img/SideMenu.png");
const CATEGORY_OPTIONS = [
  "Kid's clothes",
  "Men’s set",
  "Men’s bottom",
  "Men’s shirt",
  "Women’s shoes",
  "Women’s sport shoes",
  "Formal men’s shoes",
  "Kid's shoes",
  "Women’s set",
  "Women’s blouse",
  "Women’s shirt",
  "Dress",
  "Women’s bottom",
  "Men’s shoes",
  "Skirt",
  "Women’s set",
];

const ShopProfileScreen = () => {
  const [errors, setErrors] = useState({ title: "", price: "", image: "" });
  const { showActionSheetWithOptions } = useActionSheet();
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [productsByCategory, setProductsByCategory] = useState({});
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [selectedColorName, setSelectedColorName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null); // category being edited
  const [editedCategoryName, setEditedCategoryName] = useState(""); // new value
  const [selectedMainImage, setSelectedMainImage] = useState("");
  const [showAddColorModal, setShowAddColorModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const [shopData, setShopData] = useState({
    name: "",
    location: "",
    logo: null,
    cover: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [draftShopData, setDraftShopData] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editErrors, setEditErrors] = useState({ name: "", location: "" });
  const [editing, setEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedColorImages, setSelectedColorImages] = useState([]);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [newSize, setNewSize] = useState("");
  const [newStock, setNewStock] = useState("");
  const [modalOpacity] = useState(new Animated.Value(0));
  const [colorErrors, setColorErrors] = useState({
    name: "",
    previewImage: "",
    images: "",
    sizes: "",
    newSize: "",
    newStock: "",
  });
  const [newProduct, setNewProduct] = useState({
    title: "",
    price: "",
    image: null,
  });
  const [colorForm, setColorForm] = useState({
    name: "",
    previewImage: null,
    images: [],
    sizes: [{ size: "", stock: "" }],
  });
  const [colorFormErrors, setColorFormErrors] = useState({
    name: "",
    previewImage: "",
    sizes: "",
  });
  const [newColor, setNewColor] = useState({
    name: "",
    previewImage: null,
    images: [],
    sizes: [],
  });
  const [userId, setUserId] = useState(null);
  const navigation = useNavigation();
  // Load userId once
  useEffect(() => {
    const loadUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      setUserId(id);
    };
    loadUserId();
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchShopData();
    fetchCategories();
    fetchCategoriesWithProducts();
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchCategories();
        fetchCategoriesWithProducts();
        fetchShopData();
      }
    }, [userId])
  );
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      fetchCategoriesWithProducts();
    }, 1000);

    return () => clearInterval(interval);
  }, [userId]);

  const fetchShopData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/profile/${userId}`);
      setShopData(res.data);
    } catch (err) {
      console.error("Error fetching shop data:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/profile/${userId}/category`);
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchCategoriesWithProducts = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/profile/${userId}/categories-with-products`
      );
      const result = {};
      res.data.forEach((category) => {
        result[category.name] = category.products;
      });
      setProductsByCategory(result);
    } catch (err) {
      console.error("Error fetching categories with products:", err);
    }
  };

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        const mediaStatus =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!cameraStatus.granted || !mediaStatus.granted) {
          Alert.alert(
            "Sorry, we need camera and media permissions to make this work!"
          );
        }
      }
    })();
  }, []);
  const compressImage = async (uri) => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }], // Resize image (adjust width as needed)
      {
        compress: 0.6, // 0 to 1 (lower means more compression)
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return result.uri;
  };
  const uploadColorImage = async (uri) => {
    const formData = new FormData();
    formData.append("image", {
      uri,
      name: "color.jpg",
      type: "image/jpeg",
    });

    try {
      const res = await axios.post(
        `${API_BASE_URL}/profile/${userId}/upload-color`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return res.data.url; // ✅ must be a valid image URL
    } catch (err) {
      console.error("❌ Error uploading image:", err);
      return null;
    }
  };

  const pickPreviewImage =
    (mode = "add") =>
    async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;

        // Upload preview image like you do with color images
        const uploadedUrl = await uploadColorImage(uri); // ✅ Reuse your existing function

        if (!uploadedUrl) {
          Alert.alert("Failed to upload preview image");
          return;
        }

        if (mode === "add") {
          setNewColor((prev) => ({ ...prev, previewImage: uploadedUrl }));
          setColorErrors((prev) => ({ ...prev, previewImage: "" }));
        } else if (mode === "edit") {
          setColorForm((prev) => ({ ...prev, previewImage: uploadedUrl }));
          setColorFormErrors((prev) => ({ ...prev, previewImage: "" }));
        }
      }
    };

  const validateEditColorFields = () => {
    const errors = {
      name: "",
      previewImage: "",
      sizes: "",
    };

    let valid = true;
    const trimmedName = colorForm.name.trim();

    if (!trimmedName) {
      errors.name = "Color name is required";
      valid = false;
    } else {
      const nameAlreadyExists = selectedProductDetails.colors.some(
        (color) =>
          color.name.toLowerCase() === trimmedName.toLowerCase() &&
          color.name.toLowerCase() !== selectedColorName.toLowerCase() // exclude current
      );

      if (nameAlreadyExists) {
        errors.name = "This color name already exists";
        valid = false;
      }
    }

    if (!colorForm.previewImage) {
      errors.previewImage = "Preview image is required";
      valid = false;
    }

    // ✅ Check sizes array
    const sizes = colorForm.sizes;
    if (!sizes || sizes.length === 0) {
      errors.sizes = "At least one size is required";
      valid = false;
    } else {
      const seen = new Set();
      for (const s of sizes) {
        const size = s.size.trim().toUpperCase();
        const stock = s.stock;

        if (!size || !stock || isNaN(stock) || Number(stock) <= 0) {
          errors.sizes = "All sizes must have valid size and stock";
          valid = false;
          break;
        }

        if (seen.has(size)) {
          errors.sizes = `Duplicate size "${size}" is not allowed`;
          valid = false;
          break;
        }

        seen.add(size);
      }
    }

    setColorFormErrors(errors);
    return valid;
  };

  const validateColorFields = () => {
    const errors = {
      name: "",
      previewImage: "",
      images: "",
      sizes: "",
    };

    let isValid = true;

    const trimmedName = newColor.name.trim();

    if (!trimmedName) {
      errors.name = "Color name is required";
      isValid = false;
    } else {
      const colorAlreadyExists = (selectedProductDetails.colors || []).some(
        (c) =>
          typeof c.name === "string" &&
          c.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );

      if (colorAlreadyExists) {
        errors.name = "Color name already exists";
        isValid = false;
      }
    }

    if (!newColor.previewImage) {
      errors.previewImage = "Preview image is required";
      isValid = false;
    }

    if (newColor.images.length === 0) {
      errors.images = "At least one image is required";
      isValid = false;
    }

    if (newColor.sizes.length === 0) {
      errors.sizes = "Add at least one size";
      isValid = false;
    }

    setColorErrors(errors);
    return isValid;
  };

  const handleDeleteColorImage = (imageToDelete) => {
    setNewColor((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== imageToDelete),
    }));

    setColorErrors((prev) => ({
      ...prev,
      images: "",
    }));
  };

  const addSizeToColor = () => {
    const size = newSize.trim().toUpperCase(); // Normalize user input
    const stock = newStock.trim();
    let hasError = false;
    let errors = { ...colorErrors };

    // 1. Check if size is empty
    if (!size) {
      errors.newSize = "Size is required";
      hasError = true;

      // 2. ✅ Check if size already exists (case-insensitive)
    } else if (
      newColor.sizes.some((s) => s.size.trim().toUpperCase() === size)
    ) {
      errors.newSize = "This size already exists";
      hasError = true;
    }

    // 3. Validate stock
    if (!stock || isNaN(stock) || Number(stock) <= 0) {
      errors.newStock = "Enter a valid stock quantity";
      hasError = true;
    }

    // 4. Optional size limit
    if (newColor.sizes.length >= 7) {
      errors.sizes = "You can only add up to 7 sizes";
      hasError = true;
    }

    if (hasError) {
      setColorErrors(errors);
      return;
    }

    // 5. Save with normalized size
    const updatedSizes = [...newColor.sizes, { size, stock }];
    setNewColor((prev) => ({
      ...prev,
      sizes: updatedSizes,
    }));

    setNewSize("");
    setNewStock("");
    setColorErrors({ ...colorErrors, newSize: "", newStock: "", sizes: "" });
  };
  const handleDeleteGalleryImage = async (imageUrlToDelete) => {
    try {
      const productId = selectedProductDetails?._id;
      const encodedColor = encodeURIComponent(selectedColorName);

      // 1. Backend deletion
      await axios.delete(
        `${API_BASE_URL}/profile/${userId}/category/${selectedCategory}/product/${productId}/color/${encodedColor}/image`,
        {
          data: { imageUrl: imageUrlToDelete },
        }
      );

      // 2. Update image list in selectedColorImages
      const updatedImages = selectedColorImages.filter(
        (img) => img !== imageUrlToDelete
      );
      setSelectedColorImages(updatedImages);

      // 3. Update selectedProductDetails.colors in local state
      setSelectedProductDetails((prev) => ({
        ...prev,
        colors: prev.colors.map((c) =>
          c.name === selectedColorName ? { ...c, images: updatedImages } : c
        ),
      }));

      // 4. Handle main image switch if needed
      if (selectedMainImage === imageUrlToDelete) {
        setSelectedMainImage(
          updatedImages[0] || selectedProductDetails.MainImage || ""
        );
      }

      // Optional: Refresh category list
      await fetchCategoriesWithProducts();
    } catch (err) {
      console.error("Error deleting image from gallery:", err);
      Alert.alert("Failed to delete image from color");
    }
  };

  const handleDeletePreviewImage = async (colorToDelete) => {
    const colors = selectedProductDetails.colors || [];

    // Remove the color
    const updatedColors = colors.filter(
      (c) => c.previewImage !== colorToDelete.previewImage
    );

    // Choose next selected color (if any)
    const deletedIndex = colors.findIndex(
      (c) => c.previewImage === colorToDelete.previewImage
    );
    let nextSelectedColor = null;
    if (updatedColors.length > 0) {
      nextSelectedColor =
        updatedColors[deletedIndex] || updatedColors[deletedIndex - 1];
    }

    // ✅ Update local state
    setSelectedProductDetails((prev) => ({
      ...prev,
      colors: updatedColors,
      sizes: nextSelectedColor?.sizes || [],
    }));

    if (nextSelectedColor) {
      setSelectedColorName(nextSelectedColor.name);
      setSelectedColorImages(nextSelectedColor.images);
      setSelectedMainImage(nextSelectedColor.images[0]);
    } else {
      setSelectedColorName("");
      setSelectedColorImages([]);
      setSelectedMainImage(
        selectedProductDetails.MainImage ||
          selectedProductDetails.images?.[0] ||
          ""
      );
    }

    // ✅ Push the updated color list to backend
    try {
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

      await fetchCategoriesWithProducts(); // optional: refresh entire list if needed
    } catch (err) {
      console.error("Failed to save color deletion:", err);
      Alert.alert("Error deleting color");
    }
  };
  const openCategorySelector = () => {
    setShowCategorySelector(true);
    Animated.timing(modalOpacity, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeCategorySelector = () => {
    Animated.timing(modalOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowCategorySelector(false);
    });
  };

  const handleAddImage = async () => {
    if (selectedColorImages.length >= 7) {
      Alert.alert("You can only have up to 7 images per color.");
      return;
    }

    const options = ["Take Photo", "Choose from Gallery", "Cancel"];
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      { options, cancelButtonIndex },
      async (buttonIndex) => {
        let result;

        if (buttonIndex === 0) {
          result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
          });
        } else if (buttonIndex === 1) {
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
          });
        }

        if (result && !result.canceled) {
          const newImageUri = result.assets[0].uri;

          const updated = [...selectedColorImages, newImageUri];

          // 🔄 1. Update local state
          setSelectedColorImages(updated);

          // 🔄 2. Update local product state
          setSelectedProductDetails((prev) => ({
            ...prev,
            colors: prev.colors.map((c) =>
              c.name === selectedColorName ? { ...c, images: updated } : c
            ),
          }));

          try {
            // 🔄 3. Save to backend
            const formData = new FormData();
            formData.append("title", selectedProductDetails.title);
            formData.append("price", selectedProductDetails.price);
            formData.append(
              "images",
              JSON.stringify(selectedProductDetails.images || [])
            );
            formData.append(
              "colors",
              JSON.stringify(
                selectedProductDetails.colors.map((c) =>
                  c.name === selectedColorName ? { ...c, images: updated } : c
                )
              )
            );
            formData.append(
              "sizes",
              JSON.stringify(selectedProductDetails.sizes || [])
            );

            await axios.put(
              `${API_BASE_URL}/profile/${userId}/category/${selectedCategory}/product/${selectedProductDetails._id}`,
              formData,
              {
                headers: { "Content-Type": "multipart/form-data" },
              }
            );

            await fetchCategoriesWithProducts();
          } catch (err) {
            console.error("❌ Error saving added image:", err);
            Alert.alert("Failed to save image");
          }
        }
      }
    );
  };
  const handleUpdateCategory = async (oldCategoryName) => {
    const trimmed = editedCategoryName.trim();
    if (!trimmed) return Alert.alert("Category name cannot be empty");

    try {
      await axios.put(
        `${API_BASE_URL}/profile/${userId}/category/${oldCategoryName}`,
        {
          newName: trimmed,
        }
      );
      await fetchCategories();
      await fetchCategoriesWithProducts(); // Refresh updated list
      setEditingCategory(null);
      setEditedCategoryName("");
    } catch (err) {
      console.error("Error updating category:", err);
      Alert.alert("Something went wrong while updating the category");
    }
  };

  const handleEditProduct = (product, category) => {
    setSelectedCategory(category);
    setNewProduct({
      title: product.title,
      price: product.price.toString(),
      image: product.MainImage,
      id: product._id,
    });
    setShowProductModal(true);
  };

  const pickColorImages = async () => {
    const remainingSlots = 6 - newColor.images.length;

    if (remainingSlots <= 0) {
      Alert.alert("You can only upload up to 6 images for this color.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedAssets = result.assets.slice(0, remainingSlots);

      const uploads = await Promise.all(
        selectedAssets.map((asset) => uploadColorImage(asset.uri))
      );

      const validUploads = uploads.filter((url) => url !== null);

      const existing = new Set(newColor.images);
      const filtered = validUploads.filter((url) => !existing.has(url));

      console.log("✅ Filtered valid uploaded image URLs:", filtered);

      setNewColor((prev) => ({
        ...prev,
        images: [...prev.images, ...filtered],
      }));

      setColorErrors((prev) => ({ ...prev, images: "" }));
    }
  };

  const handleSave = async () => {
    const nameTrimmed = draftShopData.name?.trim();
    const locationTrimmed = draftShopData.location?.trim();

    const newErrors = {
      name: nameTrimmed === "" ? "Shop name is required." : "",
      location: locationTrimmed === "" ? "Location is required." : "",
    };

    setEditErrors(newErrors);

    // If any error exists, don't proceed
    if (newErrors.name || newErrors.location) return;

    try {
      await axios.put(`${API_BASE_URL}/profile/${userId}`, {
        name: nameTrimmed,
        location: locationTrimmed,
      });

      setShopData(draftShopData);
      setEditing(false);
      setDraftShopData(null);
      setEditErrors({ name: "", location: "" });
    } catch (err) {
      console.error("Error saving shop data:", err);
    }
  };
  const pickImage = async (type) => {
    const options = ["Take Photo", "Choose from Gallery", "Cancel"];
    const cancelButtonIndex = 2;
    showActionSheetWithOptions(
      { options, cancelButtonIndex },
      async (buttonIndex) => {
        let result;
        if (buttonIndex === 0) {
          result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
          });
        } else if (buttonIndex === 1) {
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
          });
        }
        if (result && !result.canceled) {
          uploadImage(result.assets[0].uri, type);
        }
      }
    );
  };

  const uploadImage = async (uri, type) => {
    const formData = new FormData();
    formData.append("image", { uri, name: `${type}.jpg`, type: "image/jpeg" });
    try {
      const res = await axios.post(
        `${API_BASE_URL}/profile/${userId}/upload-${type}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setShopData((prev) => ({ ...prev, [type]: res.data.url }));
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
    }
  };
  const handleDeleteCategory = async (category) => {
    try {
      const res = await axios.delete(
        `${API_BASE_URL}/profile/${userId}/category/${category}`
      );
      setCategories(res.data);
      await fetchCategoriesWithProducts();
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  const handleSaveProduct = async () => {
    if (isSaving) return;

    const newErrors = {
      title:
        newProduct.title.trim() === "" ? "Please enter a product name" : "",
      price: newProduct.price.trim() === "" ? "Please enter a price" : "",
      image: !newProduct.image ? "Please select an image" : "",
    };

    setErrors(newErrors);
    const hasErrors = Object.values(newErrors).some((err) => err !== "");
    if (hasErrors) return;

    try {
      setIsSaving(true);

      const formData = new FormData();
      formData.append("title", newProduct.title);
      formData.append("price", newProduct.price);
      formData.append("genderTarget", newProduct.genderTarget || "unisex");
      formData.append("category", selectedCategory);

      // Append image only if local
      if (newProduct.image && !newProduct.image.startsWith("http")) {
        formData.append("image", {
          uri: newProduct.image,
          name: "product.jpg",
          type: "image/jpeg",
        });
      }

      // Add extra structured fields
      formData.append("images", JSON.stringify(newProduct.images || []));
      formData.append("colors", JSON.stringify(newProduct.colors || []));
      formData.append("sizes", JSON.stringify(newProduct.sizes || []));
      formData.append("offer", JSON.stringify(newProduct.offer || {}));

      let response;
      if (newProduct.id) {
        // UPDATE existing
        response = await axios.put(
          `${API_BASE_URL}/profile/${userId}/category/${selectedCategory}/product/${newProduct.id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        // CREATE new
        response = await axios.post(
          `${API_BASE_URL}/profile/${userId}/category/${selectedCategory}/product`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }

      await fetchCategoriesWithProducts();
      setShowProductModal(false);
      setNewProduct({
        title: "",
        price: "",
        image: null,
        id: null,
        genderTarget: "",
        images: [],
        colors: [],
        sizes: [],
        offer: {
          discountPercentage: 0,
          expiresAt: "", // أو new Date().toISOString()
        },
      });

      setErrors({ title: "", price: "", image: "" });
    } catch (err) {
      console.error("Error saving product:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId, category) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/profile/${userId}/category/${category}/product/${productId}`
      );
      setProductsByCategory((prev) => ({
        ...prev,
        [category]: prev[category].filter((p) => p._id !== productId),
      }));
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };
  const handleViewDetails = (product) => {
    const safeProduct = {
      ...product,
      images:
        Array.isArray(product.images) && product.images.length > 0
          ? product.images
          : [product.image],
      colors: Array.isArray(product.colors) ? product.colors : [],
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
    };

    setSelectedProductDetails(safeProduct);

    // 🟢 Check if colors exist
    if (
      safeProduct.colors.length > 0 &&
      safeProduct.colors[0].images?.length > 0
    ) {
      setSelectedColorName(safeProduct.colors[0].name);
      setSelectedMainImage(safeProduct.colors[0].previewImage);
      setSelectedColorImages(safeProduct.colors[0].images);
      setSelectedProductDetails((prev) => ({
        ...prev,
        sizes: safeProduct.colors[0].sizes || [],
      }));
    } else {
      // 🛑 No colors: show product image, hide gallery and add image button
      setSelectedColorName("");
      setSelectedColorImages([]); // no gallery
      setSelectedMainImage(
        safeProduct.MainImage ||
          safeProduct.image ||
          safeProduct.images[0] ||
          ""
      );
    }

    setSelectedSize(null);
    setShowDetailModal(true);
  };

  const pickProductImage = () => {
    const options = ["Take Photo", "Choose from Gallery", "Cancel"];
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async (buttonIndex) => {
        let result;

        if (buttonIndex === 0) {
          result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
          });
        } else if (buttonIndex === 1) {
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
          });
        }

        if (result && !result.canceled) {
          const uri = result.assets[0].uri;

          // ✅ Set image and clear error
          setNewProduct((prev) => ({
            ...prev,
            image: uri,
          }));

          setErrors((prev) => ({
            ...prev,
            image: "", // ✅ clear the error message
          }));
        }
      }
    );
  };
  const handleAddCategory = async () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return Alert.alert("Please enter a category name");
    const exists = categories.some(
      (cat) => cat.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) return Alert.alert("This category already exists!");
    try {
      const res = await axios.post(
        `${API_BASE_URL}/profile/${userId}/category`,
        {
          category: trimmed,
        }
      );
      setCategories(res.data);
      setNewCategory("");
      setShowCategoryInput(false);
      await fetchCategoriesWithProducts();
    } catch (err) {
      console.error("Error saving category:", err);
    }
  };
  const handleAddProductToCategory = (category) => {
    setSelectedCategory(category);
    setShowProductModal(true);
    setNewProduct({ title: "", price: "", image: null });
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.background}>
          <View style={styles.container}>
            <TouchableOpacity onPress={() => pickImage("cover")}>
              <Image
                source={
                  shopData.cover
                    ? { uri: `${API_BASE_URL}${shopData.cover}` }
                    : DEFAULT_COVER
                }
                style={styles.cover}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => pickImage("logo")}>
              <Image
                source={
                  shopData.logo
                    ? { uri: `${API_BASE_URL}${shopData.logo}` }
                    : DEFAULT_LOGO
                }
                style={styles.logo}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.openDrawer()}
              style={{ left: 160, zIndex: 100 }}
            >
              <Image
                source={MENU_ICON}
                style={{
                  position: "absolute",
                  marginTop: -310,
                  left: 15,
                  width: 25,
                  height: 30,
                }}
              />
            </TouchableOpacity>
            <View style={{ alignItems: "center", marginTop: 10 }}>
              <Text style={styles.title}>{shopData.name}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  setDraftShopData({ ...shopData });
                  setEditing(true);
                }}
              >
                <Image
                  source={require("../assets/img/Edit.png")}
                  style={styles.editIcon}
                  resizeMode="contain"
                />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.plusBtn}
                onPress={openCategorySelector}
              >
                <Text style={styles.plusIcon}>＋</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.categoryWrapper}>
              <Modal
                visible={showCategorySelector}
                transparent
                animationType="none"
              >
                <Pressable
                  style={{
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.4)",
                    flex: 1,
                  }}
                  onPress={closeCategorySelector}
                >
                  <Animated.View
                    style={{
                      width: "80%",
                      maxHeight: "70%",
                      backgroundColor: "#fff",
                      padding: 20,
                      borderRadius: 20,
                      transform: [
                        {
                          translateY: modalOpacity.interpolate({
                            inputRange: [0, 1],
                            outputRange: [100, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "bold",
                        marginBottom: 20,
                        textAlign: "center",
                      }}
                    >
                      Choose Category
                    </Text>

                    <FlatList
                      data={CATEGORY_OPTIONS}
                      keyExtractor={(item, index) => index.toString()}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={{
                            paddingVertical: 15,
                            borderBottomWidth: 1,
                            borderBottomColor: "#eee",
                          }}
                          onPress={async () => {
                            const exists = categories.some(
                              (cat) => cat.toLowerCase() === item.toLowerCase()
                            );

                            if (exists) {
                              Alert.alert(
                                "Category Exists",
                                "This category already exists in your list."
                              );
                              return;
                            }

                            try {
                              const res = await axios.post(
                                `${API_BASE_URL}/profile/${userId}/category`,
                                {
                                  category: item,
                                }
                              );

                              setCategories(res.data);
                              await fetchCategoriesWithProducts();
                              closeCategorySelector();
                            } catch (err) {
                              console.error("Error saving category:", err);
                            }
                          }}
                        >
                          <Text style={{ fontSize: 18, color: "#000" }}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />

                    <TouchableOpacity
                      onPress={closeCategorySelector}
                      style={{ paddingVertical: 15 }}
                    >
                      <Text
                        style={{
                          textAlign: "center",
                          color: "red",
                          fontSize: 18,
                        }}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                </Pressable>
              </Modal>

              {/* {showCategoryInput && (
                <TextInput
                  style={styles.categoryInput}
                  placeholder="Enter category name"
                  placeholderTextColor="#999"
                  value={newCategory}
                  onChangeText={setNewCategory}
                  onSubmitEditing={handleAddCategory}
                />
              )} */}
              {categories.length > 0 && (
                <View style={styles.categoryList}>
                  {categories.map((category, index) => (
                    <View key={index} style={styles.categoryRow}>
                      <View style={styles.categoryRowContent}>
                        <Text style={styles.categoryText}>{category}</Text>

                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <TouchableOpacity
                            onPress={() => handleAddProductToCategory(category)}
                          >
                            <Text style={styles.plusIcon}>＋</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteCategory(category)}
                          >
                            <Image
                              source={DELETE_ICON}
                              style={styles.deleteIcon}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.categoryLine} />
                      <View style={styles.productList}>
                        {(productsByCategory[category] || []).map(
                          (product, i) => (
                            <TouchableOpacity
                              key={i}
                              style={styles.productCard}
                              onPress={() => {
                                handleViewDetails(product);
                                setSelectedCategory(category);
                              }}
                              activeOpacity={0.8}
                            >
                              <View style={styles.productCardHeader}>
                                <TouchableOpacity
                                  onPress={() =>
                                    handleEditProduct(product, category)
                                  }
                                >
                                  <Image
                                    source={require("../assets/img/Edit.png")}
                                    style={styles.iconSmallEdit}
                                  />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() =>
                                    handleDeleteProduct(product._id, category)
                                  }
                                >
                                  <Image
                                    source={require("../assets/img/delete.png")}
                                    style={styles.iconSmall}
                                  />
                                </TouchableOpacity>
                              </View>

                              <Image
  source={{
    uri: product.MainImage?.startsWith("http")
      ? product.MainImage
      : `${API_BASE_URL}${product.MainImage}`,
  }}
  style={styles.productImage}
/>

                              <Text
                                style={styles.productTitle}
                                numberOfLines={1}
                              >
                                {product.title}
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
                                      (1 -
                                        product.offer.discountPercentage / 100)
                                    ).toFixed(2)}{" "}
                                    ILS
                                  </Text>
                                </>
                              ) : (
                                <Text style={styles.productPrice}>
                                  {product?.price} ILS
                                </Text>
                              )}
                            </TouchableOpacity>
                          )
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ################ Edit for ShopNmae and Location ##################################*/}
            <EditShopInfoModal
              visible={editing}
              draftShopData={draftShopData}
              editErrors={editErrors}
              userId={userId}
              onClose={() => {
                setEditing(false);
                setDraftShopData(null);
                setEditErrors({ name: "", location: "" });
              }}
              onSave={handleSave}
              onChange={(field, value) => {
                setDraftShopData((prev) => ({ ...prev, [field]: value }));
                if (editErrors[field]) {
                  setEditErrors((prev) => ({ ...prev, [field]: "" }));
                }
              }}
            />

            {/* ################ Add product ###################################*/}

            <AddProduct
              visible={showProductModal}
              selectedCategory={selectedCategory}
              newProduct={newProduct}
              userId={userId}
              errors={errors}
              onPickImage={pickProductImage}
              onChangeField={(field, value) =>
                setNewProduct((prev) => ({ ...prev, [field]: value }))
              }
              onSave={handleSaveProduct}
              onCancel={() => {
                setShowProductModal(false);
                setErrors({ title: "", price: "", image: "" });
                setNewProduct({ title: "", price: "", image: null });
              }}
            />
            {/* ################ Add product ###################################*/}
            <ProductDetails
              visible={showDetailModal}
              product={selectedProductDetails}
              selectedColorName={selectedColorName}
              selectedColorImages={selectedColorImages}
              selectedProductDetails={selectedProductDetails}
              selectedMainImage={selectedMainImage}
              setSelectedMainImage={setSelectedMainImage}
              handleDeleteGalleryImage={handleDeleteGalleryImage}
              handleAddImage={handleAddImage}
              setShowAddColorModal={setShowAddColorModal}
              setColorForm={setColorForm}
              setColorModalVisible={setColorModalVisible}
              setSelectedColorName={setSelectedColorName}
              setSelectedColorImages={setSelectedColorImages}
              setSelectedProductDetails={setSelectedProductDetails}
              handleDeletePreviewImage={handleDeletePreviewImage}
              setColorFormErrors={setColorFormErrors}
              colorFormErrors={colorFormErrors}
              colorForm={colorForm}
              validateEditColorFields={validateEditColorFields}
              validateColorFields={validateColorFields}
              newColor={newColor}
              colorModalVisible={colorModalVisible}
              pickPreviewImage={pickPreviewImage}
              showAddColorModal={showAddColorModal}
              selectedCategory={selectedCategory}
              setShowDetailModal={setShowDetailModal}
              styles={styles}
              axios={axios}
              setNewColor={setNewColor}
              pickColorImages={pickColorImages}
              newSize={newSize}
              setNewSize={setNewSize}
              newStock={newStock}
              setNewStock={setNewStock}
              colorErrors={colorErrors}
              setColorErrors={setColorErrors}
              addSizeToColor={addSizeToColor}
              handleDeleteColorImage={handleDeleteColorImage}
              fetchCategoriesWithProducts={fetchCategoriesWithProducts}
              setProductsByCategory={setProductsByCategory}
              userId={userId}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#E5E4E2",
    alignItems: "center",
  },
  background: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#E5E4E2",
  },
  container: {
    padding: 20,
    alignItems: "center",
  },
  logo: {
    width: 170,
    height: 170,
    borderRadius: 90,
    marginTop: -50,
    borderWidth: 6,
    borderColor: "#899499",
  },
  cover: {
    width: 500,
    height: 200,
    resizeMode: "cover",
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 4,
    borderColor: "#899499",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
    color: "#000",
    marginBottom: 2,
  },
  location: {
    fontSize: 15,
    marginBottom: 10,
    marginTop: 10,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
    left: 20,
    marginTop: -170,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  editIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  editBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  plusBtn: {
    right: 380,
  },
  plusIcon: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  categoryWrapper: {
    width: "100%",
    alignItems: "center",
    marginTop: 180,
  },

  categorySection: {
    width: "100%",
    alignItems: "flex-start",
    paddingHorizontal: 25,
  },

  categoryInput: {
    borderWidth: 2,
    borderColor: "#899499",
    borderRadius: 5,
    backgroundColor: "#EEEEEE",
    padding: 8,
    width: "80%",
    alignSelf: "center",
    marginVertical: 15,
    color: "#000", // text color
    placeholderTextColor: "#999", // add this in JSX instead!
  },

  categoryList: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 5,
  },

  categoryRow: {
    marginBottom: 0,
  },
  categoryRowContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "left",
  },

  categoryLine: {
    height: 2,
    backgroundColor: "#000",
    width: "100%",
    borderRadius: 1,
    marginTop: 2,
    marginRight: 370,
  },
  deleteIcon: {
    width: 20,
    height: 20,
    marginLeft: 10,
    tintColor: "#000",
  },
  productCardHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
    position: "absolute",
    top: 8,
    left: 17,
    zIndex: 1,
  },
  iconSmall: {
    width: 15,
    height: 15,
    tintColor: "#000",
  },
  iconSmallEdit: {
    width: 15,
    height: 15,
    tintColor: "#000",
    right: 120,
  },
  productList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 20,
  },
  productCard: {
    width: "45%",
    marginRight: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    alignItems: "center",
    marginBottom: 20,
    marginRight: 15,
  },
  productImage: {
    width: 110,
    height: 110,
    borderRadius: 6,
    right: -5,
    resizeMode: "contain",
    marginBottom: 10,
  },
  categoryEditInput: {
    borderBottomWidth: 1,
    borderColor: "#899499",
    padding: 4,
    fontSize: 16,
    width: "80%",
    color: "#000",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  productPrice: {
    fontSize: 17,
    fontWeight: "600",
    color: "#e53935",
    marginBottom: 20,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 7,
    color: "#333",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  categoryModal: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "85%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  cancelButton: {
    marginTop: 15,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "red",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
});
export default ShopProfileScreen;

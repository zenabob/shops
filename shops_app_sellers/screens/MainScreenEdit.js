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
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const DEFAULT_LOGO = require("../assets/img/default_Profile__picture.png");
const DEFAULT_COVER = require("../assets/img/cover_image.png");
const DELETE_ICON = require("../assets/img/delete.png");

const getDirection = (text) => {
  if (!text) return "ltr";
  const rtlChars = /[\u0590-\u05FF\u0600-\u06FF]/g;
  const match = text.match(rtlChars);
  return match && match.length > text.length / 2 ? "rtl" : "ltr";
};

const ShopProfileScreen = () => {
  const [errors, setErrors] = useState({ title: "", price: "", image: "" });
  const [shopData, setShopData] = useState({
    name: "",
    location: "",
    logo: null,
    cover: null,
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: "",
    price: "",
    image: null,
  });
  const [productsByCategory, setProductsByCategory] = useState({});
  const [draftShopData, setDraftShopData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [selectedMainImage, setSelectedMainImage] = useState("");
  const [selectedColorName, setSelectedColorName] = useState("");
  const [selectedSize, setSelectedSize] = useState(null);
  const [newColor, setNewColor] = useState({
    name: "",
    previewImage: null,
    images: [],
    sizes: [],
  });
  const [selectedColorImages, setSelectedColorImages] = useState([]);
  const [showColorInput, setShowColorInput] = useState(false);
  const [showAddColorModal, setShowAddColorModal] = useState(false);
  const allProductImages = selectedProductDetails
    ? [
        selectedProductDetails.MainImage,
        ...(selectedColorImages.length > 0
          ? selectedColorImages
          : selectedProductDetails.images || []),
      ]
    : [];
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [colorForm, setColorForm] = useState({
    name: "",
    previewImage: null,
    images: [],
    sizes: [{ size: "", stock: "" }],
  });
  const [newSize, setNewSize] = useState("");
  const [newStock, setNewStock] = useState("");
  const [colorErrors, setColorErrors] = useState({
    name: "",
    previewImage: "",
    images: "",
    sizes: "",
    newSize: "",
    newStock: "",
  });
  const [colorFormErrors, setColorFormErrors] = useState({
    name: "",
    previewImage: "",
    sizes: "",
  });
  const [editErrors, setEditErrors] = useState({ name: "", location: "" });
  const [isSaving, setIsSaving] = useState(false);
  const { showActionSheetWithOptions } = useActionSheet();

  useEffect(() => {
    fetchShopData();
    fetchCategoriesWithProducts();
  }, []);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        const mediaStatus =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!cameraStatus.granted || !mediaStatus.granted) {
          alert(
            "Sorry, we need camera and media permissions to make this work!"
          );
        }
      }
    })();
  }, []);

  const validateEditColorFields = () => {
    const errors = {
      name: "",
      previewImage: "",
      sizes: "",
    };

    let valid = true;

    if (!colorForm.name.trim()) {
      errors.name = "Color name is required";
      valid = false;
    }

    if (!colorForm.previewImage) {
      errors.previewImage = "Preview image is required";
      valid = false;
    }

    if (
      !colorForm.sizes ||
      colorForm.sizes.length === 0 ||
      colorForm.sizes.some((s) => s.size.trim() === "" || s.stock.trim() === "")
    ) {
      errors.sizes = "At least one size and stock value is required";
      valid = false;
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

    if (!newColor.name.trim()) {
      errors.name = "Color name is required";
      isValid = false;
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
      errors.newSize = 'Size is required';
      hasError = true;
  
    // 2. ✅ Check if size already exists (case-insensitive)
    } else if (
      newColor.sizes.some(
        (s) => s.size.trim().toUpperCase() === size
      )
    ) {
      errors.newSize = 'This size already exists';
      hasError = true;
    }
  
    // 3. Validate stock
    if (!stock || isNaN(stock) || Number(stock) <= 0) {
      errors.newStock = 'Enter a valid stock quantity';
      hasError = true;
    }
  
    // 4. Optional size limit
    if (newColor.sizes.length >= 7) {
      errors.sizes = 'You can only add up to 7 sizes';
      hasError = true;
    }
  
    if (hasError) {
      setColorErrors(errors);
      return;
    }
  
    // 5. ✅ Save with normalized size
    const updatedSizes = [...newColor.sizes, { size, stock }];
    setNewColor((prev) => ({
      ...prev,
      sizes: updatedSizes,
    }));
  
    setNewSize('');
    setNewStock('');
    setColorErrors({ ...colorErrors, newSize: '', newStock: '', sizes: '' });
  };
  
  

  const handleDeleteGalleryImage = async (imageUrlToDelete) => {
    try {
      const productId = selectedProductDetails?._id;
      const encodedColor = encodeURIComponent(selectedColorName);

      // 1. Backend deletion
      await axios.delete(
        `http://172.20.10.4:5000/profile/category/${selectedCategory}/product/${productId}/color/${encodedColor}/image`,
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
      alert("Failed to delete image from color");
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
        `http://172.20.10.4:5000/profile/category/${selectedCategory}/product/${selectedProductDetails._id}`,
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
      alert("Error deleting color");
    }
  };

  const validateBeforeSave = () => {
    if (!selectedCategory) {
      alert("Missing category. Please try again.");
      return false;
    }

    if (!selectedProductDetails || !selectedProductDetails._id) {
      alert("Missing product details. Please try again.");
      return false;
    }

    if (!selectedProductDetails.title || !selectedProductDetails.price) {
      alert("Product title and price are required.");
      return false;
    }

    if (
      !newColor.name ||
      !newColor.previewImage ||
      newColor.images.length === 0
    ) {
      alert("Please fill all color fields: name, preview image, and images.");
      return false;
    }

    if (!newColor.sizes || newColor.sizes.length === 0) {
      alert("Please add at least one size and stock.");
      return false;
    }

    return true;
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

  const handleSaveProductDetails = async () => {
    try {
      const formData = new FormData();
      formData.append("title", selectedProductDetails.title);
      formData.append("price", selectedProductDetails.price);
      formData.append(
        "images",
        JSON.stringify(selectedProductDetails.images || [])
      );
      formData.append(
        "colors",
        JSON.stringify(selectedProductDetails.colors || [])
      );
      formData.append(
        "sizes",
        JSON.stringify(selectedProductDetails.sizes || [])
      );

      const res = await axios.put(
        `http://172.20.10.4:5000/profile/category/${selectedCategory}/product/${selectedProductDetails._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setShowDetailModal(false);
      await fetchCategoriesWithProducts();
    } catch (err) {
      console.error("Error saving product details:", err);
      alert("Error saving");
    }
  };

  const handleAddProductToCategory = (category) => {
    setSelectedCategory(category);
    setShowProductModal(true);
    setNewProduct({ title: "", price: "", image: null });
  };
  const uploadColorImage = async (uri) => {
    const formData = new FormData();
    formData.append('image', {
      uri,
      name: `color.jpg`,
      type: 'image/jpeg',
    });
  
    try {
      const res = await axios.post(
        `http://172.20.10.4:5000/profile/upload-color`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return res.data.url; // Return the uploaded URL
    } catch (err) {
      console.error('Error uploading color image:', err);
      return null;
    }
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

  const pickPreviewImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      setNewColor((prev) => ({
        ...prev,
        previewImage: uri,
      }));

      setColorErrors((prev) => ({ ...prev, previewImage: "" }));
    }
  };

  const pickColorImages = async () => {
    const remainingSlots = 6 - newColor.images.length;
  
    if (remainingSlots <= 0) {
      alert("You can only upload up to 6 images for this color.");
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
  
    if (!result.canceled) {
      // Limit to remaining slots
      const selectedAssets = result.assets.slice(0, remainingSlots);
  
      if (result.assets.length > remainingSlots) {
        alert(`You can only add ${remainingSlots} more image(s).`);
      }
  
      // Upload each selected image
      const uploads = await Promise.all(
        selectedAssets.map((asset) => uploadColorImage(asset.uri))
      );
  
      // Only keep successfully uploaded URLs
      const validUploads = uploads.filter((url) => url !== null);
  
      // Add to state
      setNewColor((prev) => ({
        ...prev,
        images: [...prev.images, ...validUploads],
      }));
  
      setColorErrors((prev) => ({ ...prev, images: "" }));
    }
  };
  

  const handleSaveProduct = async () => {
    if (isSaving) return; // Prevent double tap

    // Validate inputs
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
      setIsSaving(true); // 🔒 Prevent multiple presses

      const formData = new FormData();
      formData.append("title", newProduct.title);
      formData.append("price", newProduct.price);

      if (newProduct.image && !newProduct.image.startsWith("http")) {
        formData.append("image", {
          uri: newProduct.image,
          name: "product.jpg",
          type: "image/jpeg",
        });
      }

      let response;
      if (newProduct.id) {
        response = await axios.put(
          `http://172.20.10.4:5000/profile/category/${selectedCategory}/product/${newProduct.id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        response = await axios.post(
          `http://172.20.10.4:5000/profile/category/${selectedCategory}/product`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }

      await fetchCategoriesWithProducts();
      setShowProductModal(false);
      setNewProduct({ title: "", price: "", image: null, id: null });
      setErrors({ title: "", price: "", image: "" });
    } catch (err) {
      console.error("Error saving product:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    try {
      const res = await axios.delete(
        `http://172.20.10.4:5000/profile/category/${category}`
      );
      setCategories(res.data);
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  const fetchShopData = async () => {
    try {
      const res = await axios.get("http://172.20.10.4:5000/profile");
      setShopData(res.data);
    } catch (err) {
      console.error("Error fetching shop data:", err);
    }
  };

  const pickImage = async (type) => {
    const { status: cameraStatus } =
      await ImagePicker.getCameraPermissionsAsync();
    const { status: mediaStatus } =
      await ImagePicker.getMediaLibraryPermissionsAsync();

    if (!cameraStatus || !mediaStatus) {
      alert("Camera or media permissions not granted");
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
          uploadImage(result.assets[0].uri, type);
        }
      }
    );
  };

  const uploadImage = async (uri, type) => {
    const formData = new FormData();
    formData.append("image", {
      uri,
      name: `${type}.jpg`,
      type: "image/jpeg",
    });

    try {
      const res = await axios.post(
        `http://172.20.10.4:5000/profile/upload-${type}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setShopData((prev) => ({ ...prev, [type]: res.data.url }));
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
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
      await axios.put("http://172.20.10.4:5000/profile", {
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

  const handleCancel = () => {
    setEditing(false);
    setDraftShopData(null);
    setEditErrors({ name: "", location: "" });
  };
  const handleAddImage = async () => {
    if (selectedColorImages.length >= 7) {
      alert("You can only have up to 7 images per color.");
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
              `http://172.20.10.4:5000/profile/category/${selectedCategory}/product/${selectedProductDetails._id}`,
              formData,
              {
                headers: { "Content-Type": "multipart/form-data" },
              }
            );

            await fetchCategoriesWithProducts();
          } catch (err) {
            console.error("❌ Error saving added image:", err);
            alert("Failed to save image");
          }
        }
      }
    );
  };

  const handleAddCategory = async () => {
    const trimmed = newCategory.trim();

    // ✅ Check if name is empty
    if (!trimmed) {
      alert("Please enter a category name");
      return;
    }

    // ✅ Check if the name already exists (case-insensitive)
    const exists = categories.some(
      (cat) => cat.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      alert("This category already exists!");
      return;
    }

    // ✅ Proceed to save
    try {
      const res = await axios.post("http://172.20.10.4:5000/profile/category", {
        category: trimmed,
      });
      setCategories(res.data);
      setNewCategory("");
      setShowCategoryInput(false);
    } catch (err) {
      console.error("Error saving category:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://172.20.10.4:5000/profile/category");
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };
  const handleDeleteProduct = async (productId, category) => {
    try {
      await axios.delete(
        `http://172.20.10.4:5000/profile/category/${category}/product/${productId}`
      );
      setProductsByCategory((prev) => ({
        ...prev,
        [category]: prev[category].filter((p) => p._id !== productId),
      }));
    } catch (err) {
      console.error("Error deleting product:", err);
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
  const fetchCategoriesWithProducts = async () => {
    try {
      const res = await axios.get(
        "http://172.20.10.4:5000/profile/categories-with-products"
      );
      const result = {};
      res.data.forEach((category) => {
        result[category.name] = category.products;
      });
      setProductsByCategory(result);
      setCategories(res.data.map((c) => c.name));
    } catch (err) {
      console.error("Error fetching categories with products:", err);
    }
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
                  shopData.cover ? { uri: shopData.cover } : DEFAULT_COVER
                }
                style={styles.cover}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => pickImage("logo")}>
              <Image
                source={shopData.logo ? { uri: shopData.logo } : DEFAULT_LOGO}
                style={styles.logo}
              />
            </TouchableOpacity>

            <Text style={styles.title}>{shopData.name}</Text>
            <Text style={styles.location}>{shopData.location}</Text>

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
                onPress={() => setShowCategoryInput(!showCategoryInput)}
              >
                <Text style={styles.plusIcon}>＋</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.categoryWrapper}>
              {showCategoryInput && (
                <TextInput
                  style={styles.categoryInput}
                  placeholder="Enter category name"
                  placeholderTextColor="#999"
                  value={newCategory}
                  onChangeText={setNewCategory}
                  onSubmitEditing={handleAddCategory}
                />
              )}

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
                                source={{ uri: product.MainImage }}
                                style={styles.productImage}
                              />
                              <Text
                                style={styles.productTitle}
                                numberOfLines={1}
                              >
                                {product.title}
                              </Text>
                              <Text style={styles.productPrice}>
                                {product.price} ILS
                              </Text>
                            </TouchableOpacity>
                          )
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
            {/* Edit Modal */}
            <Modal
              visible={editing}
              transparent={true}
              animationType="fade"
              onRequestClose={handleCancel}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalOverlay}>
                  <View style={styles.editingModal}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        marginBottom: 10,
                      }}
                    >
                      Edit Shop Info
                    </Text>

                    <TextInput
                      style={[
                        styles.modalInput,
                        {
                          textAlign:
                            getDirection(draftShopData?.name) === "rtl"
                              ? "right"
                              : "left",
                          writingDirection: getDirection(draftShopData?.name),
                        },
                      ]}
                      placeholder="Shop Name"
                      value={draftShopData?.name}
                      onChangeText={(text) => {
                        setDraftShopData((prev) => ({ ...prev, name: text }));
                        if (editErrors.name !== "") {
                          setEditErrors((prev) => ({ ...prev, name: "" }));
                        }
                      }}
                    />
                    {editErrors.name !== "" && (
                      <Text style={styles.errorText}>{editErrors.name}</Text>
                    )}
                    <TextInput
                      style={[
                        styles.modalInput,
                        {
                          textAlign:
                            getDirection(draftShopData?.location) === "rtl"
                              ? "right"
                              : "left",
                          writingDirection: getDirection(
                            draftShopData?.location
                          ),
                        },
                      ]}
                      placeholder="Location"
                      value={draftShopData?.location}
                      onChangeText={(text) => {
                        setDraftShopData((prev) => ({
                          ...prev,
                          location: text,
                        }));
                        if (editErrors.location !== "") {
                          setEditErrors((prev) => ({ ...prev, location: "" }));
                        }
                      }}
                    />
                    {editErrors.location !== "" && (
                      <Text style={styles.errorText}>
                        {editErrors.location}
                      </Text>
                    )}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <TouchableOpacity
                        style={[styles.saveButton, { flex: 1, marginRight: 5 }]}
                        onPress={handleSave}
                      >
                        <Text style={styles.saveButtonText}>Save</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.cancelButton,
                          { flex: 1, marginLeft: 5 },
                        ]}
                        onPress={handleCancel}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
            <Modal visible={showProductModal} animationType="slide" transparent>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalOverlay}>
                  <View style={styles.editingModal}>
                    <Text style={styles.title}>
                      Edit Product to {selectedCategory}
                    </Text>

                    <Text style={styles.label}>Image</Text>
                    <TouchableOpacity onPress={pickProductImage}>
                      <Text style={{ color: "blue" }}>
                        {newProduct.image ? "Change Image" : "Pick Image"}
                      </Text>
                    </TouchableOpacity>
                    {errors.image !== "" && (
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
                      onChangeText={(text) => {
                        setNewProduct((prev) => ({ ...prev, title: text }));
                        setErrors((prev) => ({ ...prev, title: "" }));
                      }}
                    />
                    {errors.title !== "" && (
                      <Text style={styles.errorText}>{errors.title}</Text>
                    )}

                    <Text style={styles.label}>Price</Text>
                    <TextInput
                      placeholder="Product Price"
                      style={styles.modalInput}
                      keyboardType="numeric"
                      value={newProduct.price}
                      onChangeText={(text) => {
                        setNewProduct((prev) => ({ ...prev, price: text }));
                        setErrors((prev) => ({ ...prev, price: "" }));
                      }}
                    />
                    {errors.price !== "" && (
                      <Text style={styles.errorText}>{errors.price}</Text>
                    )}

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSaveProduct}
                      >
                        <Text style={styles.saveButtonText}>Save</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setShowProductModal(false);
                          setErrors({ title: "", price: "", image: "" });
                          setNewProduct({ title: "", price: "", image: null });
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </View>
          <Modal visible={showDetailModal} transparent animationType="fade">
            <View style={styles.alertOverlay}>
              <View style={styles.alertContainer}>
                {/* ✅ Define the full image list with MainImage first */}
                {selectedColorName && selectedColorImages.length > 0 && (
                  <View style={styles.galleryColumn}>
                    {(() => {
                      const currentColor = selectedProductDetails?.colors?.find(
                        (c) => c.name === selectedColorName
                      );

                      const preview = currentColor?.previewImage;
                      const rest =
                        currentColor?.images?.filter(
                          (img) => img !== preview
                        ) || [];
                      const orderedImages = preview ? [preview, ...rest] : rest;

                      return orderedImages.map((img, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => setSelectedMainImage(img)}
                        >
                          <View style={styles.imageContainer}>
                            <Image
                              source={{ uri: img }}
                              style={styles.circularImage}
                            />
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => handleDeleteGalleryImage(img)}
                            >
                              <Text style={styles.deleteText}>×</Text>
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      ));
                    })()}
                    {selectedColorImages.length < 6 && (
                      <TouchableOpacity
                        onPress={handleAddImage}
                        style={styles.addImageBtn}
                      >
                        <Text style={styles.addImageText}>＋</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {/* Main product image + Info */}
                <View style={styles.detailContent}>
                  <Image
                    source={{ uri: selectedMainImage }}
                    style={styles.mainAlertImage}
                  />

                  <Text style={styles.productName}>
                    {selectedProductDetails?.title}
                  </Text>
                  <Text style={styles.productPriceAlert}>
                    {selectedProductDetails?.price} ILS
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowAddColorModal(true)}
                    style={styles.addColorBtn}
                  >
                    <Text style={styles.addColorText}>
                      ＋Add Color Image Set
                    </Text>
                  </TouchableOpacity>

                  {selectedColorName ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginVertical: 5,
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                        Color: {selectedColorName}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          const selectedColor =
                            selectedProductDetails.colors.find(
                              (c) => c.name === selectedColorName
                            );
                          if (selectedColor) {
                            setColorForm({
                              name: selectedColor.name,
                              previewImage: selectedColor.previewImage,
                              images: selectedColor.images,
                              sizes: selectedColor.sizes,
                            });
                            setColorModalVisible(true); // 🔵 Open the edit modal
                          }
                        }}
                        style={{ marginLeft: 10 }}
                      >
                        <Image
                          source={require("../assets/img/Edit.png")}
                          style={{ width: 18, height: 18 }}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      marginVertical: 10,
                    }}
                  >
                    {selectedProductDetails?.colors?.map((c, i) => (
                      <View
                        key={c.previewImage || c.name || i}
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
                          <Image
                            source={{ uri: c.previewImage }}
                            style={styles.circularImage}
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
                  <Text style={{ fontWeight: "bold", fontSize: 15 }}>
                    Size:{" "}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      marginVertical: 10,
                    }}
                  >
                    {selectedProductDetails?.sizes?.map((s, i) => (
                      <View key={i} style={styles.sizeBox}>
                        <Text style={styles.sizeText}>
                          {s.size} ({s.stock})
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Modal
                    visible={colorModalVisible}
                    animationType="slide"
                    transparent
                  >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                      <View style={styles.modalOverlay}>
                        <View style={styles.editingModal}>
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
                            <Text style={styles.errorText}>
                              {colorFormErrors.name}
                            </Text>
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
                                  sizes: [
                                    ...prev.sizes,
                                    { size: "", stock: "" },
                                  ],
                                }))
                              }
                            >
                              <Text style={{ fontSize: 24, marginLeft: 8 }}>
                                ＋
                              </Text>
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
                                style={[
                                  styles.modalInput,
                                  { flex: 1, marginRight: 5 },
                                ]}
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
                                style={[
                                  styles.modalInput,
                                  { flex: 1, marginLeft: 5 },
                                ]}
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
                                <Text
                                  style={{ color: "white", fontWeight: "bold" }}
                                >
                                  ×
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ))}

                          {/* Save Button */}
                          <TouchableOpacity
                            style={styles.saveButton}
                            onPress={async () => {
                              const isValid = validateEditColorFields();
                              if (!isValid) return;
                              try {
                                // ✅ Update the colors array locally
                                const updatedColors =
                                  selectedProductDetails.colors.map((c) =>
                                    c.name === colorForm.name ? colorForm : c
                                  );

                                // ✅ Push changes to the backend
                                const formData = new FormData();
                                formData.append(
                                  "title",
                                  selectedProductDetails.title
                                );
                                formData.append(
                                  "price",
                                  selectedProductDetails.price
                                );
                                formData.append(
                                  "images",
                                  JSON.stringify(
                                    selectedProductDetails.images || []
                                  )
                                );
                                formData.append(
                                  "colors",
                                  JSON.stringify(updatedColors)
                                );
                                formData.append(
                                  "sizes",
                                  JSON.stringify(
                                    selectedProductDetails.sizes || []
                                  )
                                );

                                await axios.put(
                                  `http://172.20.10.4:5000/profile/category/${selectedCategory}/product/${selectedProductDetails._id}`,
                                  formData,
                                  {
                                    headers: {
                                      "Content-Type": "multipart/form-data",
                                    },
                                  }
                                );

                                // ✅ Update the full product object immediately
                                setSelectedProductDetails((prev) => ({
                                  ...prev,
                                  colors: updatedColors,
                                  sizes:
                                    selectedColorName === colorForm.name
                                      ? colorForm.sizes || []
                                      : prev.sizes,
                                }));

                                // ✅ Update main image & images if it's the currently selected color
                                if (selectedColorName === colorForm.name) {
                                  setSelectedMainImage(colorForm.previewImage);
                                  setSelectedColorImages(
                                    colorForm.images || []
                                  );
                                }

                                setColorModalVisible(false);
                              } catch (err) {
                                console.error("Error saving color:", err);
                                alert("Failed to save color details");
                              }
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
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  </Modal>

                  <Modal
                    visible={showAddColorModal}
                    animationType="slide"
                    transparent
                  >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                      <View style={styles.modalOverlay}>
                        <View style={styles.editingModal}>
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
                              source={{ uri: newColor.previewImage }}
                              style={{
                                width: 60,
                                height: 60,
                                marginVertical: 8,
                                borderRadius: 4,
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
                                color:
                                  newColor.images.length >= 6 ? "gray" : "blue",
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
                                    source={{ uri: img }}
                                    style={{
                                      width: 70,
                                      height: 70,
                                      borderRadius: 6,
                                      borderWidth: 1,
                                      borderColor: "#ccc",
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
                          <View
                            style={{ flexDirection: "row", marginBottom: 10 }}
                          >
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
                              style={[
                                styles.modalInput,
                                { flex: 1, marginRight: 5 },
                              ]}
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
                              style={[
                                styles.modalInput,
                                { flex: 1, marginLeft: 5 },
                              ]}
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
                                formData.append(
                                  "title",
                                  selectedProductDetails.title
                                );
                                formData.append(
                                  "price",
                                  selectedProductDetails.price
                                );
                                formData.append(
                                  "colors",
                                  JSON.stringify(updatedColors)
                                );
                                formData.append(
                                  "images",
                                  JSON.stringify(
                                    selectedProductDetails.images || []
                                  )
                                );
                                formData.append(
                                  "sizes",
                                  JSON.stringify(
                                    selectedProductDetails.sizes || []
                                  )
                                );

                                await axios.put(
                                  `http://172.20.10.4:5000/profile/category/${selectedCategory}/product/${selectedProductDetails._id}`,
                                  formData,
                                  {
                                    headers: {
                                      "Content-Type": "multipart/form-data",
                                    },
                                  }
                                );
                                setSelectedColorName(newColor.name);
                                setSelectedMainImage(newColor.previewImage);
                                setSelectedColorImages(newColor.images);
                                
                                setSelectedProductDetails((prev) => ({
                                  ...prev,
                                  colors: updatedColors,
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
                                alert("Error saving");
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
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  </Modal>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowDetailModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
  );
};
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#C1D9D1",
    alignItems: "center",
  },
  background: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#C1D9D1",
  },
  container: {
    padding: 20,
    alignItems: "center",
  },
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
  modalInput: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#77BBA2",
    borderRadius: 5,
    padding: 10,
    marginVertical: 8,
    backgroundColor: "#EEEEEE",
  },
  logo: {
    width: 170,
    height: 170,
    borderRadius: 90,
    marginTop: -50,
    borderWidth: 6,
    borderColor: "#77BBA2",
  },
  cover: {
    width: 500,
    height: 200,
    resizeMode: "cover",
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 4,
    borderColor: "#77BBA2",
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
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
    marginTop: -125,
    left: 20,
    marginTop: -180,
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
    borderColor: "#77BBA2",
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
  categoryRowContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },

  deleteIcon: {
    width: 20,
    height: 20,
    marginLeft: 10,
    tintColor: "#000",
  },

  productList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    marginBottom: 10,
  },

  productCard: {
    width: "45%",
    marginRight: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    alignItems: "center",
    marginBottom: 15,
  },

  productImage: {
    width: 110,
    height: 100,
    borderRadius: 6,
    right: -5,
    resizeMode: "cover",
    marginBottom: 10,
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
  productCardHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "100%",
    position: "absolute",
    top: 8,
    right: 1,
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
    right: 125,
  },
  detailModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },

  mainImage: {
    width: "100%",
    height: 500,
    borderRadius: 10,
    resizeMode: "cover",
  },

  galleryScroll: {
    marginTop: 15,
    marginBottom: 20,
  },

  galleryImage: {
    width: 70,
    height: 70,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#ccc",
  },

  productTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 7,
    color: "#333",
  },

  productPrice: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e53935",
    marginBottom: 20,
  },

  colorLabel: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
  },

  colorScroll: {
    flexDirection: "row",
    marginBottom: 20,
  },

  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#ccc",
  },

  selectedSwatch: {
    borderColor: "#000",
  },

  sizeLabel: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
  },

  sizeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },

  sizeBox: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: "#eee",
  },

  selectedSizeBox: {
    backgroundColor: "#000",
  },

  sizeText: {
    fontSize: 14,
    color: "#000",
  },

  selectedSizeText: {
    color: "#fff",
  },

  saveButton: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
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
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  galleryColumn: {
    marginRight: 10,
    justifyContent: "flex-start",
  },
  galleryImageSmall: {
    width: 70,
    height: 70,
    marginBottom: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  detailContent: {
    flex: 1,
  },
  mainAlertImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    marginBottom: 10,
  },
  productName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  productPriceAlert: {
    color: "#e53935",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  colorSwatchAlert: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  selectedColorLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  sizeTitle: {
    fontWeight: "bold",
    marginTop: 10,
  },
  addImageBtn: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: "#EEE",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 10,
  },

  addImageText: {
    fontSize: 28,
    color: "#555",
  },
  colorPreview: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 10,
    marginRight: 10,
  },

  circularImage: {
    width: 70,
    height: 70,
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
  new_category: {
    fontSize: 13,
    fontWeight: "bold",
    left: -25,
  },
});

export default ShopProfileScreen;

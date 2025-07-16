import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  FlatList,
  Image,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {API_BASE_URL} from "../config";
import { Image as ExpoImage } from 'expo-image';

const screenWidth = Dimensions.get("window").width;

const Offer = ({ userId, navigation }) => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [applyToAll, setApplyToAll] = useState(false);
  const [discount, setDiscount] = useState("");
  const [duration, setDuration] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [durationValue, setDurationValue] = useState("");
 const [durationUnit, setDurationUnit] = useState("hours"); // default

  useEffect(() => {
  const loadUserId = async () => {
    const id = await AsyncStorage.getItem("userId");
    if (id) {
      fetchAllProducts(id);
    } else {
      console.warn(" No userId found in storage.");
    }
  };
  loadUserId();
}, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllProducts(); 
    }, 1000); 
  
    return () => clearInterval(interval); 
  }, [userId]);
  
  const fetchAllProducts = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/profile/${userId}/categories-with-products`
      );
      const all = res.data.flatMap((cat) =>
        cat.products.map((p) => ({
          ...p,
          category: cat.name,
        }))
      );
      setProducts(all);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const toggleProductSelection = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const applyOffer = async () => {
    const parsedDiscount = parseFloat(discount);
    const parsedDuration = parseInt(durationValue);
  
    if (
      isNaN(parsedDiscount) ||
      parsedDiscount <= 0 ||
      isNaN(parsedDuration) ||
      parsedDuration <= 0
    ) {
      return Alert.alert("Invalid input", "Please enter valid numbers");
    }
  
    const now = new Date();
    let durationInMs;
  
    switch (durationUnit) {
      case "seconds":
        durationInMs = parsedDuration * 1000;
        break;
      case "minutes":
        durationInMs = parsedDuration * 60 * 1000;
        break;
      case "hours":
        durationInMs = parsedDuration * 60 * 60 * 1000;
        break;
      case "days":
        durationInMs = parsedDuration * 24 * 60 * 60 * 1000;
        break;
      case "months":
        durationInMs = parsedDuration * 30 * 24 * 60 * 60 * 1000;
        break;
      case "years":
        durationInMs = parsedDuration * 365 * 24 * 60 * 60 * 1000;
        break;
      default:
        durationInMs = parsedDuration * 3600000; 
    }
  
    const end = new Date(now.getTime() + durationInMs);
  
    const offerData = {
      discountPercentage: parsedDiscount,
      expiresAt: end.toISOString(),
    };
  
    const targets = applyToAll
      ? products
      : products.filter((p) => selectedProducts.includes(p._id));
  
    try {
      await Promise.all(
        targets.map((product) =>
          axios.put(
            `${API_BASE_URL}/profile/${userId}/category/${product.category}/product/${product._id}/offer`,
            offerData
          )
        )
      );
  
      Alert.alert(" Offer Applied Successfully", "", [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("MainScreen", { refresh: true });
          },
        },
      ]);
  
      setModalVisible(false);
      setSelectedProducts([]);
      setApplyToAll(false);
      setDiscount("");
      setDurationValue("");
      setDurationUnit("hours");
      fetchAllProducts();
    } catch (err) {
      console.error("Error applying offer:", err);
      Alert.alert(" Failed", "Could not apply the offer");
    }
  };
  

  return (
    <View style={styles.container}>
     
        <TouchableOpacity
          onPress={() => navigation.navigate("MainScreen")}
          style={styles.backButton}
        >
          <ExpoImage
            source={require("../assets/img/BlackArrow.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>

        <Text style={styles.title}>Select Products for Offer</Text>
   

      <TouchableOpacity
        onPress={() => setApplyToAll(!applyToAll)}
        style={styles.selectAllBtn}
      >
        <Text style={styles.selectAllText}>
          {applyToAll ? "All Products Selected" : "Select All Products"}
        </Text>
      </TouchableOpacity>

      {!applyToAll && (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.productCard,
                selectedProducts.includes(item._id) && styles.selectedCard,
              ]}
              onPress={() => toggleProductSelection(item._id)}
              activeOpacity={0.8}
            >
             <ExpoImage
  source={{
    uri: (item.MainImage || item.image)?.startsWith("http")
      ? item.MainImage || item.image
      : `${API_BASE_URL}${item.MainImage || item.image}`,
  }}
  style={styles.productImage}
/>

              <Text numberOfLines={1} style={styles.productTitle}>
                {item.title}
              </Text>

              {item.offer?.discountPercentage && new Date(item.offer.expiresAt) > new Date() ? (

                <>
                  <Text
                    style={{
                      textDecorationLine: "line-through",
                      color: "gray",
                      fontSize: 13,
                    }}
                  >
                    {item.price} ILS
                  </Text>
                  <Text style={styles.productPrice}>
                    {(
                      item.price *
                      (1 - item.offer.discountPercentage / 100)
                    ).toFixed(2)}{" "}
                    ILS
                  </Text>
                </>
              ) : (
                <Text style={styles.productPrice}>{item.price} ILS</Text>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={{
            paddingBottom: 40,
            paddingHorizontal: 10,
          }}
        />
      )}

{(applyToAll || selectedProducts.length > 0) && (
  <TouchableOpacity
    onPress={() => setModalVisible(true)}
    style={styles.applyBtn}
  >
    <Text style={styles.btnText}>Set Offer</Text>
  </TouchableOpacity>
)}

      {/* Offer Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Offer Details</Text>

            <TextInput
              placeholder="Discount %"
              placeholderTextColor="#888"
              keyboardType="numeric"
              style={styles.input}
              value={discount}
              onChangeText={setDiscount}
            />
            <View style={{ flexDirection: "row", marginBottom: 15, gap: 10 }}>
  <TextInput
    placeholder="Duration"
    placeholderTextColor="#888"
    keyboardType="numeric"
    style={[styles.input, { flex: 1 }]}
    value={durationValue}
    onChangeText={setDurationValue}
  />
  <View style={[styles.input, { flex: 1, justifyContent: "center" }]}>
    <TouchableOpacity
      onPress={() => {
        // show a simple unit select
        Alert.alert("Select Unit", "", [
          { text: "Seconds", onPress: () => setDurationUnit("seconds") },
          { text: "Minutes", onPress: () => setDurationUnit("minutes") },
          { text: "Hours", onPress: () => setDurationUnit("hours") },
          { text: "Days", onPress: () => setDurationUnit("days") },
          { text: "Months", onPress: () => setDurationUnit("months") },
          { text: "Years", onPress: () => setDurationUnit("years") },
          { text: "Cancel", style: "cancel" },
        ]);
      }}
    >
      <Text style={{ textAlign: "center", color: "#000" }}>
        {durationUnit}
      </Text>
    </TouchableOpacity>
  </View>
</View>


            <TouchableOpacity style={styles.confirmBtn} onPress={applyOffer}>
              <Text style={styles.btnText}>Apply Offer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.btnText, { color: "#333" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 25,
    color: "#000",
    marginBottom:15,
  },
  
  selectAllBtn: {
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    marginLeft: 25,
  },
  selectAllText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  productCard: {
    width: (screenWidth - 80) / 2,
    margin: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    elevation: 2,
  },
  selectedCard: {
    borderColor: "#007bff",
    borderWidth: 2,
  },
  productImage: {
    width: 110,
    height: 110,
    borderRadius: 6,
    resizeMode: "cover",
    marginBottom: 10,
  },
  productTitle: {
    fontWeight: "bold",
    fontSize: 13,
    marginBottom: 5,
    color: "#333",
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#e53935",
  },
  applyBtn: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 12,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
    padding: 10,
    borderRadius: 6,
  },
  confirmBtn: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  cancelBtn: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 6,
  },
  backButton: {
    // position: "absolute",
    marginTop: 20,
    zIndex: 100,
    padding: 5,
    marginBottom: 5,
  },

  backIcon: {
    width: 30,
    height: 30,
    tintColor: "#000",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 15,
  },
  
});

export default Offer;

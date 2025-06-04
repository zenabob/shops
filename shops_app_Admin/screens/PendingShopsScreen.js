import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { API_BASE_URL } from "../config"; 

const PendingShopsScreen = () => {
  const [pendingShops, setPendingShops] = useState([]);
const rejectShop = async (shopId) => {
  try {
    await axios.delete(`${API_BASE_URL}/admin/delete-shop/${shopId}`);
    setPendingShops((prev) => prev.filter((shop) => shop._id !== shopId));
  } catch (error) {
    console.error("Error rejecting shop", error);
  }
};

  const fetchPendingShops = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/pending-shops`);
      setPendingShops(res.data);
    } catch (error) {
      console.error("Error fetching pending shops", error);
    }
  };

  useFocusEffect(
  useCallback(() => {
    fetchPendingShops();
  }, [])
);


  const approveShop = async (shopId) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/approve-shop/${shopId}`);
      setPendingShops((prev) => prev.filter((shop) => shop._id !== shopId));
    } catch (error) {
      console.error("Error approving shop", error);
    }
  };

  const renderShop = ({ item }) => (
    <View style={styles.card}>
      <Image
  source={
    item.logo
      ? { uri: item.logo }
      : require("../assets/img/default_Profile__picture.png")
  }
  style={styles.logo}
/>

      <View style={styles.details}>
        <Text style={styles.shopName}>{item.shopName}</Text>
        <Text>Owner: {item.fullName}</Text>
        <Text>Email: {item.email}</Text>
        <Text>Phone: {item.phoneNumber}</Text>
        <Text>Location: {item.location}</Text>
        <View style={{ flexDirection: "row", marginTop: 10 }}>
  <TouchableOpacity
    style={[styles.button, { backgroundColor: "#77BBA2", marginRight: 10 }]}
    onPress={() => approveShop(item._id)}
  >
    <Text style={styles.buttonText}>Approve</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.button, { backgroundColor: "red" }]}
    onPress={() => rejectShop(item._id)}
  >
    <Text style={styles.buttonText}>Reject</Text>
  </TouchableOpacity>
</View>

      </View>
    </View>
  );

  return (
    <FlatList
      data={pendingShops}
      keyExtractor={(item) => item._id}
      renderItem={renderShop}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: { padding: 15 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
    elevation: 2,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 15,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  details: { flex: 1 },
  shopName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  approveButton: {
    marginTop: 10,
    backgroundColor: "#77BBA2",
    padding: 8,
    borderRadius: 5,
  },
  buttonText: { color: "#fff", textAlign: "center" },
  button: {
  padding: 8,
  borderRadius: 5,
  flex: 1,
},

});

export default PendingShopsScreen;

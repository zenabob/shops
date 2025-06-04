import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from "../config";
import { SELLER_API_BASE_URL } from "../seller-api";
 
const ApprovedShopsScreen = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  const removeApproval = async (shopId) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/remove-approval/${shopId}`);
      setShops((prev) => prev.filter((shop) => shop._id !== shopId));
    } catch (error) {
      console.error("Failed to remove approval", error);
    }
  };

  const fetchShops = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/shops`);
      const approved = res.data.filter(shop => shop.status === "approved");
      setShops(approved);
    } catch (error) {
      console.error("Failed to fetch shops", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchShops();
    }, [])
  );

 const renderShop = ({ item }) => {
  const logoUri = item.logo
    ? `${SELLER_API_BASE_URL}${item.logo.startsWith("/") ? "" : "/"}${item.logo}`
    : null;

  return (
    <View style={styles.card}>
      <Image
  source={
    item.logo
      ? { uri: `${SELLER_API_BASE_URL}${item.logo.startsWith("/") ? "" : "/"}${item.logo}` }
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
        <View style={styles.removeButtonContainer}>
  <Text
    style={styles.removeButtonText}
    onPress={() => removeApproval(item._id)}
  >
    Remove
  </Text>
</View>

      </View>
    </View>
  );
};


  return (
    <FlatList
      data={shops}
      keyExtractor={(item) => item._id}
      renderItem={renderShop}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#f9f9f9',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
    elevation: 3,
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 15,
    backgroundColor: '#eee',
  },
  details: {
    flex: 1,
  },
  shopName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  removeButton: {
    color: "red",
    fontWeight: "bold",
    marginTop: 5,
  },
  removeButtonContainer: {
  backgroundColor: "#dc3545", 
  paddingVertical: 8,
  paddingHorizontal: 15,
  borderRadius: 8,
  alignItems: "center",
  marginTop: 10,
  alignSelf: "flex-start", 
},

removeButtonText: {
  color: "#fff",
  fontWeight: "bold",
  fontSize: 14,
},

});

export default ApprovedShopsScreen;

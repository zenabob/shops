import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
const OrdersScreen = () => {
  const [groupedOrders, setGroupedOrders] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://172.20.10.4:5002/admin/grouped-orders")
      .then((res) => {
        setGroupedOrders(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching grouped orders:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Loading orders...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {Object.entries(groupedOrders).map(([shopName, orders]) => (
        <View key={shopName} style={styles.shopBlock}>
          <Text style={styles.shopTitle}>{shopName}</Text>
          {orders.map((order) => (
            <View key={order._id} style={styles.orderCard}>
              <Text style={styles.orderId}>Order ID: {order.orderId}</Text>
              <Text>
                Customer: {order.userName || "N/A"} | Phone: 0
                {order.userPhone || "N/A"}
              </Text>
              <Text>Location: {order.userLocation || "N/A"}</Text>
              <Text>Status: {order.status}</Text>
              <Text>Total: ₪{order.totalPrice?.toFixed(2)}</Text>

              <Text style={styles.sectionTitle}>Products:</Text>
              {order.products.map((prod, i) => (
                <Text key={i} style={styles.productItem}>
                  • {prod.title} - {prod.quantity}× ₪{prod.price} |{" "}
                  {prod.selectedColor} / {prod.selectedSize}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: "#f8f8f8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  shopBlock: {
    marginBottom: 30,
  },
  shopTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  orderCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  orderId: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "#1e90ff",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginTop: 10,
  },
  productItem: {
    fontSize: 13,
    color: "#555",
    marginLeft: 10,
    marginTop: 5,
  },
});

export default OrdersScreen;

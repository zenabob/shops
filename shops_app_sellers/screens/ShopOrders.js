import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import axios from "axios";

const statusOptions = ["Pending", "Prepared", "Delivered", "New"];

const ShopOrdersScreen = ({ route, navigation }) => {
  const { userId, shopId } = route.params || {};
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    if (shopId) fetchOrders();
  }, [shopId]);

  const fetchOrders = async () => {
    try {
      const url = `http://172.20.10.4:5000/shop/${shopId}/orders`;
      const res = await axios.get(url);
      setOrders(res.data);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`http://172.20.10.4:5000/orders/${orderId}/status`, {
        status: newStatus,
      });

      // Update locally
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      Alert.alert("Error", "Failed to update order status.");
      console.error(err);
    }
  };

  const filteredOrders =
    filterStatus === "All"
      ? orders
      : orders.filter((order) => order.status === filterStatus);

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <Text style={styles.orderId}>Order ID: {item.orderId}</Text>

      <Text style={styles.customerInfo}>
        Customer: {item.userName || "N/A"} | Phone number: 0{item.userPhone || "N/A"}
      </Text>
      <Text style={styles.location}>Location: {item.userLocation || "N/A"}</Text>

      <Text style={styles.status}>Status: {item.status || "New"}</Text>

      <TouchableOpacity
        style={styles.statusButton}
        onPress={() =>
          Alert.alert(
            "Change Status",
            "Choose new status:",
            statusOptions.map((option) => ({
              text: option,
              onPress: () => updateOrderStatus(item.orderId, option),
            }))
          )
        }
      >
        <Text style={styles.statusButtonText}>Change Status</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Products:</Text>
      {item.products.map((prod, index) => (
        <Text key={index} style={styles.productItem}>
          • {prod.title} - {prod.quantity}× ₪{prod.price} | {prod.selectedColor} / {prod.selectedSize}
        </Text>
      ))}

      <Text style={styles.total}>Total: ₪{item.totalPrice?.toFixed(2) || 0}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() =>
  navigation.navigate("MainScreen", {
    userId,
    shopId,
  })
}

        style={styles.backButton}
      >
        <Image
          source={require("../assets/img/BlackArrow.png")}
          style={styles.backIcon}
        />
      </TouchableOpacity>

      <Text style={styles.header}>Shop Orders</Text>

      <View style={styles.filterRow}>
        {["All", ...statusOptions].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.activeFilter,
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={{
                color: filterStatus === status ? "#fff" : "#333",
                fontWeight: "bold",
              }}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={renderOrder}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 15 },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 20, marginTop: 20 },
  filterRow: {
    flexDirection: "row",
    marginBottom: 15,
    flexWrap: "wrap",
    gap: 10,
  },
  filterButton: {
    backgroundColor: "#eee",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  activeFilter: {
    backgroundColor: "#1e90ff",
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
  },
  orderId: { fontWeight: "bold", color: "#333" },
  customerInfo: { color: "#444", marginTop: 5 },
  location: { fontSize: 13, color: "#555" },
  status: { marginTop: 8, color: "#1e90ff", fontWeight: "bold" },
  total: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "bold",
    color: "#e67e22",
  },
  sectionTitle: {
    marginTop: 10,
    fontWeight: "bold",
    fontSize: 14,
    color: "#000",
  },
  productItem: {
    fontSize: 13,
    color: "#555",
    marginLeft: 10,
    marginTop: 7,
    marginBottom: 10,
  },
  statusButton: {
    backgroundColor: "#1e90ff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  statusButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  // backButton: {
  //   position: "absolute",
  //   top: 10,
  //   left: 10,
  //   zIndex: 1,
  // },
  backIcon: {
    width: 30,
    height: 30,
  },
});

export default ShopOrdersScreen;

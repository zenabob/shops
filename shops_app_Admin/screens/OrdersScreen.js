// ✅ الكود الكامل لملف OrdersScreen.js مع دعم الفلترة بالحالة (Status)

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import { API_BASE_URL } from "../config";

const OrdersScreen = () => {
  const [groupedOrders, setGroupedOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc");
  const [customerName, setCustomerName] = useState("");
  const [productTitle, setProductTitle] = useState("");
  const [orderLocation, setOrderLocation] = useState("");
  const [orderDate, setOrderDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [shopName, setShopName] = useState("");
  const [shopNameSuggestions, setShopNameSuggestions] = useState([]);
  const [activeTab, setActiveTab] = useState("undelivered");
  const [statusFilter, setStatusFilter] = useState("");
  const [statusListVisible, setStatusListVisible] = useState(false);

  const statusOptions = ["Delivered", "Delivered to Admin", "All"];

  const fetchOrders = async (filters = {}) => {
    setLoading(true);
    try {
      const params = {
        sort: filters.sortOrder || sortOrder,
        customer: filters.customerName || "",
        product: filters.productTitle || "",
        location: filters.orderLocation || "",
        shopName: filters.shopName || "",
        status: filters.statusFilter || "",
      };
      if (filters.orderDate) {
        params.date = filters.orderDate.toISOString().split("T")[0];
      }
      const res = await axios.get(`${API_BASE_URL}/admin/grouped-orders`, {
        params,
      });
      setGroupedOrders(res.data.grouped);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCustomerNameChange = (text) => {
    setCustomerName(text);
    const allCustomerNames = Object.values(groupedOrders)
      .flat()
      .map((order) => order.userName)
      .filter(Boolean);
    setNameSuggestions([
      ...new Set(
        allCustomerNames.filter((name) =>
          name.toLowerCase().includes(text.toLowerCase())
        )
      ),
    ]);
  };
  const markAsDelivered = async (orderId) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/admin/orders/${orderId}/deliver`
      );
      const updatedOrder = response.data.order;

      setGroupedOrders((prev) => {
        const updated = { ...prev };
        for (let shop in updated) {
          updated[shop] = updated[shop].map((order) =>
            order._id === updatedOrder._id ? updatedOrder : order
          );
        }
        return updated;
      });
    } catch (err) {
      console.error("Failed to mark as delivered:", err);
    }
  };

  const undoDelivery = async (orderId) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/admin/orders/${orderId}/undo-deliver`
      );
      const updatedOrder = response.data.order;

      setGroupedOrders((prev) => {
        const updated = { ...prev };
        for (let shop in updated) {
          updated[shop] = updated[shop].map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
          );
        }
        return updated;
      });
    } catch (err) {
      console.error("Failed to undo delivery:", err);
    }
  };

  const handleProductTitleChange = (text) => {
    setProductTitle(text);
    let productPool = [];
    if (customerName) {
      productPool = Object.values(groupedOrders)
        .flat()
        .filter(
          (order) =>
            order.userName?.toLowerCase() === customerName.toLowerCase()
        )
        .flatMap((order) => order.products.map((p) => p.title));
    } else {
      productPool = Object.values(groupedOrders)
        .flat()
        .flatMap((order) => order.products.map((p) => p.title));
    }
    const uniqueProducts = [...new Set(productPool)];
    setProductSuggestions(
      uniqueProducts.filter((title) =>
        title.toLowerCase().includes(text.toLowerCase())
      )
    );
  };

  const handleShopNameChange = (text) => {
    setShopName(text);
    const allShopNames = Object.keys(groupedOrders);
    setShopNameSuggestions(
      allShopNames.filter((name) =>
        name.toLowerCase().includes(text.toLowerCase())
      )
    );
  };

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
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          marginBottom: 10,
          marginTop: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab("undelivered")}
          style={[
            styles.tabButton,
            activeTab === "undelivered" && styles.activeTabButton,
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "undelivered" && styles.activeTabButtonText,
            ]}
          >
            Not Delivered Yet
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("delivered")}
          style={[
            styles.tabButton,
            activeTab === "delivered" && styles.activeTabButton,
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "delivered" && styles.activeTabButtonText,
            ]}
          >
            Delivered
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => setFilterModalVisible(true)}
        style={styles.filterButton}
      >
        <Text style={styles.filterButtonText}>Filter</Text>
      </TouchableOpacity>

      {Object.entries(groupedOrders).map(([shopName, orders]) => (
        <View key={shopName} style={styles.shopBlock}>
          <Text style={styles.shopTitle}>{shopName}</Text>
          {orders
            .filter((order) =>
              activeTab === "undelivered"
                ? order.status !== "Delivered"
                : order.status === "Delivered"
            )
            .map((order) => (
              <View key={order._id} style={styles.orderCard}>
                <Text style={styles.orderId}>Order ID: {order.orderId}</Text>
                <Text>
                  Customer: {order.userName || "N/A"} | Phone: 0
                  {order.userPhone || "N/A"}
                </Text>
                <Text>Location: {order.userLocation || "N/A"}</Text>
                <Text>Status: {order.status}</Text>

                <Text style={{ fontSize: 12, color: "#555", marginTop: 5 }}>
                  Created At:{" "}
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : "N/A"}
                </Text>

                {order.deliveredToAdminAt && (
                  <Text style={{ fontSize: 12, color: "#555" }}>
                    Delivered to Admin:{" "}
                    {new Date(order.deliveredToAdminAt).toLocaleDateString()}
                  </Text>
                )}

                {order.deliveredAt && (
                  <Text style={{ fontSize: 12, color: "#28a745" }}>
                    Delivered to Customer:{" "}
                    {new Date(order.deliveredAt).toLocaleDateString()}
                  </Text>
                )}

                <Text style={{ fontWeight: "bold", marginTop: 5 }}>
                  Total: ₪{order.totalPrice?.toFixed(2)}
                </Text>

                <Text style={{ fontWeight: "bold", marginTop: 5 }}>
                  Products:
                </Text>
                {order.products.map((p, index) => (
                  <Text
                    key={index}
                    style={{
                      fontSize: 13,
                      color: "#555",
                      marginLeft: 10,
                      marginTop: 2,
                    }}
                  >
                    • {p.title} - {p.quantity}× ₪{p.price} | {p.selectedColor} /{" "}
                    {p.selectedSize}
                  </Text>
                ))}

                {order.status === "Delivered to Admin" && (
                  <TouchableOpacity
                    style={styles.deliveredButton}
                    onPress={() => markAsDelivered(order._id)}
                  >
                    <Text style={styles.deliveredButtonText}>
                      Mark as Delivered
                    </Text>
                  </TouchableOpacity>
                )}

                {order.status === "Delivered" && (
                  <TouchableOpacity
                    style={styles.undoButton}
                    onPress={() => undoDelivery(order._id)}
                  >
                    <Text style={styles.undoButtonText}>Undo Delivery</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
        </View>
      ))}

      {/* Filter Modal */}
      <Modal visible={filterModalVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Filter Orders</Text>

              <Text style={styles.label}>Customer Name</Text>
              <TextInput
                placeholder="e.g. Ahmed"
                value={customerName}
                onChangeText={handleCustomerNameChange}
                style={styles.modalInput}
              />

              <Text style={styles.label}>Shop Name</Text>
              <TextInput
                placeholder="e.g. Zara"
                value={shopName}
                onChangeText={handleShopNameChange}
                style={styles.modalInput}
              />

              <Text style={styles.label}>Product Title</Text>
              <TextInput
                placeholder="e.g. White T-shirt"
                value={productTitle}
                onChangeText={handleProductTitleChange}
                style={styles.modalInput}
              />

              <Text style={styles.label}>Location</Text>
              <TextInput
                placeholder="e.g. Jerusalem"
                value={orderLocation}
                onChangeText={setOrderLocation}
                style={styles.modalInput}
              />

              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[styles.modalInput, { justifyContent: "center" }]}
              >
                <Text>
                  {orderDate
                    ? orderDate.toISOString().split("T")[0]
                    : "Pick a date"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={orderDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setOrderDate(selectedDate);
                  }}
                />
              )}

              <Text style={styles.label}>Status</Text>
              <TouchableOpacity
                style={[styles.modalInput, { justifyContent: "center" }]}
                onPress={() => {
                  Keyboard.dismiss();
                  setFilterModalVisible(false);
                  setTimeout(() => setStatusListVisible(true), 300);
                }}
              >
                <Text style={{ color: statusFilter ? "#000" : "#A9A9A9" }}>
                  {statusFilter || "Select Status..."}
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 15,
                }}
              >
                <TouchableOpacity
                  style={{ flex: 1, alignItems: "center" }}
                  onPress={() => {
                    setCustomerName("");
                    setProductTitle("");
                    setOrderLocation("");
                    setOrderDate(null);
                    setShopName("");
                    setStatusFilter("");
                  }}
                >
                  <Text style={{ color: "#888", fontWeight: "bold" }}>
                    Clear
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1, alignItems: "center" }}
                  onPress={() => {
                    fetchOrders({
                      sortOrder,
                      customerName,
                      productTitle,
                      orderLocation,
                      orderDate,
                      shopName,
                      statusFilter,
                    });
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={{ color: "#77BBA2", fontWeight: "bold" }}>
                    Apply
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1, alignItems: "center" }}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={{ color: "#777", fontWeight: "bold" }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Status Picker Modal */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={statusListVisible}
        onRequestClose={() => setStatusListVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setStatusListVisible(false)}
        >
          <View style={styles.modalContainer}>
            {["Delivered", "Delivered to Admin", ""].map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.modalOption}
                onPress={() => {
                  setStatusFilter(option); 
                  setStatusListVisible(false); 
                  setTimeout(() => {
                    setFilterModalVisible(true); 
                  }, 300); 
                }}
              >
                <Text style={styles.modalText}>{option || "All"}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: "#f8f8f8" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  filterButton: {
    alignSelf: "flex-end",
    marginBottom: 10,
    backgroundColor: "#77BBA2",
    padding: 8,
    borderRadius: 8,
    marginTop: 20,
  },
  filterButtonText: { color: "#fff", fontWeight: "bold" },
  shopBlock: { marginBottom: 30 },
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
  orderId: { fontWeight: "bold", marginBottom: 5, color: "#000" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    width: "90%",
  },
  modalInput: {
    backgroundColor: "#eee",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  label: { fontSize: 14, fontWeight: "bold", marginBottom: 5, color: "#333" },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
  deliveredButton: {
    backgroundColor: "#77BBA2",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  deliveredButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#eee",
  },

  activeTabButton: {
    backgroundColor: "#77BBA2",
  },

  tabButtonText: {
    fontWeight: "bold",
    color: "#333",
  },

  activeTabButtonText: {
    color: "#fff",
  },
  undoButton: {
    backgroundColor: "#dc3545", 
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  undoButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default OrdersScreen;

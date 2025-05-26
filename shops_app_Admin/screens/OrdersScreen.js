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
} from "react-native";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
const Order = require("../models/Order");

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
  const [allOrders, setAllOrders] = useState([]);
  const [shopName, setShopName] = useState("");
  const [shopNameSuggestions, setShopNameSuggestions] = useState([]);
  const [activeTab, setActiveTab] = useState("undelivered");

const markAsDelivered = async (orderId) => {
  try {
    const response = await axios.put(
      `http://localhost:5002/admin/orders/${orderId}/deliver`
    );
    const updatedOrder = response.data.order;

    setGroupedOrders((prevGrouped) => {
      const newGrouped = { ...prevGrouped };
      for (let shop in newGrouped) {
        newGrouped[shop] = newGrouped[shop].map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        );
      }
      return newGrouped;
    });
  } catch (error) {
    console.error("Failed to mark as delivered", error);
  }
};



  const fetchOrders = async (filters = {}) => {
  setLoading(true);
  try {
    const params = {
  sort: filters.sortOrder || sortOrder,
  customer: filters.customerName || "",
  product: filters.productTitle || "",
  location: filters.orderLocation || "",
  shopName: filters.shopName || "", 
};

    if (filters.orderDate) {
      params.date = filters.orderDate.toISOString().split("T")[0];
    }
    const res = await axios.get("http://localhost:5002/admin/grouped-orders", { params });
    setGroupedOrders(res.data.grouped);
    setAllOrders(res.data.all);
    setLoading(false);
  } catch (err) {
    console.error("Error fetching grouped orders:", err);
    setLoading(false);
  }
};


  useEffect(() => {
    fetchOrders();
  }, []);
const handleShopNameChange = (text) => {
  setShopName(text);
  const allShopNames =
    groupedOrders && typeof groupedOrders === "object"
      ? Array.from(
          new Set(
            Object.entries(groupedOrders).map(([shop]) => shop)
          )
        )
      : [];

  setShopNameSuggestions(
    allShopNames.filter((name) =>
      name.toLowerCase().includes(text.toLowerCase())
    )
  );
};
const undoDelivery = async (orderId) => {
  try {
    const response = await axios.put(
      `http://localhost:5002/admin/orders/${orderId}/undo-deliver`
    );
    const updatedOrder = response.data.order;

    setGroupedOrders((prevGrouped) => {
      const newGrouped = { ...prevGrouped };
      for (let shop in newGrouped) {
        newGrouped[shop] = newGrouped[shop].map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order
        );
      }
      return newGrouped;
    });
  } catch (error) {
    console.error("Failed to undo delivery", error);
  }
};

  const allCustomerNames =
    groupedOrders && typeof groupedOrders === "object"
      ? Array.from(
          new Set(
            Object.values(groupedOrders)
              .flat()
              .map((order) => order.userName)
              .filter(Boolean)
          )
        )
      : [];

  const handleCustomerNameChange = (text) => {
    setCustomerName(text);
    setNameSuggestions(
      allCustomerNames.filter((name) =>
        name.toLowerCase().includes(text.toLowerCase())
      )
    );
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
    const uniqueProducts = Array.from(new Set(productPool));
    setProductSuggestions(
      uniqueProducts.filter((title) =>
        title.toLowerCase().includes(text.toLowerCase())
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
      
<View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 , marginTop:10}}>
  <TouchableOpacity onPress={() => setActiveTab("undelivered")}>
    <Text style={{ fontWeight: activeTab === "undelivered" ? "bold" : "normal" }}>Not Delivered Yet</Text>
  </TouchableOpacity>
  <TouchableOpacity onPress={() => setActiveTab("delivered")}>
    <Text style={{ fontWeight: activeTab === "delivered" ? "bold" : "normal" }}>Delivered</Text>
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
        activeTab === "undelivered" ? order.status !== "Delivered" : order.status === "Delivered"
      )
      .map((order) => (
        <View key={order._id} style={styles.orderCard}>
          <Text style={styles.orderId}>Order ID: {order.orderId}</Text>
          <Text>Customer: {order.userName || "N/A"} | Phone: 0{order.userPhone || "N/A"}</Text>
          <Text>Location: {order.userLocation || "N/A"}</Text>
          <Text>Status: {order.status}</Text>
          <Text style={{ fontSize: 12, color: "#555", marginTop: 5 }}>
  Created At: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
</Text>

{order.deliveredToAdminAt && (
  <Text style={{ fontSize: 12, color: "#555" }}>
    Delivered to Admin: {new Date(order.deliveredToAdminAt).toLocaleDateString()}
  </Text>
)}


{order.status === "Delivered" && order.deliveredAt && (
  <Text style={{ fontSize: 12, color: "#28a745" }}>
    Delivered to Customer: {new Date(order.deliveredAt).toLocaleDateString()}
  </Text>
)}

{activeTab === "delivered" && order.status === "Delivered" && (
  <TouchableOpacity
    style={{ marginTop: 10 }}
    onPress={() => undoDelivery(order._id)}
  >
    <Text style={{ color: "red", fontWeight: "bold" }}>↩ Undo Delivery</Text>
  </TouchableOpacity>
)}

          <Text>Total: ₪{order.totalPrice?.toFixed(2)}</Text>
          <Text style={styles.sectionTitle}>Products:</Text>
          {order.products.map((prod, i) => (
            <Text key={i} style={styles.productItem}>
              • {prod.title} - {prod.quantity}× ₪{prod.price} | {prod.selectedColor} / {prod.selectedSize}
            </Text>
          ))}
          {activeTab === "undelivered" && (
            <TouchableOpacity
              style={{ marginTop: 10 }}
              onPress={() => markAsDelivered(order._id)}
            >
              <Text style={{ color: "green", fontWeight: "bold" }}>✅ Mark as Delivered</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
  </View>
))}


      <Modal visible={filterModalVisible} animationType="slide" transparent>
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
            {customerName.length > 0 && nameSuggestions.length > 0 && (
              <FlatList
                data={nameSuggestions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setCustomerName(item);
                      setNameSuggestions([]);
                    }}
                  >
                    <Text style={styles.suggestionItem}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
             <Text style={styles.label}>Shop Name</Text>
<TextInput
  placeholder="e.g. Zara"
  value={shopName}
  onChangeText={handleShopNameChange}
  style={styles.modalInput}
/>

{shopName.length > 0 && shopNameSuggestions.length > 0 && (
  <FlatList
    data={shopNameSuggestions}
    keyExtractor={(item, index) => index.toString()}
    renderItem={({ item }) => (
      <TouchableOpacity
        onPress={() => {
          setShopName(item);
          setShopNameSuggestions([]);
        }}
      >
        <Text style={styles.suggestionItem}>{item}</Text>
      </TouchableOpacity>
    )}
  />
)}


            <Text style={styles.label}>Product Title</Text>
            <TextInput
              placeholder="e.g. White T-shirt"
              value={productTitle}
              onChangeText={handleProductTitleChange}
              style={styles.modalInput}
            />
            {productTitle.length > 0 && productSuggestions.length > 0 && (
              <FlatList
                data={productSuggestions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setProductTitle(item);
                      setProductSuggestions([]);
                    }}
                  >
                    <Text style={styles.suggestionItem}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

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

            <TouchableOpacity
              onPress={() =>
                setSortOrder(sortOrder === "desc" ? "asc" : "desc")
              }
            >
              <Text style={styles.sortText}>
                Sort: {sortOrder === "desc" ? "Newest First" : "Oldest First"}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setCustomerName("");
                  setProductTitle("");
                  setOrderLocation("");
                  setOrderDate(null);
                  setSortOrder("desc");
                }}
              >
                <Text style={{ color: "red", fontWeight: "bold" }}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
   onPress={() => {
    fetchOrders({
      sortOrder,
      customerName,
      productTitle,
      orderLocation,
      orderDate,
      shopName,
    });
    setFilterModalVisible(false);
  }}
>
  <Text style={{ color: "#77BBA2", fontWeight: "bold" }}>Apply</Text>
</TouchableOpacity>


              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={{ color: "#777", fontWeight: "bold" }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    marginTop:20,
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
  sectionTitle: { fontWeight: "bold", marginTop: 10 },
  productItem: { fontSize: 13, color: "#555", marginLeft: 10, marginTop: 5 },
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
  suggestionItem: {
    paddingVertical: 8,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    color: "#333",
  },
  sortText: {
    color: "#77BBA2",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
});

export default OrdersScreen;

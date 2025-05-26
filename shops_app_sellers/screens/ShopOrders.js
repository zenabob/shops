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
import { Modal, TextInput, Button } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

const ShopOrdersScreen = ({ route, navigation }) => {
  const { userId, shopId } = route.params || {};
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const statusOptions = ["New", "Pending", "Prepared", "Delivered to Admin"];

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc");
  const [customerName, setCustomerName] = useState("");
  const [productTitle, setProductTitle] = useState("");
  const [orderLocation, setOrderLocation] = useState("");
  const [orderDate, setOrderDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const allCustomerNames = Array.from(
    new Set(orders.map((order) => order.userName).filter(Boolean))
  );
  const [productSuggestions, setProductSuggestions] = useState([]);
  useEffect(() => {
    if (shopId) fetchOrders();
  }, [shopId]);

  const handleProductTitleChange = (text) => {
    setProductTitle(text);

    let productPool = [];
    if (customerName) {
      productPool = orders
        .filter(
          (order) =>
            order.userName?.toLowerCase() === customerName.toLowerCase()
        )
        .flatMap((order) => order.products.map((p) => p.title));
    } else {
      productPool = orders.flatMap((order) =>
        order.products.map((p) => p.title)
      );
    }

    const uniqueProducts = Array.from(new Set(productPool));
    const filtered = uniqueProducts.filter((title) =>
      title.toLowerCase().includes(text.toLowerCase())
    );

    setProductSuggestions(filtered);
  };

  const fetchOrders = async () => {
    try {
      const params = {
        sort: sortOrder,
        customer: customerName,
        product: productTitle,
        location: orderLocation,
      };
      if (orderDate) {
        params.date = orderDate.toISOString().split("T")[0];
      }

      const res = await axios.get(
        `http://172.20.10.4:5000/shop/${shopId}/orders`,
        {
          params,
        }
      );

      setOrders(res.data);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
    }
  };
  const handleCustomerNameChange = (text) => {
    setCustomerName(text);
    if (text.length > 0) {
      const filtered = allCustomerNames.filter((name) =>
        name.toLowerCase().includes(text.toLowerCase())
      );
      setNameSuggestions(filtered);
    } else {
      setNameSuggestions([]);
    }
  };

 const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const response = await axios.put(`http://172.20.10.4:5000/orders/${orderId}/status`, {
      status: newStatus,
    });

    const updatedOrder = response.data.order;

    // ✅ تحديث الطلب بالكامل بما فيه deliveredToAdminAt
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.orderId === orderId ? updatedOrder : order
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
        Customer: {item.userName || "N/A"} | Phone number: 0
        {item.userPhone || "N/A"}
      </Text>
      <Text style={styles.location}>
        Location: {item.userLocation || "N/A"}
      </Text>

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
          • {prod.title} - {prod.quantity}× ₪{prod.price} | {prod.selectedColor}{" "}
          / {prod.selectedSize}
        </Text>
      ))}
<Text style={styles.dateInfo}>
  Created At: {new Date(item.createdAt).toLocaleDateString()}
</Text>
{item.status === "Delivered to Admin" && item.deliveredToAdminAt && (
  <Text style={styles.dateInfo}>
    Delivered To Admin: {new Date(item.deliveredToAdminAt).toLocaleDateString()}
  </Text>
)}


      <Text style={styles.total}>
        Total: ₪{item.totalPrice?.toFixed(2) || 0}
      </Text>
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
      <TouchableOpacity
        style={[
          styles.statusButton,
          { alignSelf: "flex-end", marginBottom: 10 },
        ]}
        onPress={() => setFilterModalVisible(true)}
      >
        <TouchableOpacity
          style={[styles.filterBtn]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Image
            source={require("../assets/img/filter.png")}
            style={styles.filterIcon}
          />
          <Text style={styles.filterText}>Filters</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={renderOrder}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Order Filters</Text>

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
                style={styles.suggestionsList}
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

            <Text style={styles.label}>Product Title</Text>
            <TextInput
              placeholder="e.g. White T-shirt"
              value={productTitle}
              onChangeText={(text) => handleProductTitleChange(text)}
              style={styles.modalInput}
            />
            {productTitle.length > 0 && productSuggestions.length > 0 && (
              <FlatList
                data={productSuggestions}
                keyExtractor={(item, index) => index.toString()}
                style={styles.suggestionsList}
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

            <Text style={styles.label}>Customer Location</Text>
            <TextInput
              placeholder="e.g. Jerusalem"
              value={orderLocation}
              onChangeText={setOrderLocation}
              style={styles.modalInput}
            />

            <Text style={styles.label}>Order Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[styles.modalInput, { justifyContent: "center" }]}
            >
              <Text style={{ color: "#333" }}>
                {orderDate
                  ? orderDate.toISOString().split("T")[0]
                  : "Choose Date"}
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
              style={[
                styles.statusButton,
                { marginTop: 15, alignSelf: "center" },
              ]}
              onPress={() => {
                setSortOrder(sortOrder === "desc" ? "asc" : "desc");
              }}
            >
              <Text style={styles.statusButtonText}>
                Sort: {sortOrder === "desc" ? "Newest" : "Oldest"}
              </Text>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => {
                  setCustomerName("");
                  setProductTitle("");
                  setOrderLocation("");
                  setOrderDate(null);
                  setSortOrder("desc");
                }}
              >
                <Text style={[styles.actionButton, { color: "red" }]}>
                  Clear
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  fetchOrders();
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.actionButton}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.actionButton}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: "#77BBA2",
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
  },
  orderId: { fontWeight: "bold", color: "#333" },
  customerInfo: { color: "#444", marginTop: 5 },
  location: { fontSize: 13, color: "#555" },
  status: { marginTop: 8, color: "#77BBA2", fontWeight: "bold" },
  total: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "bold",
    color: "#77BBA2",
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
    backgroundColor: "#77BBA2",
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
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },

  actionButton: {
    fontWeight: "bold",
    color: "#77BBA2",
    fontSize: 16,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#77BBA2",
    paddingHorizontal: 1,
    borderRadius: 10,
    alignSelf: "flex-end",
    marginBottom: 10,
  },

  filterIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },

  filterText: {
    color: "#fff",
    fontWeight: "bold",
  },
  suggestionsList: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 120,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  suggestionItem: {
    paddingVertical: 8,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
    color: "#333",
  },
  dateInfo: {
  fontSize: 12,
  color: "#666",
  marginTop: 5,
},

});

export default ShopOrdersScreen;

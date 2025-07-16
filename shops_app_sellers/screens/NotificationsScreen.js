import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import {API_BASE_URL} from "../config";

import axios from "axios";
const NotificationsScreen = ({ route, shopId, onUpdateCount }) => {

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (shopId) {
      fetchNotifications();
    }
  }, [shopId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/notifications/${shopId}?onlyUnread=true`
      );
      setNotifications(res.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Error", "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/notifications/${notificationId}/read`
      );
      setNotifications((prev) =>
  prev.filter((item) => item._id !== notificationId)
);

onUpdateCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error(" Error marking as read:", error);
      Alert.alert("Error", "Could not mark notification as read.");
    }
  };

  const renderNotification = ({ item }) => {
  const productTitle = item.productTitle  || "Unknown Product";
  const messageText = `Product: ${productTitle} in color ${item.color}, size ${item.size} is now sold out. Please update the stock.`;


  return (
    <View style={styles.notificationCard}>
      <Text style={styles.text}>{messageText}</Text>
      <TouchableOpacity
        onPress={() => markAsRead(item._id)}
        style={styles.checkButton}
      >
        <Image
          source={require("../assets/img/check.png")}
          style={styles.checkIcon}
        />
      </TouchableOpacity>
    </View>
  );
};


  return (
    
    <View style={styles.container}>
      <TouchableOpacity
              onPress={() =>
        navigation.navigate("MainScreen", {
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
      <Text style={styles.header}>🔔 New Notifications</Text>
      {notifications.length === 0 && !loading ? (
        <Text style={styles.empty}>No new notifications</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotification}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 18, fontWeight: "bold", marginBottom: 15 , marginTop:30 },
  empty: { fontSize: 16, color: "#666", marginTop: 20 },
  notificationCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  text: { flex: 1, fontSize: 14, color: "#333" },
  checkButton: {
    marginLeft: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  checkIcon: {
    width: 22,
    height: 22,
    tintColor: "green",
  },
  backButton:{
    marginTop:30,
  }
});

export default NotificationsScreen;

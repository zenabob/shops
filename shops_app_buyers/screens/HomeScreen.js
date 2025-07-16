import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ImageBackground,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  SafeAreaView,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

const HomeScreen = () => {
  const navigation = useNavigation(); 

  // State to hold form data
  const [form, setForm] = useState({ email: "", password: "" });

  // Toggle visibility of password
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Used to show a loading state when the user presses "Continue"
  const [loading, setLoading] = useState(false);

  // Store errors for email/password fields
  const [errors, setErrors] = useState({ email: "", password: "" });

  // Whenever the user types in the input, update the state
  const handleInputChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  // Handle login logic when "Continue" is pressed
  const handleLogin = async () => {
    // Clear previous errors
    setErrors({ email: "", password: "" });

    // If fields are empty, show relevant error messages
    if (!form.email.trim() || !form.password.trim()) {
      setErrors({
        email: !form.email.trim() ? "Email is required" : "",
        password: !form.password.trim() ? "Password is required" : "",
      });
      return;
    }

    setLoading(true); // Show loading state

    try {
      // Make API request to login
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json(); // Parse response JSON

      if (response.ok) {
        const userId = data.user?._id;
        if (userId) {
          await AsyncStorage.setItem("userId", userId); // Save userId for future use
          navigation.navigate("Main"); // Move to the main screen
        }
      } else {
        // Handle different types of login errors
        if (data.message === "Email not found") {
          setErrors({ email: "This email is not registered", password: "" });
        } else if (data.message === "Incorrect password") {
          setErrors({ email: "", password: "Incorrect password" });
        } else {
          Alert.alert("Login Failed", data.message || "Unknown error.");
        }
      }
    } catch (error) {
      // Network or server issue
      Alert.alert("Error", "Failed to connect to the server.");
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  return (
    <ImageBackground
      source={require("../assets/img/Background img.png")} // Background image
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"} // Ensure keyboard doesn't block input fields
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo image */}
            <Image
              source={require("../assets/img/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.title}>Login</Text>

            {/* Email input */}
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="email@domain.com"
              placeholderTextColor="#A9A9A9"
              keyboardType="email-address"
              onChangeText={(text) => handleInputChange("email", text)}
              value={form.email}
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}

            {/* Password input with eye icon */}
            <View
              style={[
                styles.inputContainer,
                errors.password && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.inputField}
                placeholder="Password"
                placeholderTextColor="#A9A9A9"
                secureTextEntry={!passwordVisible} // Hide text if not visible
                onChangeText={(text) => handleInputChange("password", text)}
                value={form.password}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)} // Toggle password visibility
              >
                <Image
                  source={require("../assets/img/ShowPassword.png")}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}

            {/* Forgot password link */}
            <TouchableOpacity
              onPress={() => navigation.navigate("ForgetPassword")}
            >
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Continue button */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleLogin}
              disabled={loading} // Disable button while loading
            >
              <Text style={styles.continueButtonText}>
                {loading ? "Loading..." : "Continue"}
              </Text>
            </TouchableOpacity>

            {/* Navigate to account creation */}
            <TouchableOpacity
              onPress={() => navigation.navigate("CreateAccount")}
            >
              <Text style={styles.createAccount}>Create account</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logo: {
    width: 500,
    height: 400,
    marginBottom: 50,
    marginTop: -130,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 25,
    marginTop: -100,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
    elevation: 2, // Adds subtle shadow
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 10,
    elevation: 2,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
  },
  icon: {
    width: 25,
    height: 25,
    tintColor: "gray",
  },
  forgotPassword: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
    alignSelf: "flex-end",
    marginBottom: 20,
    marginRight: 254, // Consider adjusting for smaller screens
  },
  continueButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#000",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  createAccount: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  inputError: {
    borderWidth: 1.5,
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 13,
    alignSelf: "flex-start",
    marginBottom: 5,
  },
});

export default HomeScreen;

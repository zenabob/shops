import React, { useState , useEffect } from "react";
import {
  View, Text, TextInput, StyleSheet, ImageBackground,
  Image, TouchableOpacity, Alert, ScrollView,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

// 🔐 HomeScreen is the login screen for sellers
const HomeScreen = () => {
  const navigation = useNavigation();

  // State for form input fields
  const [form, setForm] = useState({ email: "", password: "" });

  // Controls password visibility toggle
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Loading state during login
  const [loading, setLoading] = useState(false);

  // Holds validation or API error messages
  const [errors, setErrors] = useState({});

  // On component mount: clear any previous login session
  useEffect(() => {
    const clearSession = async () => {
      await AsyncStorage.removeItem("userId");
    };
    clearSession();
  }, []);

  // Handle changes in email or password fields
  const handleInputChange = (name, value) => {
    setForm({ ...form, [name]: value });

    // Remove error message as user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Handle login button press
  const handleLogin = async () => {
    let formErrors = {};

    // Frontend validation
    if (!form.email.trim()) formErrors.email = "Email is required";
    if (!form.password.trim()) formErrors.password = "Password is required";

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true); // Show loading state

    try {
      // Send login request to backend
      const response = await fetch(`${API_BASE_URL}/loginSeller`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      console.log("Server Response:", data);

      // Successful login
      if (response.ok) {
        if (data.userId) {
          // Store user ID in AsyncStorage for session persistence
          await AsyncStorage.setItem("userId", data.userId);
        }

        setForm({ email: "", password: "" });
        setErrors({});

        // Navigate to main screen, reset the stack
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "Main",
              params: { userId: data.userId, shopId: data.shopId },
            },
          ],
        });

      } else {
        // Handle server-side errors
        if (data.field && data.message) {
          setErrors((prev) => ({ ...prev, [data.field]: data.message }));
        } else {
          setErrors({ general: "Login failed. Please try again." });
        }
      }
    } catch (error) {
      console.error("Connection error:", error);
      setErrors({ general: "Failed to connect to the server." });
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  return (
    <ImageBackground
      source={require("../assets/img/Background img.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

            {/* App logo */}
            <Image
              source={require("../assets/img/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            {/* Login title */}
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
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* Password input with show/hide toggle */}
            <View style={[styles.inputContainer, errors.password && styles.inputError]}>
              <TextInput
                style={styles.inputField}
                placeholder="Password"
                placeholderTextColor="#A9A9A9"
                secureTextEntry={!passwordVisible}
                onChangeText={(text) => handleInputChange("password", text)}
                value={form.password}
              />
              <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                <Image
                  source={require("../assets/img/ShowPassword.png")}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            {errors.general && <Text style={styles.errorTextCenter}>{errors.general}</Text>}

            {/* Forgot password link */}
            <TouchableOpacity onPress={() => navigation.navigate("ForgetPassword")}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "Loading..." : "Continue"}</Text>
            </TouchableOpacity>

            {/* Create account link */}
            <TouchableOpacity onPress={() => navigation.navigate("CreateAccount")}>
              <Text style={styles.createAccount}>Create account</Text>
            </TouchableOpacity>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};


const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 40,
        marginTop:-80,

  },
  logo: {
    width: 500,
    height: 400,
    marginBottom: 40,
    marginTop:-17,
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 50,
    marginTop:-70,

  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
    elevation: 2,
  },
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    elevation: 2,
    marginBottom: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: "gray",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "black",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  forgotPassword: {
    fontSize: 14,
    color: "#000",
    alignSelf: "flex-end",
    marginBottom: 10,
    fontWeight: "bold",
    marginRight: 220,
  },
  createAccount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    marginTop: 15,
  },
  inputError: {
    borderColor: "red",
    borderWidth: 1.5,
  },
  errorText: {
    color: "red",
    fontSize: 13,
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  errorTextCenter: {
    color: "red",
    fontSize: 13,
    alignSelf: "center",
    marginBottom: 10,
  },
});

export default HomeScreen;

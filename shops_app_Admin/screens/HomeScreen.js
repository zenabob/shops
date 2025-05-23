import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ImageBackground,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HomeScreen = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isImageReady, setImageReady] = useState(false);
  const handleInputChange = (name, value) => {
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleLogin = async () => {
    let formErrors = {};

    // Client-side validation
    if (!form.email.trim()) {
      formErrors.email = "Email is required";
    }
    if (!form.password.trim()) {
      formErrors.password = "Password is required";
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://172.20.10.4:5002/loginSeller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      console.log("Server Response:", data);

      if (response.ok) {
        if (data.userId) {
          await AsyncStorage.setItem("userId", data.userId);
        } else {
          console.warn("No userId returned from server!");
        }
        setForm({ email: "", password: "" });
        setErrors({});
       navigation.navigate("Main", {
  userId: data.userId,
});

      } else {
        // Check if the backend sends a `field` and `message` pair
        if (data.field && data.message) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            [data.field]: data.message,
          }));
        } else {
          // fallback
          setErrors((prevErrors) => ({
            ...prevErrors,
            general: "Login failed. Please try again.",
          }));
        }
      }
    } catch (error) {
      console.error("Connection error:", error);
      setErrors({ general: "Failed to connect to the server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/img/Background img.png")}
      onLoadEnd={() => setImageReady(true)}
      style={styles.background}
      resizeMode="cover"
    >
      <Image
        source={require("../assets/img/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>

        {/* Email Input */}
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="email@domain.com"
          placeholderTextColor="#A9A9A9"
          keyboardType="email-address"
          onChangeText={(text) => handleInputChange("email", text)}
          value={form.email}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        {/* Password Input with Eye Icon */}
        <View
          style={[styles.inputContainer, errors.password && styles.inputError]}
        >
          <TextInput
            style={styles.inputField}
            placeholder="Password"
            placeholderTextColor="#A9A9A9"
            secureTextEntry={!passwordVisible}
            onChangeText={(text) => handleInputChange("password", text)}
            value={form.password}
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            <Image
              source={require("../assets/img/ShowPassword.png")}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>
        {errors.password && (
          <Text style={styles.errorText}>{errors.password}</Text>
        )}
        {errors.general && (
          <Text style={[styles.errorText, { alignSelf: "center", top: -110 }]}>
            {errors.general}
          </Text>
        )}


        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? "Loading..." : "Continue"}
          </Text>
        </TouchableOpacity>

        

        {/* Create Account */}
        <TouchableOpacity onPress={() => navigation.navigate("CreateAccount")}>
          <Text style={styles.createAccount}>Create account</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    alignItems: "center",
    top: SCREEN_HEIGHT * 0.55,
    position: "absolute",
  },
  logo: {
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_HEIGHT * 0.6,
    top: SCREEN_HEIGHT * -0.1,
    justifyContent: "center",
    position: "absolute",
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#77BBA2",
    marginBottom: 20,
    top: SCREEN_HEIGHT * -0.17,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    elevation: 3,
    top: SCREEN_HEIGHT * -0.17,
  },
  inputContainer: {
    flexDirection: "row",
    height: 50,
    alignItems: "center",
    backgroundColor: "white",
    width: "100%",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    elevation: 3,
    top: SCREEN_HEIGHT * -0.17,
  },
  inputField: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  icon: {
    width: 25,
    height: 25,
    tintColor: "gray",
  },
  forgotPassword: {
    fontSize: 12,
    fontWeight: "bold",
    color: "black",
    alignSelf: "flex-start",
    marginBottom: 15,
    left: -120,
    top: SCREEN_HEIGHT * -0.17,
  },
  continueButton: {
    width: "100%",
    height: 50,
    backgroundColor: "black",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    top: SCREEN_HEIGHT * -0.17,
  },
  continueButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  googleButton: {
    width: "100%",
    height: 50,
    backgroundColor: "white",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
    elevation: 3,
    justifyContent: "center",
    alignItems: "center",
    top: SCREEN_HEIGHT * -0.17,
  },
  socialIcon: {
    width: 25,
    height: 25,
    marginRight: 10,
    backgroundColor: "white",
    color: "white",
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  createAccount: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    top: SCREEN_HEIGHT * -0.17,
  },
  inputError: {
    borderWidth: 2,
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    alignSelf: "flex-start",
    marginBottom: 5,
    top: -167,
  },
});

export default HomeScreen;

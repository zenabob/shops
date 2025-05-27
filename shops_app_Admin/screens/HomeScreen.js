import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ImageBackground,
  Image,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (name, value) => {
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleLogin = async () => {
    let formErrors = {};

    if (!form.email.trim()) formErrors.email = "Email is required";
    if (!form.password.trim()) formErrors.password = "Password is required";
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://172.20.10.4:5002/loginAdmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (response.ok) {
        if (data.userId) {
          await AsyncStorage.setItem("userId", data.userId);
        }
        setForm({ email: "", password: "" });
        setErrors({});
        navigation.navigate("Main", { userId: data.userId });
      } else {
        if (data.field && data.message) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            [data.field]: data.message,
          }));
        } else {
          setErrors({ general: "Login failed. Please try again." });
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
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Image
              source={require("../assets/img/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Login</Text>

            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="email@domain.com"
              placeholderTextColor="#A9A9A9"
              keyboardType="email-address"
              onChangeText={(text) => handleInputChange("email", text)}
              value={form.email}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}

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
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
            {errors.general && (
              <Text style={[styles.errorText, { alignSelf: "center" }]}>
                {errors.general}
              </Text>
            )}

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.continueButtonText}>
                {loading ? "Loading..." : "Continue"}
              </Text>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: 550,
    height: 500,
    marginBottom: 10,
    marginTop: -100,
  },
  title: {
    fontSize: 45,
    fontWeight: "bold",
    color: "#77BBA2",
    marginBottom: 55,
    marginTop: -100,

  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: "row",
    height: 50,
    alignItems: "center",
    backgroundColor: "white",
    width: "100%",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    elevation: 3,
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
  continueButton: {
    width: "100%",
    height: 50,
    backgroundColor: "black",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 15,
  },
  continueButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  createAccount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
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
  },
});

export default HomeScreen;

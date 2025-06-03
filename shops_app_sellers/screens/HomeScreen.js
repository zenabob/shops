import React, { useState , useEffect} from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {API_BASE_URL} from "../config";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
useEffect(() => {
  const clearSession = async () => {
    await AsyncStorage.removeItem("userId"); 
  };
  clearSession();
}, []);

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
      const response = await fetch(`${API_BASE_URL}/loginSeller`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      console.log("Server Response:", data);

      if (response.ok) {
        if (data.userId) {
          await AsyncStorage.setItem("userId", data.userId);
        }
        setForm({ email: "", password: "" });
        setErrors({});
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
      setLoading(false);
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
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

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

            <TouchableOpacity onPress={() => navigation.navigate("ForgetPassword")}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "Loading..." : "Continue"}</Text>
            </TouchableOpacity>

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
    marginTop:-40,
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

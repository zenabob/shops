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
  KeyboardAvoidingView,
  Platform,
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

  const handleInputChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  
  const handleLogin = async () => {
    setErrors({ email: '', password: '' }); // Reset errors
  
    if (!form.email.trim() || !form.password.trim()) {
      setErrors({
        email: !form.email.trim() ? 'Email is required' : '',
        password: !form.password.trim() ? 'Password is required' : '',
      });
      return;
    }
  
    setLoading(true);
    try {
      const response = await fetch("http://172.20.10.4:5001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        const userId = data.user?._id;
        if (userId) {
          await AsyncStorage.setItem("userId", userId);
          navigation.navigate("Main");
        }
      } else {
        if (data.message === 'Email not found') {
          setErrors({ email: 'This email is not registered', password: '' });
        } else if (data.message === 'Incorrect password') {
          setErrors({ email: '', password: 'Incorrect password' });
        } else {
          Alert.alert("Login Failed", data.message || "Unknown error.");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ImageBackground
        source={require("../assets/img/Background img.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.container}>
          <Image
            source={require("../assets/img/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Login</Text>

          {/* Email Input */}
          <TextInput
            style={styles.input}
            placeholder="email@domain.com"
            placeholderTextColor="#A9A9A9"
            keyboardType="email-address"
            onChangeText={(text) => handleInputChange("email", text)}
          />
{errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}


          {/* Password Input with Eye Icon */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputField}
              placeholder="Password"
              placeholderTextColor="#A9A9A9"
              secureTextEntry={!passwordVisible}
              onChangeText={(text) => handleInputChange("password", text)}
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
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => navigation.navigate("ForgetPassword")}
          >
            <Text style={styles.forgotPassword}>Forgot Password ?</Text>
          </TouchableOpacity>

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
          <TouchableOpacity
            onPress={() => navigation.navigate("CreateAccount")}
          >
            <Text style={styles.createAccount}>Create account</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height:'150%'
  },
  container: {
    width: "85%",
    alignItems: "center",
  },
  logo: {
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_HEIGHT * 0.6,
    top: SCREEN_HEIGHT * -0.079,
    justifyContent: "center",
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    top: SCREEN_HEIGHT * -0.2,
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
    left: -105,
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
});

export default HomeScreen;

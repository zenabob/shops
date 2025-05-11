import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const ResetPasswordScreen = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (name, value) => {
    setForm({ ...form, [name]: value });

    // Remove error message when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // ✅ Validate password (6-14 chars, uppercase, lowercase, number, symbol)
  const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\/])[A-Za-z\d@$!%*?&\/]{6,14}$/;
    return passwordRegex.test(password);
  };

  const validateForm = async () => {
    let newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(form.email))
      newErrors.email = "Invalid email format";

    if (!form.password.trim()) newErrors.password = "Password is required";
    else if (!isValidPassword(form.password))
      newErrors.password =
        "Password must be 6-14 characters, include uppercase, lowercase, number, and symbol.";

    if (!form.confirmPassword.trim())
      newErrors.confirmPassword = "Confirm Password is required";
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!(await validateForm())) return;
    setLoading(true);
  
    try {
      const response = await fetch("http://172.20.10.4:5001/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        console.log("Success", "Password updated successfully!");
        navigation.navigate("Home");
      } else {
        if (data.message === "Email does not exist") {
          setErrors({ email: "Email does not exist" });
        } else if (data.message === "New password must be different from the old password.") {
          setErrors({ password: "New password must be different from the old one" });
        } else if (data.message === "Passwords do not match") {
          setErrors({ confirmPassword: "Passwords do not match" });
        } else {
          setErrors({ general: data.message || "Something went wrong" });
        }
        
      }
    } catch (error) {
      console.log("Error", "Failed to connect to the server.");
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
      <TouchableOpacity onPress={() => navigation.navigate("Home")}>
        <Image
          source={require("../assets/img/Arrow Left Contained 01.png")}
          style={styles.arrow}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={form.email}
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Enter your email"
          placeholderTextColor="#A9A9A9"
          keyboardType="email-address"
          onChangeText={(text) => handleInputChange("email", text)}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        {/* New Password */}
        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Enter your new password"
          placeholderTextColor="#A9A9A9"
          secureTextEntry
          onChangeText={(text) => handleInputChange("password", text)}
        />
        {errors.password && (
          <Text style={styles.errorText}>{errors.password}</Text>
        )}

        {/* Confirm New Password */}
        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput
          style={[styles.input, errors.confirmPassword && styles.inputError]}
          placeholder="Confirm your new password"
          placeholderTextColor="#A9A9A9"
          secureTextEntry
          onChangeText={(text) => handleInputChange("confirmPassword", text)}
        />
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}

        {/* Submit Button */}
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {loading ? "Updating..." : "Send"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    width: "70%",
    alignItems: "center",
    top: 200,
  },
  label: {
    fontSize: 19,
    fontWeight: "bold",
    color: "black",
    marginBottom: 5,
    right: 10,
    paddingHorizontal: 15,
    alignSelf: "flex-start",
  },
  input: {
    width: 300,
    height: 45,
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
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
  button: {
    width: 200,
    height: 50,
    backgroundColor: "black",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  arrow: {
    width: 40,
    height: 35,
    top: 75,
    left: -180,
  },
});

export default ResetPasswordScreen;

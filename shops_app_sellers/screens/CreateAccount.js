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
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Alert } from "react-native";
const RegisterScreen = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    shopName: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    location: "",
    phoneNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (name, value) => {
    setForm({ ...form, [name]: value.trim() });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = async () => {
    let newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\/])[A-Za-z\d@$!%*?&\/]{6,14}$/;
    const nameLocationRegex = /^[A-Za-z\s]+$/;

    if (!form.shopName.trim()) {
      newErrors.shopName = "Shop's Name is required";
    }

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full Name is required";
    } else if (!nameLocationRegex.test(form.fullName)) {
      newErrors.fullName = "Full Name can only contain letters and spaces";
    }

    if (!form.location.trim()) {
      newErrors.location = "Location is required";
    } else if (!nameLocationRegex.test(form.location)) {
      newErrors.location = "Location can only contain letters and spaces";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(form.password.trim())) {
      newErrors.password =
        "Password must be 6-14 characters, include uppercase, lowercase, number, and symbol.";
    }

    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    const israeliPhoneRegex = /^(05\d{8}|07[2-9]\d{7}|0[2-4,8-9]\d{7})$/;
    if (!form.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!israeliPhoneRegex.test(form.phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number";
    }

    setErrors((prevErrors) => ({ ...prevErrors, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    setLoading(true);
    try {
      const response = await fetch("http://172.20.10.4:5000/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phoneNumber: String(form.phoneNumber), // Convert phoneNumber to String
        }),
      });

      const text = await response.text();
      console.log("Server Response:", text);

      if (!text) {
        throw new Error("Empty response from server");
      }

      const data = JSON.parse(text);

      if (response.ok) {
        Alert.alert(
          "",
          "Your account has been created. An admin will contact you for verification.",
          [{ text: "OK", onPress: () => navigation.navigate("Home") }]
        );
        navigation.navigate("Home");
      } else {
        console.log("Error:", data.error);
        setErrors(data.error || {});
      }
    } catch (error) {
      console.error("Error:", error);
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ImageBackground
          source={require("../assets/img/Background img.png")}
          style={styles.background}
          resizeMode="cover"
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("Home")}
            style={styles.arrowContainer}
          >
            <Image
              source={require("../assets/img/Arrow Left Contained 01.png")}
              style={styles.arrow}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {Object.keys(errors).length > 0 && (
              <Text style={styles.errorText}>
                {errors.general || "Please fix the errors below"}
              </Text>
            )}

            <Text style={styles.label}>Shop's Name</Text>
            <TextInput
              style={[styles.input, errors.shopName && styles.inputError]}
              placeholder="Enter your shop's name"
              placeholderTextColor="#A9A9A9"
              onChangeText={(text) => handleInputChange("shopName", text)}
            />
            {errors.shopName && (
              <Text style={styles.errorText}>{errors.shopName}</Text>
            )}

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, errors.fullName && styles.inputError]}
              placeholder="Enter your full name"
              placeholderTextColor="#A9A9A9"
              onChangeText={(text) => handleInputChange("fullName", text)}
            />
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Enter your email"
              placeholderTextColor="#A9A9A9"
              keyboardType="email-address"
              onChangeText={(text) => handleInputChange("email", text)}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Enter your password"
              placeholderTextColor="#A9A9A9"
              secureTextEntry
              onChangeText={(text) => handleInputChange("password", text)}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[
                styles.input,
                errors.confirmPassword && styles.inputError,
              ]}
              placeholder="Confirm your password"
              placeholderTextColor="#A9A9A9"
              secureTextEntry
              onChangeText={(text) =>
                handleInputChange("confirmPassword", text)
              }
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={[styles.input, errors.location && styles.inputError]}
              placeholder="Enter your location"
              placeholderTextColor="#A9A9A9"
              onChangeText={(text) => handleInputChange("location", text)}
            />
            {errors.location && (
              <Text style={styles.errorText}>{errors.location}</Text>
            )}

            <Text style={styles.label}>Phone number</Text>
            <TextInput
              style={[styles.input, errors.phoneNumber && styles.inputError]}
              placeholder="Enter your Phone number"
              placeholderTextColor="#A9A9A9"
              keyboardType="phone-pad"
              onChangeText={(text) => handleInputChange("phoneNumber", text)}
              value={form.phoneNumber}
            />
            {errors.phoneNumber && (
              <Text style={styles.errorText}>{errors.phoneNumber}</Text>
            )}
            <Text style={styles.label}>Percent</Text>
            <TextInput
              style={styles.input}
              value="3%"
              editable={false}
              selectTextOnFocus={false}
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Send</Text>
            </TouchableOpacity>
          </ScrollView>
        </ImageBackground>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "150%",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    // paddingBottom: 30, // Prevents last input from being hidden
  },
  container: {
    width: "70%",
    alignItems: "center",
    top: 100,
    paddingBottom: 120,
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
    marginBottom: 5,
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
    left: -170,
  },
});

export default RegisterScreen;

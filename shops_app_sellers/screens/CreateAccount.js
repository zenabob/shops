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
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { API_BASE_URL } from "../config";

const RegisterScreen = () => {
  const navigation = useNavigation();

  // Form state to hold input values
  const [form, setForm] = useState({
    shopName: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    location: "",
    phoneNumber: "",
  });

  // Error state to display validation or server errors
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false); // Loading state for submit button

  // Update form inputs and clear related errors on typing
  const handleInputChange = (name, value) => {
    setForm({ ...form, [name]: value.trim() });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Validate form fields before submission
  const validateForm = async () => {
    let newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\/])[A-Za-z\d@$!%*?&\/]{6,14}$/;
    const nameLocationRegex = /^[A-Za-z\s]+$/;
    const israeliPhoneRegex = /^(05\d{8}|07[2-9]\d{7}|0[2-4,8-9]\d{7})$/;

    if (!form.shopName.trim()) newErrors.shopName = "Shop's Name is required";

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
    } else if (!passwordRegex.test(form.password)) {
      newErrors.password =
        "Password must be 6-14 characters, include uppercase, lowercase, number, and symbol.";
    }

    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm Password is required";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!form.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!israeliPhoneRegex.test(form.phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number";
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/create-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phoneNumber: String(form.phoneNumber), 
        }),
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (response.ok) {
        Alert.alert(
          "",
          "Your account has been created. An admin will contact you for verification.",
          [{ text: "OK", onPress: () => navigation.navigate("Home") }]
        );
      } else {
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
          {/* Back Arrow */}
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

          {/* Form Inputs */}
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Display general error */}
            {Object.keys(errors).length > 0 && (
              <Text style={styles.errorText}>
                {errors.general || "Please fix the errors below"}
              </Text>
            )}

            {/* Individual fields with labels and validation */}
            {[
              ["Shop's Name", "shopName"],
              ["Full Name", "fullName"],
              ["Email", "email"],
              ["Password", "password", true],
              ["Confirm Password", "confirmPassword", true],
              ["Location", "location"],
              ["Phone number", "phoneNumber"],
            ].map(([label, key, isPassword]) => (
              <React.Fragment key={key}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={[styles.input, errors[key] && styles.inputError]}
                  placeholder={`Enter your ${label.toLowerCase()}`}
                  placeholderTextColor="#A9A9A9"
                  onChangeText={(text) => handleInputChange(key, text)}
                  keyboardType={
                    key === "email"
                      ? "email-address"
                      : key === "phoneNumber"
                      ? "phone-pad"
                      : "default"
                  }
                  secureTextEntry={isPassword}
                  value={form[key]}
                />
                {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
              </React.Fragment>
            ))}

            {/* Static Percent Field */}
            <Text style={styles.label}>Percent</Text>
            <TextInput
              style={styles.input}
              value="3%"
              editable={false}
              selectTextOnFocus={false}
            />

            {/* Submit button */}
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>{loading ? "Sending..." : "Send"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </ImageBackground>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

// Styles
const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "150%",
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

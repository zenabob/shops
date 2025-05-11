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
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Modal, 
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    location: "",
    PhoneNumber: "",
    age: "",
    Gender: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const genderOptions = ["Male", "Female"];

  const handleInputChange = (name, value) => {
    const cleanValue = typeof value === "string" ? value.trim() : value;
    setForm({ ...form, [name]: cleanValue });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = async () => {
    let newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&/])[A-Za-z\d@$!%*?&/]{6,14}$/;
    const nameLocationRegex = /^[A-Za-z\s]+$/;

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full Name is required";
    } else if (!nameLocationRegex.test(form.fullName)) {
      newErrors.fullName = "Only letters and spaces are allowed";
    }

    if (!form.location.trim()) {
      newErrors.location = "Location is required";
    } else if (!nameLocationRegex.test(form.location)) {
      newErrors.location = "Only letters and spaces are allowed";
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
        "Password must be 6-14 characters and include uppercase, lowercase, number, and symbol";
    }

    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!form.age.trim()) {
      newErrors.age = "Age is required";
    } else if (isNaN(form.age) || form.age < 15 || form.age > 100) {
      newErrors.age = "Age must be between 15 and 100";
    }

    if (!form.PhoneNumber.trim() || form.PhoneNumber.length < 6) {
      newErrors.PhoneNumber = "Valid phone number is required";
    }

    if (!form.Gender) {
      newErrors.Gender = "Gender is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    setLoading(true);
    try {
      const response = await fetch("http://172.20.10.4:5001/UserAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
        }),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (response.ok) {
        Alert.alert("Success", "Account created successfully!");
        navigation.navigate("Home");
      } else {
        setErrors(data.error || { general: "Something went wrong." });
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
            {[
              {
                label: "Full Name",
                name: "fullName",
                placeholder: "Enter your full name",
              },
              {
                label: "Email",
                name: "email",
                placeholder: "Enter your email",
                keyboardType: "email-address",
              },
              {
                label: "Password",
                name: "password",
                placeholder: "Enter your password",
                secure: true,
              },
              {
                label: "Confirm Password",
                name: "confirmPassword",
                placeholder: "Confirm your password",
                secure: true,
              },
              {
                label: "Location",
                name: "location",
                placeholder: "Enter your location",
              },
              {
                label: "Age",
                name: "age",
                placeholder: "Enter your age",
                keyboardType: "numeric",
              },
              {
                label: "Phone Number",
                name: "PhoneNumber",
                placeholder: "Enter your phone number",
                keyboardType: "numeric",
              },
            ].map(({ label, name, placeholder, keyboardType, secure }) => (
              <View key={name}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={[styles.input, errors[name] && styles.inputError]}
                  placeholder={placeholder}
                  placeholderTextColor="#A9A9A9"
                  onChangeText={(text) => handleInputChange(name, text)}
                  secureTextEntry={secure}
                  keyboardType={keyboardType}
                />
                {errors[name] && (
                  <Text style={styles.errorText}>{errors[name]}</Text>
                )}
              </View>
            ))}

            <Text style={styles.label}>Gender</Text>
            <TouchableOpacity
              style={[styles.input, styles.pickerWrapper]}
              onPress={() => setGenderModalVisible(true)}
            >
              <Text style={{ color: form.Gender ? "#000" : "#A9A9A9" }}>
                {form.Gender || "Select Gender..."}
              </Text>
            </TouchableOpacity>
            {errors.Gender && (
              <Text style={styles.errorText}>{errors.Gender}</Text>
            )}

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>
                {loading ? "Sending..." : "Send"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
          <Modal
  transparent={true}
  animationType="slide"
  visible={genderModalVisible}
  onRequestClose={() => setGenderModalVisible(false)}
>
  <TouchableOpacity
    style={styles.modalOverlay}
    activeOpacity={1}
    onPressOut={() => setGenderModalVisible(false)}
  >
    <View style={styles.modalContainer}>
      {genderOptions.map((option) => (
        <TouchableOpacity
          key={option}
          style={styles.modalOption}
          onPress={() => {
            handleInputChange("Gender", option.toLowerCase());
            setGenderModalVisible(false);
          }}
        >
          <Text style={styles.modalText}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </TouchableOpacity>
</Modal>

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
  },
  container: {
    width: "70%",
    alignItems: "center",
    paddingTop: 100,
    paddingBottom: 100,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
    alignSelf: "flex-start",
    marginBottom: 5,
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
    fontSize: 13,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  pickerWrapper: {
    justifyContent: "center",
    height: 45,
    borderRadius: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: "white",
    zIndex: 999, // <-- Add this
  },

  picker: {
    width: "100%",
    color: "#000",
    zIndex: 1000, // Add this line
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    width: "80%",
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  modalOption: {
    paddingVertical: 10,
  },
  modalText: {
    fontSize: 18,
    textAlign: "center",
  },
  
});

export default RegisterScreen;

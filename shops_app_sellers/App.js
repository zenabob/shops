// App.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { Text } from 'react-native'; 

import HomeScreen from './screens/HomeScreen';
import MainScreen from './screens/MainScreen';
import CreateAccount from './screens/CreateAccount';
import ForgetPassword from './screens/ForgetPassword';
import Offer from './screens/Offer'

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function MainDrawerWrapper({ route }) {
  const { userId } = route.params;

  console.log("🧩 MainDrawerWrapper - userId:", userId); // ADD THIS

  return <MainDrawer userId={userId} />;
}


function MainDrawer({ userId }) {
  console.log("📦 MainDrawer - received userId:", userId); // ADD THIS

  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }}>
      <Drawer.Screen
        name="MainScreen"
        component={MainScreen}
        options={{ drawerLabel: "Profile Account" }}
        initialParams={{ userId }}
      />
      <Drawer.Screen name="Orders" component={() => <Text>Orders Screen</Text>} />
      <Drawer.Screen name="Make an Offer">
        {props => {
          console.log("🛍️ Offer Screen - props received:", props); // ADD THIS
          return <Offer {...props} userId={userId} />;
        }}
      </Drawer.Screen>
      <Drawer.Screen name="Logout" component={HomeScreen} />
    </Drawer.Navigator>
  );
}


export default function App() {
  return (
    <ActionSheetProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Main" component={MainDrawerWrapper} />
          <Stack.Screen name="CreateAccount" component={CreateAccount} />
          <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
        </Stack.Navigator>
      </NavigationContainer>
    </ActionSheetProvider>
  );
}

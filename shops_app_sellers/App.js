// App.js

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import axios from "axios";
import { useNavigation } from '@react-navigation/native';
import {API_BASE_URL} from "./config";

import { Text } from 'react-native'; 

import HomeScreen from './screens/HomeScreen';
import MainScreen from './screens/MainScreen';
import CreateAccount from './screens/CreateAccount';
import ForgetPassword from './screens/ForgetPassword';
import Offer from './screens/Offer'
import ShopOrdersScreen from './screens/ShopOrders';
import NotificationsScreen from './screens/NotificationsScreen';
import DashboardScreen from './screens/DashboardScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function MainDrawerWrapper({ route }) {
  const [userId, setUserId] = useState(null);
  const [shopId, setShopId] = useState(null);

  useEffect(() => {
    const loadParams = async () => {
      const storedUserId = await AsyncStorage.getItem("userId");
      const storedShopId = await AsyncStorage.getItem("shopId");
      const paramUserId = route?.params?.userId || storedUserId;
      const paramShopId = route?.params?.shopId || storedShopId;

      setUserId(paramUserId);
      setShopId(paramShopId);
    };

    loadParams();
  }, [route]);

  if (!userId || !shopId) return null;

  return <MainDrawer userId={userId} shopId={shopId} />;
}


function MainDrawer({ userId, shopId }) {
  const navigation = useNavigation(); 
  const [notificationCount, setNotificationCount] = React.useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      if (!shopId) return;
      try {
        const res = await axios.get(
          `${API_BASE_URL}/notifications/${shopId}?onlyUnread=true`
        );
        setNotificationCount(res.data.length);
      } catch (err) {
        console.error("Failed to fetch notification count", err);
      }
    };

    fetchCount();

    const interval = setInterval(fetchCount, 10000);

    const unsubscribe = navigation.addListener("focus", () => {
      fetchCount(); 
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [shopId, navigation]);

  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }}>
      <Drawer.Screen
        name="MainScreen"
        component={MainScreen}
        options={{ drawerLabel: "Profile Account" }}
        initialParams={{ userId }}
      />
      <Drawer.Screen
  name="Notifications"
  options={{
    drawerLabel: `Notifications${notificationCount > 0 ? ` (${notificationCount})` : ""}`,
  }}
>
  {props => (
    <NotificationsScreen
      {...props}
      shopId={shopId}
      onUpdateCount={setNotificationCount} 
    />
  )}
</Drawer.Screen>
<Drawer.Screen
  name="Dashboard"
  options={{ drawerLabel: " Dashboard" }}
>
  {props => <DashboardScreen {...props} shopId={shopId} />}
</Drawer.Screen>

      <Drawer.Screen
        name="Orders"
        component={ShopOrdersScreen}
        initialParams={{ userId, shopId }}
      />
      <Drawer.Screen name="Make an Offer">
        {props => <Offer {...props} userId={userId} />}
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

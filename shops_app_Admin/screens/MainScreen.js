import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import OrdersScreen from './OrdersScreen';
import PendingShopsScreen from './PendingShopsScreen';
import ApprovedShopsScreen from './ApprovedShopsScreen';

const Tab = createMaterialTopTabNavigator();

const MainScreen = () => {
  return (
    <Tab.Navigator
      initialRouteName="Orders"
      screenOptions={{
        tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' },
        tabBarIndicatorStyle: { backgroundColor: 'black' },
        tabBarStyle: { backgroundColor: '#f0f0f0' },
      }}
    >
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name="ApprovedShops" component={ApprovedShopsScreen} options={{ title: 'Approved Shops' }} />
      <Tab.Screen name="PendingShops" component={PendingShopsScreen} options={{ title: 'Pending Shops' }} />
    </Tab.Navigator>
  );
};

export default MainScreen;

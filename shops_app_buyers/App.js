import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from './screens/HomeScreen';
import MainScreen from './screens/MainScreen';
import CreateAccount from './screens/CreateAccount'; 
import ForgetPassword from './screens/ForgetPassword'; 
import ShopProfile from './screens/ShopProfileScreen';
import CartScreen from './screens/CartScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import ResultOfSearch from './screens/ResultOfSearch';
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Main" component={MainScreen}options={{ headerShown: false }}/>
        <Stack.Screen name="CreateAccount" component={CreateAccount}options={{ headerShown: false }} />
        <Stack.Screen name="ForgetPassword" component={ForgetPassword}options={{ headerShown: false }} />  
        <Stack.Screen name="ShopProfile" component={ShopProfile}options={{ headerShown: false }} />  
        <Stack.Screen name="Cart" component={CartScreen}options={{ headerShown: false }} /> 
        <Stack.Screen name="FavoritesScreen" component={FavoritesScreen}options={{ headerShown: false }} />   
        <Stack.Screen name="ResultOfSearch" component={ResultOfSearch} options={{ headerShown: false }}/>
    
      </Stack.Navigator>
    </NavigationContainer>
  );
}

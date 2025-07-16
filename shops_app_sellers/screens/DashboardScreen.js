import React from "react";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import { useColorScheme } from "react-native";
import { useNavigation } from "@react-navigation/native";

// Chart components
import ItemsSoldChart from "../components/ItemsSoldChart";
import SalesByRegionChart from "../components/SalesByRegionChart";
import PurchasesByRegionChart from "../components/PurchasesByRegionChart";
import TopProductsChart from "../components/TopProductsChart";

const Drawer = createDrawerNavigator();

//Custom Drawer Content with navigation to main screen
const CustomDrawerContent = (props) => {
  const navigation = useNavigation();
  const { shopId, userId } = props; 
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />

      <DrawerItem
        label="Main Screen"
        onPress={() => {
          navigation.reset({
            index: 0,
            routes: [{ name: "Main", params: { shopId, userId } }],
          });
        }}
        labelStyle={{ color: "#aaa" }}
      />
    </DrawerContentScrollView>
  );
};

// Drawer Navigation for charts
const DashboardDrawer = ({ shopId, userId, isDark }) => {
  return (
    <Drawer.Navigator
      initialRouteName="Sales"
      drawerContent={(props) => (
        <CustomDrawerContent {...props} shopId={shopId} userId={userId} />
      )}
      screenOptions={{
        drawerActiveTintColor: isDark ? "#0af" : "#007AFF",
        drawerInactiveTintColor: isDark ? "#aaa" : "#333",
        drawerStyle: {
          backgroundColor: isDark ? "#1c1c1e" : "#fff",
          width: 240,
        },
        headerStyle: {
          backgroundColor: isDark ? "#111" : "#f2f2f2",
        },
        headerTintColor: isDark ? "#fff" : "#000",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Drawer.Screen name="Sales">
        {() => <ItemsSoldChart shopId={shopId} darkMode={isDark} />}
      </Drawer.Screen>
      <Drawer.Screen name="Sales by Region">
        {() => <SalesByRegionChart shopId={shopId} darkMode={isDark} />}
      </Drawer.Screen>
      <Drawer.Screen name="Purchases Region">
        {() => <PurchasesByRegionChart shopId={shopId} darkMode={isDark} />}
      </Drawer.Screen>
      <Drawer.Screen name="Top Products">
        {() => <TopProductsChart shopId={shopId} darkMode={isDark} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
};

// Main Dashboard Component
const DashboardScreen = ({ shopId, route }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const userId = route?.params?.userId;

  return <DashboardDrawer shopId={shopId} userId={userId} isDark={isDark} />;
};

export default DashboardScreen;

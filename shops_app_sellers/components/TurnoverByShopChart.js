// components/TurnoverByShopChart.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, ScrollView } from 'react-native';
import axios from 'axios';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { API_BASE_URL } from '../config';

const TurnoverByShopChart = ({ darkMode }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/statistics/total-turnover-by-shop`);

        // Fetch shop names in parallel
        const shopsRes = await axios.get(`${API_BASE_URL}/public/shops`);
        const nameMap = new Map();
        shopsRes.data.forEach(shop => nameMap.set(shop._id, shop.shopName));

        const formatted = res.data.map(item => ({
          x: nameMap.get(item._id) || 'Shop',
          y: item.totalRevenue,
        }));
        setData(formatted);
      } catch (err) {
        console.error('Error fetching turnover by shop:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  return (
    <ScrollView horizontal>
      <View style={{ width: 500, backgroundColor: darkMode ? '#222' : '#f9f9f9', padding: 12, borderRadius: 10 }}>
        <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
          <VictoryAxis style={{ tickLabels: { angle: -45, fontSize: 10 } }} />
          <VictoryAxis dependentAxis />
          <VictoryBar data={data} style={{ data: { fill: '#dc3545' } }} />
        </VictoryChart>
      </View>
    </ScrollView>
  );
};

export default TurnoverByShopChart;

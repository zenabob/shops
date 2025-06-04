import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Button } from 'react-native';
import axios from 'axios';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis } from 'victory-native';
import { API_BASE_URL } from '../config';

const TurnoverChart = ({ shopId, darkMode }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("month");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/statistics/turnover?shopId=${shopId}&range=${range}`);
        const formatted = res.data.map(item => ({ x: item._id.date, y: item.totalRevenue }));
        setData(formatted);
      } catch (err) {
        console.error('Error fetching turnover:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [shopId, range]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  return (
    <View style={{ backgroundColor: darkMode ? '#222' : '#f9f9f9', padding: 12, borderRadius: 10 }}>
      <Button
        title={`Switch to ${range === 'month' ? 'day' : 'month'} view`}
        onPress={() => setRange(prev => (prev === 'month' ? 'day' : 'month'))}
      />
      <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
        <VictoryAxis style={{ tickLabels: { angle: -45, fontSize: 8 } }} />
        <VictoryAxis dependentAxis />
        <VictoryBar data={data} style={{ data: { fill: '#28A745' } }} />
      </VictoryChart>
    </View>
  );
};

export default TurnoverChart;

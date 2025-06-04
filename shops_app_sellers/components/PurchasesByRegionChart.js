import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import axios from 'axios';
import { VictoryPie, VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { API_BASE_URL } from '../config';

const PurchasesByRegionChart = ({ shopId, darkMode }) => {
  const [data, setData] = useState([]);
  const [legendData, setLegendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('pie');

  const colors = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc949", "#af7aa1", "#ff9da7"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/statistics/purchases-by-region?shopId=${shopId}`);
        const total = res.data.reduce((sum, item) => sum + item.orderCount, 0);

        const formatted = res.data.map((item, index) => ({
          x: item._id,
          y: item.orderCount,
          color: colors[index % colors.length],
          percentage: ((item.orderCount / total) * 100).toFixed(1),
        }));

        setData(formatted);
        setLegendData(formatted);
      } catch (err) {
        console.error('Error fetching purchases by region:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [shopId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  const renderChart = () => {
    if (viewType === 'pie') {
      return (
        <VictoryPie
          data={data}
          colorScale={legendData.map((d) => d.color)}
          innerRadius={60}
          labelRadius={0}
          style={{ labels: { fill: 'transparent' } }}
          padding={{ top: 20, bottom: 40 }}
        />
      );
    } else {
      return (
        <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
          <VictoryAxis
            style={{ tickLabels: { angle: -45, fontSize: 9, fill: darkMode ? '#fff' : '#000' } }}
          />
          <VictoryAxis
            dependentAxis
            style={{ tickLabels: { fontSize: 10, fill: darkMode ? '#fff' : '#000' } }}
          />
          <VictoryBar
            data={data}
            x="x"
            y="y"
            style={{
              data: {
                fill: ({ index }) => legendData[index]?.color || "#999",
              },
            }}
          />
        </VictoryChart>
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: darkMode ? '#111' : '#fff' }]}>
     

      {renderChart()}

      <View style={styles.legendContainer}>
        {legendData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, { color: darkMode ? '#fff' : '#000' }]}>
              {item.x}: {item.percentage}%
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: darkMode ? '#0af' : '#007AFF' }]}
        onPress={() => setViewType(prev => (prev === 'pie' ? 'bar' : 'pie'))}
      >
        <Text style={styles.buttonText}>
          Switch to {viewType === 'pie' ? 'Bar' : 'Pie'} View
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
   container: {
  flexGrow: 1,
  backgroundColor: '#fff', 
  padding: 16,
  alignItems: 'center',
},
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  legendContainer: {
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PurchasesByRegionChart;

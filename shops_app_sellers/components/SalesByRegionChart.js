import React, { useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import {
  VictoryPie,
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
} from 'victory-native';
import { API_BASE_URL } from '../config';

const SalesByRegionChart = ({ shopId, darkMode }) => {
  // State to store chart data and control behavior
  const [data, setData] = useState([]);
  const [legendData, setLegendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('pie'); // Controls whether pie or bar chart is shown

  // Predefined color palette for chart sections
  const colors = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc949", "#af7aa1", "#ff9da7"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sales data grouped by region for a specific shop
        const res = await axios.get(`${API_BASE_URL}/statistics/sales-by-region?shopId=${shopId}`);
        
        // Calculate the total quantity to use for percentage labels
        const total = res.data.reduce((sum, item) => sum + item.totalQuantity, 0);

        // Format data for both VictoryPie and VictoryBar usage
        const formatted = res.data.map((item, index) => ({
          x: item._id, // region name
          y: item.totalQuantity, // number of items sold
          label: `${item._id} (${((item.totalQuantity / total) * 100).toFixed(1)}%)`,
          region: item._id,
          color: colors[index % colors.length], // cycle through the color palette
          percentage: ((item.totalQuantity / total) * 100).toFixed(1),
        }));

        setData(formatted);
        setLegendData(formatted);
      } catch (err) {
        console.error('Error fetching sales by region:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  // Show a loading spinner while data is being fetched
  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  // Dynamically render the selected chart type
  const renderChart = () => {
    if (viewType === 'pie') {
      return (
        <VictoryPie
          data={data}
          colorScale={legendData.map((d) => d.color)} // Use matching colors
          innerRadius={60} // Donut chart style
          labelRadius={0} // Hide labels on the pie itself
          style={{ labels: { fill: 'transparent' } }}
          padding={{ top: 20, bottom: 40 }}
        />
      );
    } else {
      return (
        <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
          {/* X-axis for region names */}
          <VictoryAxis
            style={{ tickLabels: { angle: -45, fontSize: 9, fill: darkMode ? '#fff' : '#000' } }}
          />
          {/* Y-axis for number of items sold */}
          <VictoryAxis
            dependentAxis
            style={{ tickLabels: { fontSize: 10, fill: darkMode ? '#fff' : '#000' } }}
          />
          {/* Render a bar chart with color-matched bars */}
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
      {/* Render either pie or bar chart */}
      {renderChart()}

      {/* Legend with color indicators and percentages */}
      <View style={styles.legendContainer}>
        {legendData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, { color: darkMode ? '#fff' : '#000' }]}>
              {item.region}: {item.percentage}%
            </Text>
          </View>
        ))}
      </View>

      {/* Button to switch between pie and bar chart views */}
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

export default SalesByRegionChart;

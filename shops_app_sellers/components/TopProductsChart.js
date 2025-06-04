import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, ScrollView, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
} from 'victory-native';
import { API_BASE_URL } from '../config';

const COLORS = [
  '#007AFF', '#FF5733', '#28A745', '#FFC107', '#6F42C1', '#20C997', '#FF33A1',
  '#17A2B8', '#E83E8C', '#6610f2', '#fd7e14', '#6c757d', '#343a40', '#198754',
  '#0d6efd', '#dc3545', '#fdc500', '#00b4d8', '#9d4edd', '#3f37c9', '#ff6f61',
  '#00c49a', '#e6194b', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
  '#008080', '#e6beff', '#9a6324'
];

const TopProductsChart = ({ shopId, darkMode }) => {
  const [data, setData] = useState([]);
  const [percentages, setPercentages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/statistics/top-products?shopId=${shopId}`);
        const total = res.data.reduce((sum, item) => sum + item.totalQuantity, 0);

        const formatted = res.data.map((item, index) => ({
          x: item._id.length > 20 ? item._id.slice(0, 20) + '…' : item._id,
          y: item.totalQuantity,
          fill: COLORS[index],
          fullName: item._id,
        }));

        const percents = res.data.map((item, index) => ({
          name: item._id,
          color: COLORS[index],
          percent: ((item.totalQuantity / total) * 100).toFixed(1),
        }));

        // 🧩 Fill up to 10 bars with tiny y value instead of 0
        while (formatted.length < 10) {
          const fillerIndex = formatted.length;
          formatted.push({
            x: '—',
            y: 0.01, // ✅ استخدام قيمة صغيرة لظهور العمود الوهمي
            fill: '#444',
            fullName: 'No data',
          });
          percents.push({
            name: 'No data',
            color: '#444',
            percent: '0.0',
          });
        }

        setData(formatted);
        setPercentages(percents);
      } catch (err) {
        console.error('Error fetching top products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [shopId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  return (
    <ScrollView style={{ backgroundColor: darkMode ? '#111' : '#fff' }}>
      <View style={[styles.chartContainer, { backgroundColor: darkMode ? '#111' : '#fff' }]}>
        <VictoryChart
          theme={VictoryTheme.material}
          domainPadding={20}
          horizontal
          height={10 * 45 + 100}
          padding={{ left: 100, right: 40, top: 20, bottom: 50 }}
        >
          <VictoryAxis
            dependentAxis
            style={{
              tickLabels: { fontSize: 10, fill: darkMode ? '#fff' : '#000' },
              axis: { stroke: darkMode ? '#ccc' : '#333' },
            }}
          />
          <VictoryAxis
            style={{
              tickLabels: { fontSize: 10, fill: darkMode ? '#fff' : '#000' },
              axis: { stroke: darkMode ? '#ccc' : '#333' },
            }}
          />
          <VictoryBar
            data={data}
            style={{
              data: {
                fill: ({ datum }) => datum.fill,
              },
              labels: { fill: darkMode ? '#fff' : '#000', fontSize: 10 },
            }}
            labels={({ datum }) =>
              `${datum.y > 0.1 ? datum.y : 0} (${percentages.find(p => datum.fullName === p.name)?.percent}%)`
            }
          />
        </VictoryChart>

        <View style={styles.legendContainer}>
          {percentages.map((item, index) => (
            <View key={index} style={styles.legendRow}>
              <View style={[styles.colorBox, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: darkMode ? '#fff' : '#000' }]}>
                {item.name} – {item.percent}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  legendContainer: {
    marginTop: 20,
    paddingHorizontal: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  colorBox: {
    width: 14,
    height: 14,
    marginRight: 8,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 13,
    flexShrink: 1,
  },
});

export default TopProductsChart;

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
  VictoryLine,
  VictoryChart,
  VictoryTheme,
  VictoryAxis,
  VictoryTooltip,
  VictoryVoronoiContainer,
  VictoryLabel,
} from 'victory-native';
import { API_BASE_URL } from '../config';

const ItemsSoldChart = ({ shopId, darkMode }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("month");
  const [topLabel, setTopLabel] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/statistics/items-sold?shopId=${shopId}&range=${range}`);
        const formatted = res.data.map(item => ({
          x: item._id.date,
          y: item.totalQuantity,
          label: `${item._id.date}\n${item.totalQuantity} items`
        }));
        setData(formatted);

        // حساب أكثر وقت بيعًا
        if (formatted.length > 0) {
          const max = formatted.reduce((prev, current) => (current.y > prev.y ? current : prev));
          setTopLabel(range === 'day'
            ? `🕐 Most sold day: ${max.x} (${max.y} items)`
            : `📆 Most sold month: ${max.x} (${max.y} items)`);
        } else {
          setTopLabel('');
        }
      } catch (err) {
        console.error('Error fetching items sold:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [shopId, range]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: darkMode ? '#111' : '#fff' }]}>
      <Text style={[styles.title, { color: darkMode ? '#fff' : '#000' }]}>
        📈 Items Sold Over Time ({range === "month" ? "Monthly" : "Daily"})
      </Text>

      <VictoryChart
        theme={VictoryTheme.material}
        domainPadding={{ x: 50, y: 20 }}
        padding={{ top: 20, bottom: 70, left: 70, right: 20 }}
        containerComponent={<VictoryVoronoiContainer />}
        width={350}
        height={300}
      >
        <VictoryAxis
          label="📅 Date / Hour"
          axisLabelComponent={
            <VictoryLabel dy={30} style={{ fill: darkMode ? '#fff' : '#000', fontSize: 12, fontWeight: 'bold' }} />
          }
          fixLabelOverlap
          style={{
            tickLabels: { angle: -45, fontSize: 9, fill: darkMode ? '#fff' : '#000' },
            axis: { stroke: darkMode ? '#ccc' : '#333' },
            ticks: { stroke: darkMode ? '#ccc' : '#333' },
          }}
        />

        <VictoryAxis
          dependentAxis
          label="🛒 Quantity Sold"
          axisLabelComponent={
            <VictoryLabel angle={-90} dy={-40} style={{ fill: darkMode ? '#fff' : '#000', fontSize: 12, fontWeight: 'bold' }} />
          }
          style={{
            tickLabels: { fontSize: 10, fill: darkMode ? '#fff' : '#000' },
            axis: { stroke: darkMode ? '#ccc' : '#333' },
            ticks: { stroke: darkMode ? '#ccc' : '#333' },
          }}
        />

        <VictoryLine
          data={data}
          interpolation="monotoneX"
          style={{
            data: { stroke: darkMode ? '#0af' : '#007AFF', strokeWidth: 2 },
          }}
          labels={({ datum }) => datum.label}
          labelComponent={
            <VictoryTooltip
              flyoutStyle={{
                fill: darkMode ? '#222' : '#fff',
                stroke: darkMode ? '#aaa' : '#ccc',
              }}
              style={{
                fill: darkMode ? '#fff' : '#000',
                fontSize: 10,
              }}
            />
          }
        />
      </VictoryChart>

      <Text style={[styles.infoText, { color: darkMode ? '#ccc' : '#444' }]}>
        🔹 X Axis = Date or Hour of sale{'\n'}
        🔹 Y Axis = Quantity of items sold
      </Text>

      {topLabel !== '' && (
        <Text style={[styles.topLabel, { color: darkMode ? '#0af' : '#007AFF' }]}>
          {topLabel}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: darkMode ? '#0af' : '#007AFF' }]}
        onPress={() => setRange(prev => (prev === 'month' ? 'day' : 'month'))}
      >
        <Text style={styles.buttonText}>
          Switch to {range === 'month' ? 'Daily' : 'Monthly'} View
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },
  topLabel: {
    marginTop: 8,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ItemsSoldChart;

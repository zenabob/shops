import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { InteractionManager } from 'react-native';
import {
  VictoryLine,
  VictoryChart,
  VictoryTheme,
  VictoryAxis,
  VictoryTooltip,
  VictoryVoronoiContainer,
  VictoryLabel,
  VictoryScatter,
} from 'victory-native';
import { API_BASE_URL } from '../config';

const ItemsSoldChart = ({ shopId, darkMode }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [topLabel, setTopLabel] = useState('');
  const [maxPoint, setMaxPoint] = useState(null);
  const cache = useRef({});

  const formatDate = (date) => {
    const d = new Date(date);
    return range === 'day'
      ? d.toISOString().split('T')[0]
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const fetchData = async () => {
    const dateKey = `${shopId}_${range}_${formatDate(selectedDate)}`;
    if (cache.current[dateKey]) {
      const cached = cache.current[dateKey];
      setData(cached.data);
      setTopLabel(cached.topLabel);
      setMaxPoint(cached.maxPoint);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/statistics/items-sold?shopId=${shopId}&range=${range}`
      );

      const filtered = res.data.filter((item) =>
        item._id?.date?.startsWith(formatDate(selectedDate))
      );

      let formatted = [];

      if (range === 'day') {
        const hours = Array.from({ length: 24 }, (_, i) =>
          `${String(i).padStart(2, '0')}:00`
        );
        const map = new Map(
          filtered.map((item) => [
            item._id.date.split('T')[1]?.slice(0, 5),
            item.totalQuantity,
          ])
        );

        formatted = hours.map((hour) => ({
          x: hour,
          y: map.get(hour) || 0,
          label: `${hour}\n${map.get(hour) || 0} items`,
        }));
      } else {
        const daysInMonth = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0
        ).getDate();
        const map = new Map(
          filtered.map((item) => [
            parseInt(item._id.date.slice(8, 10)),
            item.totalQuantity,
          ])
        );

        formatted = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const y = map.get(day) || 0;
          return {
            x: day,
            y,
            label: `Day ${day}\n${y} items`,
          };
        });
      }

      let label = 'No data';
      let max = null;
      if (formatted.length > 0) {
        max = formatted.reduce((prev, curr) => (curr.y > prev.y ? curr : prev));
        label =
          range === 'day'
            ? `Most sold hour: ${max.x} (${max.y} items)`
            : `Most sold day: Day ${max.x} (${max.y} items)`;
      }

      cache.current[dateKey] = { data: formatted, topLabel: label, maxPoint: max };

      setData(formatted);
      setTopLabel(label);
      setMaxPoint(max);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fetchData();
    });
    return () => task.cancel();
  }, [shopId, range, selectedDate]);

  const onDateChange = (event, date) => {
    if (date) setSelectedDate(date);
    setShowDatePicker(false);
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: darkMode ? '#111' : '#fff' },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[styles.title, { color: darkMode ? '#fff' : '#000' }]}>
          Items Sold ({range === 'month' ? 'Monthly' : 'Daily'})
        </Text>
        {loading && (
          <ActivityIndicator
            size="small"
            color={darkMode ? '#0af' : '#007AFF'}
            style={{ marginLeft: 8 }}
          />
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: darkMode ? '#444' : '#ddd' }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: darkMode ? '#fff' : '#000' }}>
          {range === 'month' ? 'Select Month' : 'Select Day'}: {formatDate(selectedDate)}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      {!loading && (
        <>
          <VictoryChart
            theme={VictoryTheme.material}
            domainPadding={{ x: 40, y: 20 }}
            padding={{ top: 20, bottom: 70, left: 60, right: 20 }}
            containerComponent={<VictoryVoronoiContainer />}
            width={350}
            height={300}
          >
            <VictoryAxis
              label="Time"
              axisLabelComponent={<VictoryLabel dy={30} style={{ fill: darkMode ? '#fff' : '#000' }} />}
              style={{
                tickLabels: {
                  angle: -45,
                  fontSize: 9,
                  fill: darkMode ? '#fff' : '#000',
                },
                axis: { stroke: darkMode ? '#ccc' : '#333' },
                ticks: { stroke: darkMode ? '#ccc' : '#333' },
              }}
            />
            <VictoryAxis
              dependentAxis
              label="Quantity"
              axisLabelComponent={<VictoryLabel angle={-90} dy={-40} style={{ fill: darkMode ? '#fff' : '#000' }} />}
              style={{
                tickLabels: { fontSize: 10, fill: darkMode ? '#fff' : '#000' },
                axis: { stroke: darkMode ? '#ccc' : '#333' },
                ticks: { stroke: darkMode ? '#ccc' : '#333' },
              }}
            />
            <VictoryLine
              data={data}
              interpolation="monotoneX"
              labels={({ datum }) => datum.label}
              style={{ data: { stroke: '#007AFF', strokeWidth: 2 } }}
              labelComponent={
                <VictoryTooltip
                  flyoutStyle={{
                    fill: darkMode ? '#222' : '#fff',
                    stroke: darkMode ? '#aaa' : '#ccc',
                  }}
                  style={{ fill: darkMode ? '#fff' : '#000', fontSize: 10 }}
                />
              }
            />
            <VictoryScatter
              data={data}
              size={({ datum }) =>
                maxPoint && datum.x === maxPoint.x && datum.y === maxPoint.y ? 6 : 3
              }
              style={{
                data: {
                  fill: ({ datum }) =>
                    maxPoint && datum.x === maxPoint.x && datum.y === maxPoint.y
                      ? '#FF5733'
                      : darkMode
                      ? '#0af'
                      : '#007AFF',
                },
              }}
              labels={({ datum }) => datum.label}
              labelComponent={
                <VictoryTooltip
                  flyoutStyle={{
                    fill: darkMode ? '#222' : '#fff',
                    stroke: darkMode ? '#aaa' : '#ccc',
                  }}
                  style={{ fill: darkMode ? '#fff' : '#000', fontSize: 10 }}
                />
              }
            />
          </VictoryChart>

          <Text style={[styles.infoText, { color: darkMode ? '#ccc' : '#444' }]}>
            X Axis = {range === 'month' ? 'Day' : 'Hour'} of {formatDate(selectedDate)}{"\n"}
            Y Axis = Quantity Sold
          </Text>

          {topLabel && (
            <Text style={[styles.topLabel, { color: darkMode ? '#0af' : '#007AFF' }]}>
              {topLabel}
            </Text>
          )}
        </>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: darkMode ? '#0af' : '#007AFF' }]}
        onPress={() => setRange((prev) => (prev === 'month' ? 'day' : 'month'))}
      >
        <Text style={styles.buttonText}>
          Switch to {range === 'month' ? 'Daily' : 'Monthly'} View
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  infoText: { marginTop: 10, textAlign: 'center', fontSize: 13, lineHeight: 20 },
  topLabel: { marginTop: 8, fontWeight: '600', fontSize: 14, textAlign: 'center' },
  button: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 22, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});

export default ItemsSoldChart;

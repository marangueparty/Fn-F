// components/FocusProgress.js

import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import moment from 'moment-timezone';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { BarChart, Grid, XAxis, YAxis } from 'react-native-svg-charts';
import { getApiHost } from '../../utils/getApiHost';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CHART_HEIGHT  = SCREEN_H * 0.35;
const CHART_PADDING = 0.15;      // 15% top & bottom padding
const CHART_WIDTH   = SCREEN_W * 0.9;
const Y_AXIS_WIDTH  = 40;
const BAR_WIDTH     = CHART_WIDTH - Y_AXIS_WIDTH;

const HOST = getApiHost();

function parseSessionDate(startedAt) {
  if (!startedAt) return null;
  if (startedAt._seconds) return moment.unix(startedAt._seconds).tz('Asia/Singapore');
  if (typeof startedAt.toDate === 'function') return moment(startedAt.toDate()).tz('Asia/Singapore');
  return moment(startedAt).tz('Asia/Singapore');
}

export default function FocusProgress() {
  const [weeklyFocus, setWeeklyFocus]     = useState(Array(7).fill(0));
  const [weeklyBreak, setWeeklyBreak]     = useState(Array(7).fill(0));
  const [dailyGoal,   setDailyGoal]       = useState(2);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [tempGoal,    setTempGoal]        = useState('2');
  const [lastWeekAverage, setLastWeekAverage] = useState(0);
  const [lastWeekStats,   setLastWeekStats]   = useState({ max:0, avg:0 });
  const [lastWeekCount,   setLastWeekCount]   = useState(0);

  const fetchSessions = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const resp  = await fetch(`${HOST}/sessions`, {
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      });
      if (!resp.ok) throw new Error();
      const sessions = await resp.json();

      const gResp = await fetch(`${HOST}/settings/goals`, {
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      });
      if (gResp.ok) {
        const { success, goals:{ dailyHours } } = await gResp.json();
        if (success) setDailyGoal(dailyHours);
      }

      const now       = moment().tz('Asia/Singapore');
      const weekStart = now.clone().startOf('isoWeek');
      const weekEnd   = now.clone().endOf('isoWeek');
      const lastStart = weekStart.clone().subtract(1,'week');
      const lastEnd   = weekEnd.clone().subtract(1,'week');

      const thisWeek = sessions.filter(s => {
        const d = parseSessionDate(s.startedAt);
        return d && d.isBetween(weekStart, weekEnd, 'day','[]');
      });
      const lastWeek = sessions.filter(s => {
        const d = parseSessionDate(s.startedAt);
        return d && d.isBetween(lastStart, lastEnd, 'day','[]');
      });

      const focusMap = {}, breakMap = {};
      thisWeek.forEach(({ studyDuration, breakDuration, startedAt }) => {
        const day = parseSessionDate(startedAt).format('dddd');
        focusMap[day] = (focusMap[day]||0) + studyDuration;
        breakMap[day] = (breakMap[day]||0) + breakDuration;
      });

      const lwTotal = lastWeek.reduce((sum,s) => sum + s.studyDuration, 0);
      const lwAvg   = lastWeek.length ? Math.round(lwTotal/lastWeek.length) : 0;
      const lwMap   = {};
      lastWeek.forEach(({ studyDuration, startedAt }) => {
        const day = parseSessionDate(startedAt).format('dddd');
        lwMap[day] = (lwMap[day]||0) + studyDuration;
      });

      const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      setWeeklyFocus(days.map(d=>focusMap[d]||0));
      setWeeklyBreak(days.map(d=>breakMap[d]||0));
      setLastWeekAverage(lwAvg);
      setLastWeekStats({
        max: Math.max(...days.map(d=>lwMap[d]||0))||0,
        avg:
          days
            .map(d=>lwMap[d]||0)
            .filter(v=>v>0)
            .reduce((a,b)=>a+b,0)
          / Math.max(days.filter(d=>lwMap[d]>0).length,1),
      });
      setLastWeekCount(lastWeek.length);

    } catch {
      Alert.alert('Error','Could not load sessions');
    }
  }, []);

  useFocusEffect(useCallback(()=>{
    fetchSessions();
  },[fetchSessions]));

  const totalFocus = weeklyFocus.reduce((a,b)=>a+b,0);
  const totalBreak = weeklyBreak.reduce((a,b)=>a+b,0);

  const goalMinutes = dailyGoal * 60;
  const data        = weeklyFocus;
  const labels      = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  // find max so bars never get cut off
  const actualMax = Math.max(goalMinutes, ...data);

  const inset = {
    top:    CHART_PADDING * CHART_HEIGHT,
    bottom: CHART_PADDING * CHART_HEIGHT,
  };

  const thisWeekAvg = data.filter(v=>v>0).length
    ? Math.round(data.filter(v=>v>0).reduce((a,b)=>a+b,0) / data.filter(v=>v>0).length)
    : 0;

  // helper to compute Y position in overlay
  const offsetY     = inset.top;
  const innerHeight = CHART_HEIGHT - inset.top - inset.bottom;
  const yPos        = v => offsetY + (1 - v/actualMax)*innerHeight;

  // half width of one bar for XAxis inset
  const halfBar = BAR_WIDTH / data.length / 2;

  const updateGoal = async () => {
    const g = parseFloat(tempGoal);
    if (isNaN(g)||g<0||g>24) {
      return Alert.alert('Invalid Goal','Enter 0–24');
    }
    try {
      const token = await SecureStore.getItemAsync('userToken');
      await fetch(`${HOST}/settings/goals`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ dailyHours: g }),
      });
      setDailyGoal(g);
    } catch {
      Alert.alert('Error','Could not update goal');
    } finally {
      setShowGoalModal(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Daily Goal */}
        <View style={styles.goalCard}>
          <Text style={styles.goalTitle}>Daily Study Goal</Text>
          <View style={styles.goalContent}>
            <Text style={styles.goalValue}>{dailyGoal}h</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={()=>{
                setTempGoal(dailyGoal.toString());
                setShowGoalModal(true);
              }}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.goalSubtext}>
            Target: {goalMinutes} minutes per day
          </Text>
        </View>

        {/* This Week */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>This Week's Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Focus</Text>
              <Text style={styles.statValue}>{totalFocus} min</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Breaks</Text>
              <Text style={styles.statValue}>{totalBreak} min</Text>
            </View>
          </View>
        </View>

        {/* Past Week Range */}
        <View style={styles.rangeCard}>
          <Text style={styles.rangeTitle}>Daily Study Range (Past Week)</Text>
          <View style={styles.rangeStats}>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>Average</Text>
              <Text style={styles.rangeValue}>{lastWeekStats.avg} min</Text>
            </View>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeLabel}>Sessions</Text>
              <Text style={styles.rangeValue}>{lastWeekCount}</Text>
            </View>
          </View>
        </View>

        {/* Chart */}
        <Text style={styles.chartTitle}>Weekly Focus vs Goal</Text>
        <View style={{ flexDirection:'row', height:CHART_HEIGHT }}>
          <YAxis
            style={{ width: Y_AXIS_WIDTH }}
            data={[0, actualMax]}
            contentInset={inset}
            svg={{ fontSize:8, fill:'#666' }}
            numberOfTicks={6}
            formatLabel={v=>`${v}`}
          />
          <View style={{ flex:1, height:CHART_HEIGHT, position:'relative' }}>
            <BarChart
              style={{ width:'100%', height:'100%' }}
              data={data}
              svg={{ fill:'rgba(155,93,229,1)' }}
              yMin={0}
              yMax={actualMax}
              contentInset={inset}
              spacingInner={0.3}
              spacingOuter={0.3}
            >
              <Grid direction={Grid.Direction.HORIZONTAL}/>
            </BarChart>
            <Svg style={StyleSheet.absoluteFill}>
              <Line
                x1="0" x2="100%"
                y1={yPos(goalMinutes)} y2={yPos(goalMinutes)}
                stroke="#4caf50" strokeWidth="2"
              />
              {thisWeekAvg>0 && (
                <Line
                  x1="0" x2="100%"
                  y1={yPos(thisWeekAvg)} y2={yPos(thisWeekAvg)}
                  stroke="#2196f3" strokeWidth="2"
                />
              )}
              {lastWeekAverage>0 && (
                <Line
                  x1="0" x2="100%"
                  y1={yPos(lastWeekAverage)} y2={yPos(lastWeekAverage)}
                  stroke="#ff9800" strokeWidth="2"
                />
              )}
            </Svg>
          </View>
        </View>
        <XAxis
          style={{ width: BAR_WIDTH, marginTop:4 }}
          data={data}
          formatLabel={(_,i)=>labels[i]}
          contentInset={{ left: halfBar, right: halfBar }}
          svg={{ fontSize:10, fill:'#333' }}
        />

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor,{backgroundColor:'#4caf50'}]} />
            <Text style={styles.legendText}>{dailyGoal}h Goal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor,{backgroundColor:'#2196f3'}]} />
            <Text style={styles.legendText}>{thisWeekAvg} min This Week Avg</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor,{backgroundColor:'#ff9800'}]} />
            <Text style={styles.legendText}>{lastWeekAverage} min Last Week Avg</Text>
          </View>
        </View>

        {/* Goal Modal */}
        <Modal
          visible={showGoalModal}
          transparent
          animationType="slide"
          onRequestClose={()=>setShowGoalModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Daily Study Goal</Text>
              <Text style={styles.modalSubtitle}>Hours per day (0–24)</Text>
              <TextInput
                style={styles.goalInput}
                value={tempGoal}
                onChangeText={setTempGoal}
                keyboardType="numeric"
                placeholder="e.g. 2"
                placeholderTextColor="#999"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton,styles.cancelButton]}
                  onPress={()=>setShowGoalModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton,styles.saveButton]}
                  onPress={updateGoal}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:1,
    backgroundColor:'#fff',
    paddingTop:Platform.OS==='android'
      ? StatusBar.currentHeight+10
      : 10,
  },
  container: {
    alignItems:'center',
    paddingVertical:20,
  },

  goalCard: {
    width: SCREEN_W*0.9,
    backgroundColor:'#f8f9ff',
    borderRadius:12,
    padding:16,
    marginBottom:16,
    borderWidth:1,
    borderColor:'#e0e0e0',
  },
  goalTitle:{ fontSize:16,fontWeight:'600',color:'#333' },
  goalContent:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    marginVertical:8,
  },
  goalValue:{ fontSize:28,fontWeight:'700',color:'#5e17eb' },
  editButton:{
    backgroundColor:'#5e17eb',
    padding:8,
    borderRadius:6,
  },
  editButtonText:{ color:'#fff',fontSize:12,fontWeight:'600' },
  goalSubtext:{ fontSize:12,color:'#666' },

  summaryCard:{
    width: SCREEN_W*0.9,
    backgroundColor:'#d3b5f9',
    borderRadius:12,
    padding:16,
    marginBottom:16,
  },
  summaryTitle:{ fontSize:16,fontWeight:'600',color:'#333',marginBottom:8,textAlign:'center' },
  statsRow:{ flexDirection:'row',justifyContent:'space-around' },
  statItem:{ alignItems:'center' },
  statLabel:{ fontSize:12,color:'#666' },
  statValue:{ fontSize:20,fontWeight:'700',color:'#000' },

  rangeCard:{
    width: SCREEN_W*0.9,
    backgroundColor:'#fff',
    borderRadius:12,
    padding:16,
    marginBottom:16,
    borderWidth:1,
    borderColor:'#e0e0e0',
  },
  rangeTitle:{ fontSize:14,fontWeight:'600',color:'#333',marginBottom:8,textAlign:'center' },
  rangeStats:{ flexDirection:'row',justifyContent:'space-around' },
  rangeItem:{ alignItems:'center' },
  rangeLabel:{ fontSize:12,color:'#666' },
  rangeValue:{ fontSize:16,fontWeight:'600',color:'#333' },

  chartTitle:{ fontSize:16,fontWeight:'600',color:'#333',marginBottom:8 },
  legendContainer:{ flexDirection:'row',justifyContent:'center',marginTop:8 },
  legendItem:{ flexDirection:'row',alignItems:'center',marginHorizontal:8 },
  legendColor:{ width:12,height:2,marginRight:4 },
  legendText:{ fontSize:10,color:'#333' },

  modalOverlay:{
    flex:1,
    backgroundColor:'rgba(0,0,0,0.4)',
    justifyContent:'center',
    alignItems:'center',
  },
  modalContent:{
    width: SCREEN_W*0.8,
    backgroundColor:'#fff',
    borderRadius:12,
    padding:20,
  },
  modalTitle:{ fontSize:16,fontWeight:'600',color:'#333',marginBottom:8 },
  modalSubtitle:{ fontSize:12,color:'#666',marginBottom:12 },
  goalInput:{
    borderWidth:1,
    borderColor:'#ddd',
    borderRadius:6,
    padding:8,
    fontSize:16,
    marginBottom:16,
    textAlign:'center',
  },
  modalButtons:{ flexDirection:'row',justifyContent:'space-between' },
  modalButton:{ flex:1,padding:10,borderRadius:6,alignItems:'center' },
  cancelButton:{ backgroundColor:'#eee',marginRight:8 },
  saveButton:{ backgroundColor:'#5e17eb' },
  cancelButtonText:{ color:'#555' },
  saveButtonText:{ color:'#fff' },
});
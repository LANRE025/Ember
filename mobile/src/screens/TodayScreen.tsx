import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Kael from '../components/Kael';
import { theme } from '../styles/theme';

export default function TodayScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Kael />
      <View style={styles.content}>
        <Text style={styles.title}>EMBER - TODAY</Text>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>GOAL · GYM</Text>
          <View style={styles.band}>
            <Text style={styles.bandLabel}>STRETCH</Text>
            <TouchableOpacity style={styles.plusBtn}><Text style={styles.plusText}>+</Text></TouchableOpacity>
          </View>
          <View style={styles.band}>
            <Text style={styles.bandLabel}>REALISTIC</Text>
            <TouchableOpacity style={styles.plusBtn}><Text style={styles.plusText}>+</Text></TouchableOpacity>
          </View>
          <View style={styles.band}>
            <Text style={styles.bandLabel}>FLOOR (LOCKED)</Text>
          </View>
          <Text style={styles.rank}>RANK: SPARK</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    flex: 1,
    marginLeft: '30%',
    padding: 20,
  },
  title: {
    color: theme.colors.cyan,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    letterSpacing: 4,
  },
  panel: {
    backgroundColor: theme.colors.panel,
    borderColor: theme.colors.border,
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    shadowColor: theme.colors.cyan,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  panelTitle: {
    color: theme.colors.cyan,
    fontSize: 18,
    marginBottom: 16,
    letterSpacing: 2,
  },
  band: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: theme.colors.deepNavy,
    borderColor: theme.colors.purple,
    borderWidth: 1,
    borderRadius: 4,
  },
  bandLabel: {
    color: theme.colors.text,
    fontSize: 14,
    letterSpacing: 2,
  },
  plusBtn: {
    backgroundColor: theme.colors.purple,
    width: 30,
    height: 30,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  rank: {
    color: theme.colors.cyan,
    marginTop: 16,
    fontSize: 16,
    letterSpacing: 2,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Kael from '../components/Kael';
import { theme } from '../styles/theme';

export default function WeekScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Kael />
      <View style={styles.content}>
        <Text style={styles.title}>EMBER - WEEK</Text>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>CONQUESTS</Text>
          <Text style={styles.locked}>Begin your journey to view your conquests.</Text>
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
  locked: {
    color: theme.colors.muted,
    fontSize: 14,
  },
});

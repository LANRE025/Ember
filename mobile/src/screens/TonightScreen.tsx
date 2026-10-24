import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Kael from '../components/Kael';
import { theme } from '../styles/theme';

export default function TonightScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Kael />
      <View style={styles.content}>
        <Text style={styles.title}>EMBER - TONIGHT</Text>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>EVENING SHUTDOWN</Text>
          <TextInput
            style={styles.input}
            placeholder="Brain dump..."
            placeholderTextColor={theme.colors.muted}
            multiline
          />
          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>SUBMIT</Text>
          </TouchableOpacity>
          <View style={styles.quests}>
            <Text style={styles.questTitle}>TOP 3 QUESTS</Text>
            <Text style={styles.quest}>1. Do the smallest version of your goal</Text>
            <Text style={styles.quest}>2. Clear one small task</Text>
            <Text style={styles.quest}>3. Prepare for tomorrow</Text>
          </View>
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
  input: {
    backgroundColor: theme.colors.deepNavy,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    color: theme.colors.text,
    height: 80,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: theme.colors.purple,
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  btnText: {
    color: theme.colors.text,
    letterSpacing: 2,
  },
  quests: {
    marginTop: 16,
  },
  questTitle: {
    color: theme.colors.cyan,
    marginBottom: 8,
    letterSpacing: 2,
  },
  quest: {
    color: theme.colors.text,
    marginBottom: 4,
  },
});

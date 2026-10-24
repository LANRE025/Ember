import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TodayScreen from './src/screens/TodayScreen';
import TonightScreen from './src/screens/TonightScreen';
import WeekScreen from './src/screens/WeekScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Today">
        <Stack.Screen name="Today" component={TodayScreen} />
        <Stack.Screen name="Tonight" component={TonightScreen} />
        <Stack.Screen name="Week" component={WeekScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

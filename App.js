import 'react-native-gesture-handler'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack'

const Stack = createStackNavigator()

import Home from './routes/Home'
import CameraScreen from './routes/CameraScreen'
import Document from './routes/Document'
import FilterScreen from './routes/FilterScreen'

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown : false }}>
        <Stack.Screen name="Home" component={Home} options={{ ...TransitionPresets.SlideFromRightIOS }}/>
        <Stack.Screen name="Camera" component={CameraScreen} options={{ ...TransitionPresets.SlideFromRightIOS }} />
        <Stack.Screen name="Document" component={Document} options={{ ...TransitionPresets.SlideFromRightIOS }}/>
        <Stack.Screen name="FilterScreen" component={FilterScreen} options={{ ...TransitionPresets.SlideFromRightIOS }}/>
      </Stack.Navigator>
    </NavigationContainer>
  )
}
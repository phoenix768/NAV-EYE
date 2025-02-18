
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import WelcomeScreen from "./screens/WelcomeScreen";
import VoiceAssistant from "./screens/VoiceAssistant"


const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="VoiceAssistant" component={VoiceAssistant}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

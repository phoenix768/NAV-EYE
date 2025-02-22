
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import WelcomeScreen from "./screens/WelcomeScreen";
import VoiceAssistant from "./screens/VoiceAssistant"
import TrainStationsScreen from "./screens/TrainStationScreen";
import BusStationsScreen from "./screens/BusStationScreen";
import MetroStationsScreen from "./screens/MetroStationScreen";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

const client = new ApolloClient({
  uri: "http://172.20.2.246:5000/graphql", // Change this to your backend URL if needed
  cache: new InMemoryCache(),
});


const Stack = createStackNavigator();

const App = () => {
  return (
    <ApolloProvider client={client}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Welcome">
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="VoiceAssistant" component={VoiceAssistant}/>
            <Stack.Screen name="TrainStations" component={TrainStationsScreen} />
            <Stack.Screen name="BusStations" component={BusStationsScreen} />
            <Stack.Screen name="MetroStations" component={MetroStationsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
    </ApolloProvider>
  );
};

export default App;

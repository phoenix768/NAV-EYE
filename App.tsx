
import React,{useEffect} from "react";
import { PermissionsAndroid, Platform, Alert } from "react-native";
import { NavigationContainer} from "@react-navigation/native";
import Geolocation from "react-native-geolocation-service";
import { createStackNavigator } from "@react-navigation/stack";
import WelcomeScreen from "./screens/WelcomeScreen";
import VoiceAssistant from "./screens/VoiceAssistant"
import TrainStationsScreen from "./screens/TrainStationScreen";
import BusStationsScreen from "./screens/BusStationScreen";
import MetroStationsScreen from "./screens/MetroStationScreen";
import MapScreen from "./screens/MapScreen";
import NavigationScreen from "./screens/NavigationScreen";
import TrainEnquiry from "./screens/TrainEnquiry";
import TrainInfo from "./screens/TrainInfo";
import TrainsBetweenStations from "./screens/TrainBetweenStations";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

const client = new ApolloClient({
  uri: "http://172.20.13.109:4000/graphql", // Change this to your backend URL if needed
  cache: new InMemoryCache(),
});
// const requestLocationPermission = async () => {
//   if (Platform.OS === "android") {
//     try {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//         {
//           title: "Location Permission",
//           message: "This app needs access to your location.",
//           buttonPositive: "OK",
//         }
//       );
//       if (granted === PermissionsAndroid.RESULTS.GRANTED) {
//         console.log("Location permission granted");
//       } else {
//         Alert.alert("Permission Denied", "Location access is required for this app.");
//       }
//     } catch (err) {
//       console.warn(err);
//     }
//   }
// };

const Stack = createStackNavigator();

const App = () => {
  // useEffect(() => {
  //   requestLocationPermission();
  // }, []);

  return (
    <ApolloProvider client={client}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Welcome">
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="VoiceAssistant" component={VoiceAssistant}/>
            <Stack.Screen name="TrainStations" component={TrainStationsScreen} />
            <Stack.Screen name="BusStations" component={BusStationsScreen} />
            <Stack.Screen name="MetroStations" component={MetroStationsScreen} />
            <Stack.Screen name="MapScreen" component={MapScreen} />
            <Stack.Screen name="NavigationScreen" component={NavigationScreen} />
            <Stack.Screen name="TrainEnquiry" component={TrainEnquiry} />
            <Stack.Screen name="TrainInfo" component={TrainInfo} />
            <Stack.Screen name="TrainsBetweenStations" component={TrainsBetweenStations} />
          </Stack.Navigator>
        </NavigationContainer>
    </ApolloProvider>
  );
};

export default App;

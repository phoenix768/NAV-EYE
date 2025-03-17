require("dotenv").config();
const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// GraphQL Schema
const schema = buildSchema(`
  type Location {
    lat: Float
    lng: Float
    address : String
  }

  type Place {
    name: String
    address: String
    location: Location
    distance : String
  }

  type Step {
    instruction: String
    distance: String
    duration: String
  }

  type Route {
    summary: String
    steps: [Step]
    polyline: String!
  }

  type TransitStep {
    vehicle: String
    lineName: String
    departureTime: String
    arrivalTime: String
    departureStop: String
    arrivalStop: String
  }

  type TransitRoute {
    summary: String
    steps: [Step]
    transitDetails: [TransitStep]
  }


  type Query {
    getCurrentLocation: Location
    getAddressFromCoordinates(lat: Float!, lng: Float!): String
    getNearbyStations(lat: Float!, lng: Float!, type: String!): [Place]
    getRoute(originLat: Float!, originLng: Float!, destLat: Float!, destLng: Float!): Route
    getTransitRoute(origin: String!, destination: String!): TransitRoute 
  }
`);

// Resolvers
const root = {
  // 📍 Get User's Current Location
  getCurrentLocation: async () => {
    try {
      const response = await axios.post(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${process.env.GOOGLE_API_KEY}`
      );
      const { lat, lng } = response.data.location;

      // 🏡 Get Address using Reverse Geocoding
      const addressResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_API_KEY}`
      );

      const address = addressResponse.data.results[0]?.formatted_address || "Address not found";

      return { lat, lng, address };
    } catch (error) {
      throw new Error("Failed to fetch location");
    }
  },

  // // 🏠 Get Address from Given Coordinates
  // getAddressFromCoordinates: async ({ lat, lng }) => {
  //   try {
  //     const response = await axios.get(
  //       `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_API_KEY}`
  //     );
  //     return response.data.results[0]?.formatted_address || "Address not found";
  //   } catch (error) {
  //     throw new Error("Failed to fetch address");
  //   }
  // },

  // 🚉 Get Nearby Train, Metro, or Bus Stations
 

  getNearbyStations: async ({ lat, lng, type }) => {
    try {
      let radius = 7500; // Start with 5km
      const maxRadius = 100000; // Maximum limit (100km)
      let stations = [];
  
      while (radius <= maxRadius && stations.length === 0) {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${process.env.GOOGLE_API_KEY}`
        );
  
        
  
        stations = response.data.results;
  
        if (stations.length === 0) {
          radius *= 2; // Double the search radius if no stations found
        }
      }
  
      // If no stations found, return empty array
      if (stations.length === 0) {
        return [];
      }
  
      // Prepare destination string for Distance Matrix API
      const destinations = stations
        .map((place) => `${place.geometry.location.lat},${place.geometry.location.lng}`)
        .join("|");
  
      // Fetch distances from Google Distance Matrix API
      const distanceResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=${destinations}&key=${process.env.GOOGLE_API_KEY}`
      );
  
      // Handle Distance Matrix API errors
      if (distanceResponse.data.status !== "OK") {
        throw new Error(`Google Distance Matrix API Error: ${distanceResponse.data.status}`);
      }
  
      // Combine station data with distance and sort by distance
      return stations
        .map((place, index) => ({
          name: place.name,
          address: place.vicinity,
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          distance: distanceResponse.data.rows[0].elements[index]?.distance?.text || "Unknown",
          distanceValue: distanceResponse.data.rows[0].elements[index]?.distance?.value || Infinity, // For sorting
        }))
        .sort((a, b) => a.distanceValue - b.distanceValue); // Sort by distance (closest first)
  
    } catch (error) {
      console.error("Error in getNearbyStations:", error.message);
      throw new Error("Failed to fetch nearby stations: " + error.message);
    }
  },
  
  

  // 🛣️ Get Normal Route (No Transit)
  getRoute: async ({ originLat, originLng, destLat, destLng }) => {
    try {
      const origin = `${originLat},${originLng}`;
      const destination = `${destLat},${destLng}`;
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${process.env.GOOGLE_API_KEY}`
      );
  
      const route = response.data.routes[0];
      if (!route) throw new Error("No route found");
  
      return {
        summary: route.summary,
        steps: route.legs[0].steps.map((step) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ""), // Remove HTML tags
          distance: step.distance.text,
          duration: step.duration.text,
        })),
        polyline: route.overview_polyline.points, // Add polyline data
      };
    } catch (error) {
      throw new Error("Failed to fetch directions: " + error.message);
    }
  },

  // 🚆 Get Transit Route for Train Schedules
  getTransitRoute: async ({ origin, destination }) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=transit&key=${process.env.GOOGLE_API_KEY}`
      );

      const route = response.data.routes[0];
      if (!route) throw new Error("No transit route found");

      return {
        summary: route.summary,
        steps: route.legs[0].steps.map((step) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ""), // Remove HTML tags
          distance: step.distance.text,
          duration: step.duration.text,
        })),
        transitDetails: route.legs[0].steps
          .filter((step) => step.travel_mode === "TRANSIT")
          .map((step) => ({
            vehicle: step.transit_details.line.vehicle.type, // BUS or TRAIN
            lineName: step.transit_details.line.name,
            departureTime: step.transit_details.departure_time.text,
            arrivalTime: step.transit_details.arrival_time.text,
            departureStop: step.transit_details.departure_stop.name,
            arrivalStop: step.transit_details.arrival_stop.name,
          })),
      };
    } catch (error) {
      throw new Error("Failed to fetch transit directions");
    }
  },

  
};

// GraphQL Middleware
app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true,
  })
);

// Start Server
app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000/graphql"));
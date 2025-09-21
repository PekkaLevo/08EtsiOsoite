import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, Button,
  ActivityIndicator, Keyboard, Alert
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const GEOCODE_URL = 'https://geocode.maps.co/search?q=';

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [region, setRegion] = useState({
    latitude: 60.1699,      
    longitude: 24.9384,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [marker, setMarker] = useState(null);

  const showOnMap = async () => {
    const q = query.trim();
    if (!q) {
      Alert.alert('Empty address', 'Please type an address.');
      return;
    }
    setLoading(true);
    setResultText('');
    Keyboard.dismiss();

    try {
      const res = await fetch(GEOCODE_URL + encodeURIComponent(q));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); 

      if (!Array.isArray(data) || data.length === 0) {
        setMarker(null);
        setResultText('No results. Try a more specific address.');
        return;
      }

      const first = data[0];
      const lat = parseFloat(first.lat);
      const lon = parseFloat(first.lon);

      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        setMarker(null);
        setResultText('Invalid coordinates from API.');
        return;
      }

      setMarker({ lat, lon, name: first.display_name });
      setRegion((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }));
      setResultText(first.display_name);
    } catch (e) {
      console.error(e);
      setMarker(null);
      setResultText('Geocoding failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setQuery('');
    setMarker(null);
    setResultText('');
    setRegion((r) => ({ ...r, latitudeDelta: 0.05, longitudeDelta: 0.05 }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Show Address on Map</Text>

      <TextInput
        style={styles.input}
        placeholder='Type an address'
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        onSubmitEditing={showOnMap}
      />

      <View style={styles.row}>
        <Button title="Show" onPress={showOnMap} />
        <View style={{ width: 10 }} />
        <Button title="Clear" onPress={clearAll} />
      </View>

      {loading && <ActivityIndicator size="large" style={{ marginBottom: 8 }} />}

      {!!resultText && !loading && (
        <Text style={styles.caption} numberOfLines={2}>
          {resultText}
        </Text>
      )}

      <MapView style={styles.map} region={region}>
        {marker && (
          <Marker
            coordinate={{ latitude: marker.lat, longitude: marker.lon }}
            title="Result"
            description={marker.name}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 40, alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  input: {
    width: '90%', maxWidth: 600, height: 44,
    borderWidth: 1, borderColor: '#000', borderRadius: 8,
    paddingHorizontal: 12, marginBottom: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  caption: { textAlign: 'center', paddingHorizontal: 16, color: '#444', marginBottom: 8 },
  map: { width: '100%', height: 420 },
});
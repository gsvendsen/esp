import React, {useEffect, useState} from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';

import getTokens from './src/functions/spotify/getTokens'

export default function App() {

  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [expirationTime, setExpirationTime] = useState(null);

  const connectToSpotify = async () => {
    const {accessTokenData, refreshTokenData, expirationTimeData} = await getTokens();
    setAccessToken(accessTokenData)
    setRefreshToken(refreshTokenData)
    setExpirationTime(expirationTimeData)
  }

  return (
    <View style={styles.container}>
      {accessToken === null && <Button title="Connect to Spotify" onPress={() => connectToSpotify()} />}
      {accessToken && <Text>Access Token: {accessToken}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

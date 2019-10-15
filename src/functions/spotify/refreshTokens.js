import getSpotifyCredentials from './getSpotifyCredentials'
import getTokens from './getTokens'

import { encode as btoa } from 'base-64';

export default refreshTokens = async (refreshToken) => {
    try {
      const credentials = await getSpotifyCredentials()
      const credsB64 = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credsB64}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
      });
      const responseJson = await response.json();
      if (responseJson.error) {
        await getTokens();
      } else {
        const {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          expires_in: expiresIn,
        } = responseJson;
  
        const expirationTime = new Date().getTime() + expiresIn * 1000;

        accessTokenData = newAccessToken
        refreshTokenData = newRefreshToken
        expirationTimeData = expirationTime
      }
  
    } catch (err) {
  
      console.error(err);
    }
  
    return {accessTokenData, refreshTokenData, expirationTimeData}
  }
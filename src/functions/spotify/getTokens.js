
import getSpotifyCredentials from './getSpotifyCredentials';
import getAuthorizationCode from './getAuthorizationCode';
import { encode as btoa } from 'base-64';


export default getTokens = async () => {
    let accessTokenData
    let refreshTokenData
    let expirationTimeData
    try {
      const authorizationCode = await getAuthorizationCode() // Own function, gets auth code from Spotify
      const credentials = await getSpotifyCredentials() // Function which returns credentials
      const credsB64 = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credsB64}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=authorization_code&code=${authorizationCode}&redirect_uri=${
          credentials.redirectUrl
        }`,
      });
      const responseJson = await response.json();
      // Destructure the response and rename the properties to be in camelCase
      const {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
      } = responseJson;
  
      const expirationTime = new Date().getTime() + expiresIn * 1000;
      accessTokenData = accessToken
      refreshTokenData = refreshToken
      expirationTimeData = expirationTime
  
    } catch (err) {
      console.error(err);
    }
  
    return {accessTokenData, refreshTokenData, expirationTimeData}
  }
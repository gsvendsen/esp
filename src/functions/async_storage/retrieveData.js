
import refreshTokens from '../spotify/refreshTokens'
import _storeData from './storeData'
import {AsyncStorage} from 'react-native';

export default _retrieveData = async () => {
    let user = null
    user = await AsyncStorage.getItem('USER');
    user = await JSON.parse(user)

    if(new Date().getTime() > user.expirationTime){
      const {accessTokenData, refreshTokenData, expirationTimeData} = await refreshTokens(user.refreshToken)
      user.accessToken = accessTokenData
      user.refreshToken = refreshTokenData
      user.expirationTime = expirationTimeData
      _storeData({accessToken:accessTokenData, refreshToken:refreshTokenData, expirationTime:expirationTimeData})

    }
    
    if (user !== null) {
      return user
    }

}
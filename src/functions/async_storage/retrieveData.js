
import refreshTokens from '../spotify/refreshTokens'
import _storeData from './storeData'
import {AsyncStorage} from 'react-native';

export default _retrieveData = async () => {
    let user = null
    user = await AsyncStorage.getItem('USER');
    user = await JSON.parse(user)

    if(user === null){
      return null
    }

    if(new Date().getTime() > user.expirationTime){
      
      let refreshData = await refreshTokens(user.refreshToken)

      if(refreshData){
        return null
      } else {
        const {accessTokenData, refreshTokenData, expirationTimeData} = refreshData
        user.accessToken = accessTokenData
        user.refreshToken = refreshTokenData
        user.expirationTime = expirationTimeData
        _storeData({accessToken:accessTokenData, refreshToken:refreshTokenData, expirationTime:expirationTimeData})
  
      }

      
    }
    
    if (user !== null) {
      return user
    }

}
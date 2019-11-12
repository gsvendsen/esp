import {AsyncStorage} from 'react-native';

export default _storeData = async (data) => {
    try {
      await AsyncStorage.setItem('USER', JSON.stringify(data));
    } catch (error) {
      // Error saving data
    }
  };
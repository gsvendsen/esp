import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View, Image, TouchableOpacity, Dimensions } from 'react-native';
var width = Dimensions.get('window').width; //full width


export default Login = (props) => {
    return (
        <>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.25)']}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 300,
            }}
          />
          <Image source={{uri: 'https://i.imgur.com/ijm0MzL.png'}} style={{width: 84, height: 123, marginBottom:45}} />
          <Text style={{fontWeight:'bold', fontSize:18, marginBottom:100}}>Discover new music in your way.</Text>
          <TouchableOpacity style={{height:69, width:width-30, backgroundColor:'#1db954'}} onPress={() => props.onLogin()}>
            <View style={{flex:1, flexDirection:"row", alignItems:"center", justifyContent:'center'}}>
              <Image source={{uri: 'https://i.imgur.com/H73GsK5.png'}} style={{width: 30, height: 30, marginRight:25}} />
              <Text style={{color:'white'}}>LOGIN WITH SPOTIFY</Text>
            </View>
          </TouchableOpacity>
          
        </>
    )
}
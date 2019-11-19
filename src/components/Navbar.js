import React from 'react';
import { Text, View, Image, TouchableOpacity, Dimensions } from 'react-native';
var width = Dimensions.get('window').width; //full width

export default Navbar = (props) => {
    return (
        <View style={{flex:1, width:width, height:150, alignItems:"center", position:"absolute", top:0, paddingLeft:20, paddingRight:15, flexDirection:"row", justifyContent:"space-between"}}>
            {!props.selectingTarget ? < TouchableOpacity onPress={() => props.onSelectSource()} style={{width:50, height:50}}>
              <Image source={{uri: 'https://i.imgur.com/obUE3wx.png'}} style={{width: 40, height: 40}} />
            </TouchableOpacity> : <View />}

            {!props.selectingTarget && !props.selectingSource && <TouchableOpacity onPress={() => props.debugReset()}><Image source={{uri: 'https://i.imgur.com/ijm0MzL.png'}} style={{width: 30, height: 40}} /></TouchableOpacity>}

            {!props.selectingSource &&
            <TouchableOpacity onPress={() => props.onSelectTarget()} style={{width:50, height:50}}>
              <Image source={{uri: 'https://i.imgur.com/RXo3Gcv.png'}} style={{width: 40, height: 40}} />
            </TouchableOpacity>}
        </View>
    )
}
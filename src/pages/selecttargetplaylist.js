import React from 'react';
import { Text, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import styled from 'styled-components'

var width = Dimensions.get('window').width; //full width

export default SelectTargetPlaylist = (props) => {
    const PlaylistContainer = styled.View`
        flex:1;
        flex-wrap:wrap;
        flex-direction:row;
        padding:0 5px;
    `
    const Playlist = styled.TouchableOpacity`
        margin:10px 5px;
    `
    const ScrollWrapper = styled.ScrollView`
        margin:100px 0 0 0;
        flex:1;
    `
    return (
        <View style={{flex:1, alignItems:"center"}}>
          <Text style={{color:'black', fontWeight:'bold', fontSize:16, position:'absolute', top:55}}>Select Target Playlist</Text>

          <ScrollWrapper style={{width:width}}>

            <PlaylistContainer>
              
              {props.allPlaylists.map((playlist, index) => {
                return (
                  <Playlist style={{width:(width-40)/2}} key={index} onPress={() => {
                    props.onPlaylistSelect(playlist)
                  }}>
                      <View style={{flex: 1}}>
                        <Text style={{color:"black", marginBottom:5}}>{playlist.name}</Text>
                      </View>
                      <Image source={{uri: playlist.images[0].url}} style={{width: (width-40)/2, height: (width-40)/2}} />
                      
                  </Playlist>
                )
              })}
            </PlaylistContainer>
          </ScrollWrapper>
        </View>
    )
}
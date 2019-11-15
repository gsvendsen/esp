import React from 'react';
import { Text, View, Image, Dimensions } from 'react-native';
var width = Dimensions.get('window').width; //full width
import styled from 'styled-components'

const PlaylistContainer = styled.View`
flex:1;
flex-wrap:wrap;
flex-direction:column;
padding:0;
`
const Playlist = styled.TouchableOpacity`
flex:1;
flex-direction:row;
position:relative;
border-bottom-color: #E0E0E0;
border-bottom-width: 1;
`
const ScrollWrapper = styled.ScrollView`
margin:100px 0 0 0;
flex:1;
`

export default SelectSourcePlaylist = (props) => {



    return (
        <View style={{flex:1, alignItems:"center"}}>
            <Text style={{color:'black', fontWeight:'bold', fontSize:16, position:'absolute', top:55}}>Select Source Playlists (1-5)</Text>
            <ScrollWrapper style={{width:width}}>
                <PlaylistContainer>

                    {props.allPlaylists.map((playlist, index) => {
                        const isSelected = props.selectedPlaylist.filter(existingPlaylist => {
                        return existingPlaylist === playlist
                    })

                    return (
                        <Playlist style={{width:width}} key={index} onPress={() => {
                            props.onPlaylistSelect(playlist)
                        }}>
                            
                            <Image source={{uri: playlist.images[0].url}} style={{width: 75, height: 75}} />
                            <View style={{flex: 1, justifyContent:"center"}}>
                                <Text style={{color:'black', marginLeft:20}}>{playlist.name}</Text>
                            </View>

                            {isSelected.length > 0 &&
                                <View style={{
                                    position:"absolute",
                                    right:0,
                                    width: 0,
                                    height: 0,
                                    backgroundColor: 'transparent',
                                    borderStyle: 'solid',
                                    borderRightWidth: 55,
                                    borderTopWidth: 75,
                                    borderRightColor: 'transparent',
                                    borderTopColor: '#5b8a7f',
                                    transform: [
                                        {rotate: '180deg'}
                                      ]
                                    }}>
                                </View>
                            }

                        </Playlist>
                    )
                    })}
                </PlaylistContainer>
            </ScrollWrapper>
        </View>
    )
}
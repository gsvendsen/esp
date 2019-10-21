import React, {useEffect, useState} from 'react';
import { Text, View, Button, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import styled from 'styled-components'
import { LinearGradient } from 'expo-linear-gradient';

import getTokens from './src/functions/spotify/getTokens'
import getSpotifyUserId from './src/functions/spotify/getSpotifyUserId'
import getSpotifyPlaylists from './src/functions/spotify/getSpotifyPlaylists'

import { Dimensions } from "react-native";

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height

export default function App() {

  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [expirationTime, setExpirationTime] = useState(null);
  const [spotifyUserId, setSpotifyUserId] = useState(null);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [newSong, setNewSong] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const [selectingPlaylist, setSelectingPlaylist] = useState(false);

  const connectToSpotify = async () => {
    const {accessTokenData, refreshTokenData, expirationTimeData} = await getTokens();
    setAccessToken(accessTokenData)
    setRefreshToken(refreshTokenData)
    setExpirationTime(expirationTimeData)

    let userId = await getSpotifyUserId(accessTokenData)
    const playlists = await getSpotifyPlaylists(accessTokenData, userId)
    setSpotifyPlaylists(playlists)
    setIsConnected(true)
  }

  const selectPlaylist = async (playlist) => {
    let response = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}`, { 
      method: 'GET', 
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`
      }), 
    })

    setSelectedPlaylist(playlist)

    let data = await response.json()

    let tracks = data.tracks.items

    let tracksIds = tracks.map((track) => track.track.id)

    getRecommendationsFromPlaylist(tracksIds)
    // Array of all track IDs 
    return tracksIds 

  }

  const getRecommendationsFromPlaylist = async (playlist) => {
    const shuffled = playlist.sort(() => 0.5 - Math.random());

    // Get sub-array of first n elements after shuffled
    let selected = shuffled.slice(0, 5);

    const queryIds = selected.join(',')

    let response2 = await fetch(`https://api.spotify.com/v1/recommendations?seed_tracks=${queryIds}`, { 
      method: 'GET', 
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`
      }), 
    })

    let data2 = await response2.json()

    const recommendationData = data2.tracks

    setRecommendations(recommendationData)

    return recommendationData

  }

  const addSongToPlaylist = async (songId, playlistId) => {

    let body = {
      uris:[`spotify:track:${songId}`]
    }

    let response2 = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, { 
      method: 'POST', 
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`
      }),
      body: JSON.stringify(body)
    })

    let data = await response2.json()

    setNewSong(null)

    console.log("Post playlist data: ", data)

  }
  // https://cdn.iconscout.com/icon/premium/png-256-thumb/music-playlist-5-599896.png
  return (
    <Wrapper>

        {accessToken === null &&
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
          <Image source={{uri: 'https://i.imgur.com/ijm0MzL.png'}} style={{width: 84, height: 123, marginBottom:35}} />
          <Text style={{fontWeight:'bold', fontSize:18, marginBottom:100}}>Discover new music, epic slogan.</Text>
          <TouchableOpacity style={{height:69, width:width-30, backgroundColor:'#1db954'}} onPress={() => connectToSpotify()}>
            <View style={{flex:1, flexDirection:"row", alignItems:"center", justifyContent:'center'}}>
              <Image source={{uri: 'https://i.imgur.com/H73GsK5.png'}} style={{width: 30, height: 30, marginRight:25}} />
              <Text style={{color:'white'}}>LOGIN WITH SPOTIFY</Text>
            </View>
          </TouchableOpacity>
          
        </>
        }
        {isConnected &&
        <View style={{flex:1, width:width, height:100, alignItems:"center", position:"absolute", top:0, paddingLeft:15, paddingRight:40, flexDirection:"row", justifyContent:"space-between"}}>
            <TouchableOpacity onPress={() => setSelectingPlaylist(!selectingPlaylist)} style={{width:25, height:25}}>
              <Image source={{uri: 'https://i.imgur.com/obUE3wx.png'}} style={{width: 50, height: 47}} />
            </TouchableOpacity>

            {selectedPlaylist !== null && 
              <>
                <Image source={{uri: selectedPlaylist.images[0].url}} style={{width: 40, height: 40}} />
                <Text>{selectedPlaylist.name}</Text>
              </>    
            }

            <TouchableOpacity onPress={() => setSelectingPlaylist(!selectingPlaylist)} style={{width:25, height:25}}>
              <Image source={{uri: 'https://i.imgur.com/RXo3Gcv.png'}} style={{width: 50, height: 47}} />
            </TouchableOpacity>
        </View>
        }
        {selectingPlaylist &&
          <View style={{flex:1, alignItems:"center"}}>
          <Text style={{color:'black', fontWeight:'bold', fontSize:16, position:'absolute', top:55}}>Select Source Playlist</Text>

          <ScrollWrapper style={{width:width}}>

            <PlaylistContainer>
              
              {spotifyPlaylists !== null && spotifyPlaylists.map((playlist, index) => {
                return (
                  <Playlist style={{width:(width-40)/2}} key={index} onPress={() => {
                    setSelectingPlaylist(false)
                    selectPlaylist(playlist)
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
      }

      {/* Recommendation FLOW */}
      {Array.isArray(recommendations) && recommendations.length > 0 && !selectPlaylist ?
              <ScrollWrapper style={{width:width}}>

              <ThumbnailContainer>
                <Thumbnail size={width-100} onPress={() => setNewSong(recommendations[9].id)}>
                    <Image source={{uri: recommendations[9].album.images[0].url}} style={{width: width-150, height: width-150, marginRight:10}} />
                    <View style={{flex: 1, marginTop:5}}>
                      <Text style={{color:"white"}}>{recommendations[9].name}</Text>
                      <Text style={{color:"grey", fontSize:10}}>{recommendations[9].artists.map(artist => artist.name).join(', ')}</Text>
                    </View>
                </Thumbnail>
              </ThumbnailContainer>
      
              <View style={{flex:1, flexDirection:'row', justifyContent:'space-evenly', marginVertical:10}}>
                <TouchableOpacity style={{marginHorizontal:10}} style={{backgroundColor:"#CD5555"}} title="No" onPress={() => {
                  let nextRecommendations = recommendations.splice(1, recommendations.length)
                  setRecommendations(nextRecommendations)
                }}><Text style={{color:"white", paddingHorizontal:45, paddingVertical:15}}>No</Text></TouchableOpacity>
                <TouchableOpacity style={{marginHorizontal:10}} style={{backgroundColor:"#335855"}} title="Yes" onPress={() => {
                  console.log(recommendations[0])
                  let nextRecommendations = recommendations.splice(1, recommendations.length)
                  setRecommendations(nextRecommendations)
                }}><Text style={{color:"white", paddingHorizontal:45, paddingVertical:15}}>Yes</Text></TouchableOpacity>
              </View>
      
              <View style={{flex:1, flexDirection:'row', justifyContent:'center', alignItems:'center', marginTop:20}}>
                <Image source={{uri: 'http://pluspng.com/img-png/spotify-logo-png-open-2000.png'}} style={{width: 30, height: 30, marginHorizontal:10}} />
                <Text style={{color: 'white', marginHorizontal:15}}
                      onPress={() => Linking.openURL(recommendations[9].external_urls.spotify)}>
                  Listen on Spotify
                </Text>
              </View>
      
            </ScrollWrapper>
        : isConnected && !selectingPlaylist &&  <Text style={{color:'grey', fontSize:16, marginVertical:10, marginHorizontal:50}} >select a source playlist</Text>
      }

      {newSong !== null &&
        <ScrollWrapper style={{width:width}}>
        <PlaylistContainer>
        <Text style={{color:'white', fontSize:16, marginVertical:10, marginHorizontal:10}}>Add selected song to a playlist</Text>

          {spotifyPlaylists !== null && spotifyPlaylists.map((playlist, index) => {
            return (
              <Playlist key={index} onPress={() => addSongToPlaylist(newSong, playlist.id)}>
                  <Image source={{uri: playlist.images[0].url}} style={{width: 80, height: 80, marginRight:10}} />
                  <View style={{flex: 1, alignItems:'space-between'}}>
                    <Text style={{color:"white"}}>{playlist.name}</Text>
                    <Image source={{uri: 'https://icon-library.net/images/white-plus-icon/white-plus-icon-3.jpg'}} style={{width: 15, height: 15, marginLeft:10}} />
                  </View>
              </Playlist>
            )
          })}
        </PlaylistContainer>
      </ScrollWrapper>
      }
    </Wrapper>
  );
}

const Wrapper = styled.View`
  flex:1;
  background-color: #F7F7F7;
  align-items:center;
  justify-content:center;
`

const ScrollWrapper = styled.ScrollView`
  margin:100px 0 0 0;
  flex:1;
`

const PlaylistContainer = styled.View`
  flex:1;
  flex-wrap:wrap;
  flex-direction:row;
  padding:0 5px;
`

const ThumbnailContainer = styled.View`
  flex:1;
  flex-direction:column;
`

const Playlist = styled.TouchableOpacity`
  margin:10px 5px;
`

const Thumbnail = styled.TouchableOpacity`
  height:${props => props.size};
  flex:1;
  align-items:center;
  justify-content:center;
  flex-wrap:wrap;
  color:white;
  margin:10px 0;
`
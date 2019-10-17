import React, {useEffect, useState} from 'react';
import { Text, View, Button, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import styled from 'styled-components'

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

  const selectPlaylist = async (id) => {
    let response = await fetch(`https://api.spotify.com/v1/playlists/${id}`, { 
      method: 'GET', 
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`
      }), 
    })

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

        {accessToken === null && <TouchableOpacity style={{paddingVertical:20, paddingHorizontal:40, backgroundColor:'#1db954'}} onPress={() => connectToSpotify()}><Text style={{color:'white'}}>Connect to Spotify</Text></TouchableOpacity>}
        {isConnected && 
          <TouchableOpacity onPress={() => setSelectingPlaylist(!selectingPlaylist)} style={{position:'absolute', top:50, left:20, width:30, height:30}}>
            <Image source={{uri: 'https://www.materialui.co/materialIcons/av/playlist_add_white_192x192.png'}} style={{width: 20, height: 20}} />
          </TouchableOpacity>
        }
        {selectingPlaylist &&
          <>
          <Text style={{color:'white', fontSize:16, position:'absolute', top:80, left:10}}>Select Source Playlist</Text>

          <ScrollWrapper style={{width:width}}>

            <PlaylistContainer>
              
              {spotifyPlaylists !== null && spotifyPlaylists.map((playlist, index) => {
                return (
                  <Playlist key={index} onPress={() => {

                    setSelectingPlaylist(false)
                    selectPlaylist(playlist.id)
                    
                    }}>
                      <Image source={{uri: playlist.images[0].url}} style={{width: 80, height: 80, marginRight:10}} />
                      <View style={{flex: 1}}>
                        <Text style={{color:"white"}}>{playlist.name}</Text>
                      </View>
                  </Playlist>
                )
              })}
            </PlaylistContainer>
          </ScrollWrapper>
          </>
      }

      {/* Recommendation FLOW */}
      {Array.isArray(recommendations) && recommendations.length > 0 ?
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
        : isConnected && !selectingPlaylist &&  <Text style={{color:'white', fontSize:16, marginVertical:10, marginHorizontal:10}} >Select a source playlist for your recommendations.</Text>
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
  background-color: #111;
  align-items:center;
  justify-content:center;
`

const ScrollWrapper = styled.ScrollView`
  margin:110px 0 0 0;
  flex:1;
`

const PlaylistContainer = styled.View`
  flex:1;
  background-color:#111;
  flex-direction:column;
`

const ThumbnailContainer = styled.View`
  flex:1;
  flex-direction:column;
`

const Playlist = styled.TouchableOpacity`
  height:80;
  padding:5px 10px 5px 0;
  flex:1;
  flex-direction:row;
  flex-wrap:wrap;
  align-items:center;
  background-color:#222;
  color:white;
  margin:10px 0;
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
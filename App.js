import React, {useEffect, useState} from 'react';
import { Text, View, Button, ScrollView, Image, TouchableOpacity } from 'react-native';
import styled from 'styled-components'

import getTokens from './src/functions/spotify/getTokens'

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

  const connectToSpotify = async () => {
    const {accessTokenData, refreshTokenData, expirationTimeData} = await getTokens();
    setAccessToken(accessTokenData)
    setRefreshToken(refreshTokenData)
    setExpirationTime(expirationTimeData)
  }

  const getSpotifyUserId = async () => {
    let response = await fetch('https://api.spotify.com/v1/me', { 
      method: 'GET', 
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`
      }), 
    })
    
    let data = await response.json()

    return data.id
  }

  const getSpotifyPlaylists = async (userId) => {
    let response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, { 
      method: 'GET', 
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`
      }), 
    })

    let data = await response.json()
    console.log("Data: ", data)
    return data.items
  }

  const getSpotifyUserData = async () => {
    let userId = await getSpotifyUserId()
    const playlists = await getSpotifyPlaylists(userId)
    setSpotifyPlaylists(playlists)

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

  getRecommendationsFromPlaylist = async (playlist) => {
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

    console.log("Recommendation data: ", recommendationData.map(track => track))

    setRecommendations(recommendationData)

    return recommendationData

  }

  return (
    <Wrapper>
        {accessToken === null && <Button color="#1db954" title="Connect to Spotify" onPress={() => connectToSpotify()} />}
        {accessToken && spotifyUserId === null && spotifyPlaylists === null && <Button title="Get DATA" onPress={() => getSpotifyUserData()}></Button>}
        {spotifyPlaylists !== null && recommendations === null &&
          <ScrollWrapper>
            <PlaylistContainer>
              
              {spotifyPlaylists !== null && spotifyPlaylists.map((playlist, index) => {
                return (
                  <Playlist key={index} onPress={() => selectPlaylist(playlist.id)}>
                      <Image source={{uri: playlist.images[0].url}} style={{width: 80, height: 80, marginRight:10}} />
                      <Text style={{color:"white"}}>{playlist.name}</Text>
                  </Playlist>
                )
              })}
            </PlaylistContainer>
          </ScrollWrapper>
      }

      {recommendations !== null &&
        <ScrollWrapper style={{width:width}}>
          
          <PlaylistContainer>
          <Button style={{flex:1}} color="red" title="Back to Playlists" onPress={() => setRecommendations(null)}></Button>
            {recommendations.map((track, index) => {
              return (
                <Playlist key={index}>
                    <Image source={{uri: track.album.images[0].url}} style={{width: 80, height: 80, marginRight:10}} />
                    <View style={{flex: 1}}>
                      <Text style={{color:"white"}}>{track.name}</Text>
                      <Text style={{color:"grey", fontSize:10}}>{track.artists.map(artist => artist.name).join(', ')}</Text>
                    </View>
                </Playlist>
              )
            })}
            <Button style={{flex:1}} color="red" title="Back to Playlists" onPress={() => setRecommendations(null)}></Button>
          </PlaylistContainer>
          
        </ScrollWrapper>
      }
    </Wrapper>
  );
}

const Wrapper = styled.View`
  flex:1;
  background-color: #222;
  align-items:center;
  justify-content:center;
  padding:50px 0 0 0;
`

const ScrollWrapper = styled.ScrollView`
  flex:1;
`

const PlaylistContainer = styled.View`
  flex:1;
  background-color:#444;
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
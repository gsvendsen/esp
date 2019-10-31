import React, {useEffect, useState} from 'react';
import { Text, View, Button, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import styled from 'styled-components'
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

import getTokens from './src/functions/spotify/getTokens'
import refreshTokens from './src/functions/spotify/refreshTokens'
import getSpotifyUserId from './src/functions/spotify/getSpotifyUserId'
import getSpotifyPlaylists from './src/functions/spotify/getSpotifyPlaylists'

import { Dimensions } from "react-native";

import { firestore } from './firebase'

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height

import {AsyncStorage} from 'react-native';

let soundObject = new Audio.Sound();

export default function App() {

  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [expirationTime, setExpirationTime] = useState(null);
  const [spotifyUserId, setSpotifyUserId] = useState(null);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [newSong, setNewSong] = useState(null);
  const [isConnected, setIsConnected] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const [seedTracks, setSeedTracks] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedPlaylistTracks, setSelectedPlaylistTracks] = useState(null);
  const [targetPlaylist, setTargetPlaylist] = useState(null);

  const [selectingPlaylist, setSelectingPlaylist] = useState(false);
  const [selectingTargetPlaylist, setSelectingTargetPlaylist] = useState(false);

  const [viewingBookmarks, setViewingBookmarks] = useState(null);

  console.disableYellowBox = true;
  useEffect(() => {

    firebaseStuff()
    _retrieveData()

  }, [])


  const firebaseStuff = async () => {
    const snapshot = await firestore.collection('posts').get()

    const posts = snapshot.docs.map(doc => { return { id: doc.id, ...doc.data()}})
  
    console.log(posts)
  
  }



  const _retrieveData = async () => {
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
      // We have data!!
      setAccessToken(user.accessToken)
      setRefreshToken(user.refreshToken)
      setExpirationTime(user.expirationTime)
      setIsConnected(true)

      let userId = await getSpotifyUserId(user.accessToken)
      const playlists = await getSpotifyPlaylists(user.accessToken, userId)
      setSpotifyPlaylists(playlists)
    }
  }


  const _storeData = async (data) => {
    try {
      await AsyncStorage.setItem('USER', JSON.stringify(data));
    } catch (error) {
      // Error saving data
    }
  };

  const connectToSpotify = async () => {
    const {accessTokenData, refreshTokenData, expirationTimeData} = await getTokens();
    setAccessToken(accessTokenData)
    setRefreshToken(refreshTokenData)
    setExpirationTime(expirationTimeData)

    let userId = await getSpotifyUserId(accessTokenData)
    const playlists = await getSpotifyPlaylists(accessTokenData, userId)
    setSpotifyPlaylists(playlists)
    setIsConnected(true)
    _storeData({accessToken:accessTokenData, refreshToken:refreshTokenData, expirationTime:expirationTimeData})

    const query = await firestore.collection('users').where('spotifyID', '==', userId).get()
    const userExistsInDB = false

    query.forEach(doc => {
      userExistsInDB = true
    })

    if(!userExistsInDB){
      console.log("not exists!!")
      const docRef = await firestore.collection('users').add({spotifyID: userId})
    }
  }

  const selectPlaylist = async (playlist) => {
    let response = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}`, { 
      method: 'GET', 
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`
      }), 
    })


    let data = await response.json()

    let tracks = data.tracks.items

    let tracksIds = tracks.map((track) => track.track.id)

    setSelectedPlaylist(playlist)
    setSelectedPlaylistTracks(tracksIds)

    getRecommendationsFromPlaylist(tracksIds, true)
    // Array of all track IDs 
    return tracksIds 

  }

  const getRecommendationsFromPlaylist = async (playlist, reset) => {
    const shuffled = playlist.sort(() => 0.5 - Math.random());

    // Get sub-array of first n elements after shuffled
    let selected = shuffled.slice(0, 5);

    setSeedTracks(selected)

    const queryIds = selected.join(',')

    let response2 = await fetch(`https://api.spotify.com/v1/recommendations?seed_tracks=${queryIds}`, { 
      method: 'GET', 
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`
      }), 
    })

    let data2 = await response2.json()

    const recommendationData = data2.tracks

    if(recommendations === null){
      setRecommendations(recommendationData)
    } else {
      if(reset){
        setRecommendations(recommendationData)
      } else {
        setRecommendations([...recommendations, ...recommendationData])
      }
    }


    return recommendationData

  }


  const playMusic = async (songUrl) => {
    console.log("Playing: ", songUrl)
    await soundObject.loadAsync({uri: songUrl});
    await soundObject.playAsync();
    console.log(await soundObject.getStatusAsync())
  }

  const stopMusic = async (songUrl) => {
    try {
      await soundObject.unloadAsync();
      await soundObject.stopAsync();
    } catch (error) {
      
    }
  }

  const addSongToPlaylist = async (songId, playlistId) => {

    let body = {
      uris:[`spotify:track:${songId}`]
    }

    await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, { 
      method: 'POST', 
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`
      }),
      body: JSON.stringify(body)
    })
  }

  const saveRecommendationFlow = async (seedTracks) => {
    let userId = await getSpotifyUserId(accessToken)
    const docRef = await firestore.collection('recommendationFlows').add({seedTracks: seedTracks, userID: userId})
  }
  // https://cdn.iconscout.com/icon/premium/png-256-thumb/music-playlist-5-599896.png
  return (
    <Wrapper>

        {isConnected === false &&
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

        {/* NAVBAR */}
        {isConnected &&
        <View style={{flex:1, width:width, height:150, alignItems:"center", position:"absolute", top:0, paddingLeft:20, paddingRight:15, flexDirection:"row", justifyContent:"space-between"}}>
            {!selectingTargetPlaylist && !viewingBookmarks ? < TouchableOpacity onPress={() => setSelectingPlaylist(!selectingPlaylist)} style={{width:50, height:50}}>
              <Image source={{uri: 'https://i.imgur.com/obUE3wx.png'}} style={{width: 40, height: 40}} />
            </TouchableOpacity> : <View />}

            {selectedPlaylist !== null && !selectingPlaylist && !viewingBookmarks && !selectingTargetPlaylist &&
              <>
                <Image source={{uri: selectedPlaylist.images[0].url}} style={{width: 40, height: 40}} />
                <Text>{selectedPlaylist.name}</Text>
              </>    
            }

            {!selectingPlaylist && !viewingBookmarks &&
            <TouchableOpacity onPress={() => setSelectingTargetPlaylist(!selectingTargetPlaylist)} style={{width:50, height:50}}>
              <Image source={{uri: 'https://i.imgur.com/RXo3Gcv.png'}} style={{width: 40, height: 40}} />
            </TouchableOpacity>}
        </View>
        }

        {/* PAGE || SELECT A SOURCE PLAYLIST */}
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

      {/* PAGE || SELECT A TARGET PLAYLIST */}
      {selectingTargetPlaylist &&
        <View style={{flex:1, alignItems:"center"}}>
          <Text style={{color:'black', fontWeight:'bold', fontSize:16, position:'absolute', top:55}}>Select Target Playlist</Text>

          <ScrollWrapper style={{width:width}}>

            <PlaylistContainer>
              
              {spotifyPlaylists !== null && spotifyPlaylists.map((playlist, index) => {
                return (
                  <Playlist style={{width:(width-40)/2}} key={index} onPress={() => {
                    setSelectingTargetPlaylist(false)
                    setTargetPlaylist(playlist)
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

        {/* PAGE || SELECT A BOOKMARK */}
      {viewingBookmarks &&
        <View style={{flex:1, alignItems:"center"}}>
          <Text style={{color:'black', fontWeight:'bold', fontSize:16, position:'absolute', top:55}}>Select Previous Flow</Text>

          <ScrollWrapper style={{width:width}}>

            <PlaylistContainer>
              
              {viewingBookmarks.map((bookmark, index) => {
                return (
                  <Playlist style={{width:(width-40)/2}} key={index} onPress={() => {
                    setSelectedPlaylist(null)
                    setSelectedPlaylistTracks(bookmark.seedTracks)
                    getRecommendationsFromPlaylist(bookmark.seedTracks, true)
                    setViewingBookmarks(null)
                  }}>
                      <View style={{flex: 1}}>
                        <Text style={{color:"black", marginBottom:5}}>Bookmark: {index+1}</Text>
                      </View>
                  </Playlist>
                )
              })}
            </PlaylistContainer>
          </ScrollWrapper>
        </View>
        }

      {/* Recommendation FLOW */}
      {Array.isArray(recommendations) && recommendations.length > 0 && !selectingTargetPlaylist && !viewingBookmarks && !selectingPlaylist ? !targetPlaylist ? <Text style={{color:'grey', fontSize:16, marginVertical:10, marginHorizontal:50}}>select a target playlist</Text> :
              <ScrollWrapper style={{width:width}}>

              {/* Recommendation Thumbnail */}
              <ThumbnailContainer>
                <Thumbnail size={width-100}>
                    <Image source={{uri: recommendations[0].album.images[0].url}} style={{width: width-150, height: width-150, marginRight:10}} />
                    <View style={{flex: 1, marginTop:5}}>
                      <Text style={{color:"black"}}>{recommendations[0].name}</Text>
                      <Text style={{color:"grey", fontSize:10}}>{recommendations[0].artists.map(artist => artist.name).join(', ')}</Text>
                    </View>
                </Thumbnail>
              </ThumbnailContainer>
      
              <View style={{flex:1, flexDirection:'row', justifyContent:'center'}}>
                {/* Toggle music */}
                <TouchableOpacity style={{marginHorizontal:10}} style={{width:50, height:50, borderRadius:50, borderRadius:1, borderColor:"black", flex:1, justifyContent:"center", alignItems:"center"}} onPress={async () => {
                  setIsAudioPlaying(!isAudioPlaying)
                  const status = await soundObject.getStatusAsync()
                  if(status.isLoaded === false){
                    playMusic(recommendations[0].preview_url)
                  } else {
                    stopMusic()
                  }
                }}>
                  <Image source={{uri: isAudioPlaying ? "https://i.imgur.com/MlNDifj.png" : "https://i.imgur.com/9I5gch8.png"}} style={{width:30, height:30}} />
                </TouchableOpacity>
              </View>

              <View style={{flex:1, flexDirection:'row', justifyContent:'space-evenly', marginVertical:10}}>

                {/* Decline recommendation */}
                <TouchableOpacity style={{marginHorizontal:10}} style={{backgroundColor:"#CD5555"}} title="No" onPress={() => {
                  stopMusic()
                  setIsAudioPlaying(false)
                  if(recommendations.length <= 5){
                    getRecommendationsFromPlaylist(selectedPlaylistTracks)
                  }
                  let nextRecommendations = recommendations.splice(1, recommendations.length)
                  setRecommendations(nextRecommendations)

                  
                }}><Text style={{color:"white", paddingHorizontal:45, paddingVertical:5}}>No</Text></TouchableOpacity>

                {/* Accept recommendation */}
                <TouchableOpacity style={{marginHorizontal:10}} style={{backgroundColor:"#335855"}} title="Yes" onPress={() => {
                  stopMusic()
                  setIsAudioPlaying(false)
                  if(recommendations.length <= 5){
                    getRecommendationsFromPlaylist(selectedPlaylistTracks)
                  }
                  addSongToPlaylist(recommendations[0].id, targetPlaylist.id)
                  let nextRecommendations = recommendations.splice(1, recommendations.length)
                  setRecommendations(nextRecommendations)
                  
                }}><Text style={{color:"white", paddingHorizontal:45, paddingVertical:5}}>Yes</Text></TouchableOpacity>

              </View>
      
              {/* Listen on Spotify button // Save flow */}
              <View style={{flex:1, flexDirection:'row', justifyContent:'center', alignItems:'center', marginTop:20}}>
                <Image source={{uri: 'http://pluspng.com/img-png/spotify-logo-png-open-2000.png'}} style={{width: 30, height: 30, marginHorizontal:10}} />
                <Text style={{color: 'black', marginHorizontal:15}}
                      onPress={() => Linking.openURL(recommendations[0].external_urls.spotify)}>
                  Listen on Spotify
                </Text>
                <TouchableOpacity style={{marginHorizontal:15}}
                  onPress={() => saveRecommendationFlow(seedTracks)}>
                  <Image source={{uri: 'https://i.imgur.com/FAZnaRu.png'}} style={{width: 30, height: 30, marginHorizontal:10}} />
                </TouchableOpacity>
              </View>      
            </ScrollWrapper>
        : isConnected && !selectingPlaylist && !selectingTargetPlaylist && !viewingBookmarks &&  <Text style={{color:'grey', fontSize:16, marginVertical:10, marginHorizontal:50}} >select a source playlist</Text>
      }
      {/* View all my flows */}
      {!selectingPlaylist && !selectingTargetPlaylist &&
      <View style={{flex:1, position:"absolute", bottom:10, flexDirection:'row', justifyContent:'center', alignItems:'center', marginTop:20}}>
        {!viewingBookmarks ?
        <Text style={{color: 'black', marginHorizontal:15}} onPress={async () => {
          let userId = await getSpotifyUserId(accessToken)
          const query = await firestore.collection('recommendationFlows').where('userID', '==', userId).get()
          const bookmarks = query.docs.map(doc => {
            return doc.data()
          })
          setViewingBookmarks(bookmarks)
          }}>
          View bookmarked flows
        </Text> :
        <Text style={{color: 'black', marginHorizontal:15}} onPress={() => {
          setViewingBookmarks(null)
          }}>
          Go back
        </Text>
      }
      </View>}

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
  margin-top:40px;
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
import React, {useEffect, useState} from 'react';
import { Text, View, Image, TouchableOpacity, Linking, Dimensions } from 'react-native';
import styled from 'styled-components'
import { LinearGradient } from 'expo-linear-gradient';

// Pages
import Login from './src/pages/login'

// Spotify
import getTokens from './src/functions/spotify/getTokens'
import getSpotifyUserId from './src/functions/spotify/getSpotifyUserId'
import getSpotifyPlaylists from './src/functions/spotify/getSpotifyPlaylists'
import getPlaylistIds from './src/functions/spotify/getPlaylistIds'
import addSongToPlaylist from './src/functions/spotify/addSongToPlaylist'

// Firebase
import { firestore } from './firebase'
import receiveShareData from './src/functions/firebase/receiveShareData'

// Async Storage
import _retrieveData from './src/functions/async_storage/retrieveData'

// Audio
import { Audio } from 'expo-av';
import playMusic from './src/functions/audio/playMusic'
import stopMusic from './src/functions/audio/stopMusic'

import Prompt from 'react-native-input-prompt';
import Navbar from './src/components/Navbar';
import SelectSourcePlaylist from './src/pages/selectSourcePlaylist';
import SelectTargetPlaylist from './src/pages/selectTargetPlaylist';
import SelectBookmark from './src/pages/selectBookmark';
import Flow from './src/pages/flow';

var width = Dimensions.get('window').width; //full width

let soundObject = new Audio.Sound();

export default function App() {

  // Spotify Access Token
  const [accessToken, setAccessToken] = useState(null);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [isConnected, setIsConnected] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const [seedTracks, setSeedTracks] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState([]);
  const [selectedPlaylistTracks, setSelectedPlaylistTracks] = useState(null);
  const [targetPlaylist, setTargetPlaylist] = useState(null);

  const [selectingPlaylist, setSelectingPlaylist] = useState(false);
  const [selectingTargetPlaylist, setSelectingTargetPlaylist] = useState(false);

  const [viewingBookmarks, setViewingBookmarks] = useState(null);
  const [isPromptVisible, setIsPromptVisible] = useState(false);

  // Turns off debug yellow box in mobile view
  console.disableYellowBox = true;

  useEffect(() => {

    init()

  }, [])

  const init = async () => {
    const user = await _retrieveData()
    let userId = await getSpotifyUserId(user.accessToken)
    const playlists = await getSpotifyPlaylists(user.accessToken, userId)

    setSpotifyPlaylists(playlists)
    setAccessToken(user.accessToken)
    setIsConnected(true)

    const sharedData = receiveShareData()

    // If URL contains shared bookmark ID
    if(sharedData !== null){
      setIsAudioPlaying(false)
      stopMusic(soundObject)
      setSelectedPlaylist([])
      setSelectedPlaylistTracks(sharedData)
      const recommendations = getRecommendationsFromPlaylist(null, true, sharedData, accessToken)
      setRecommendations(recommendations)
      setViewingBookmarks(null)
    }
  }

  const connectToSpotify = async () => {
    const {accessTokenData, refreshTokenData, expirationTimeData} = await getTokens();
    setAccessToken(accessTokenData)
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

    // Adds Spotify user ID to Firebase if new
    if(!userExistsInDB){
      const docRef = await firestore.collection('users').add({spotifyID: userId})
    }
  }

  const getRecommendationsFromPlaylist = async (arrayOfPlaylists, reset, seedTracks, accessToken) => {
    let finalSeeds = []
    let queryIds

    // arrrayOfPlaylists is null if seedTracks already exists
    if(arrayOfPlaylists !== null){
      let index = 0
      while(finalSeeds.length < 5){
        if(index > arrayOfPlaylists.length - 1){
          index = 0
        }
        let shuffled = arrayOfPlaylists[index].sort(() => 0.5 - Math.random());
        let selected = shuffled[0]
        finalSeeds.push(selected)
        index += 1
      }
      setSeedTracks(finalSeeds)
      queryIds = finalSeeds.join(',')
    } else {
      queryIds = seedTracks.join(',')
    }

    let response2 = await fetch(`https://api.spotify.com/v1/recommendations?seed_tracks=${queryIds}`, { 
      method: 'GET', 
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`
      }), 
    })

    let data2 = await response2.json()
    let recommendationData = data2.tracks
    recommendationData = recommendationData.filter((track) => {
      return track.preview_url !== null
    })
    let finalRecommendations
    if(recommendations === null){
      finalRecommendations = recommendationData
    } else {
      if(reset){
        finalRecommendations = recommendationData
      } else {
        finalRecommendations = [...recommendations, ...recommendationData]
      }
    }

    return finalRecommendations
  }

  const toggleSelectSourcePlaylist = async (playlist) => {
    const result = selectedPlaylist.filter(existingPlaylist => {
      return existingPlaylist === playlist
    })
    if(result.length > 0){
      // Un-select playlist
      const filteredSelection = selectedPlaylist.filter(existingPlaylist => {
        return existingPlaylist !== playlist
      })
      setSelectedPlaylist(filteredSelection)
      const playlistsIds = await getPlaylistIds(filteredSelection, accessToken)

      setSelectedPlaylistTracks(playlistsIds)
      const recommendations = await getRecommendationsFromPlaylist(playlistsIds, true, null, accessToken)
      setRecommendations(recommendations)
    } else {
      // Select playlist if less than 5 playlists are selected
      if(selectedPlaylist.length < 5) {
        //Add playlist to selections
        setSelectedPlaylist([...selectedPlaylist, playlist])
        const playlistsIds = await getPlaylistIds([...selectedPlaylist, playlist], accessToken)
        setSelectedPlaylistTracks(playlistsIds)
        const recommendations = await getRecommendationsFromPlaylist(playlistsIds, true, null, accessToken)
        setRecommendations(recommendations)
      }
    }
  }

  return (
    <Wrapper>

      {isConnected === false &&
      <Login onLogin={connectToSpotify} />
      }

      {/* NAVBAR */}
      {isConnected && !viewingBookmarks &&
      <Navbar
        onSelectSource={() => {
          setSelectingPlaylist(!selectingPlaylist)
          stopMusic(soundObject)
          setIsAudioPlaying(false)
        }}
        onSelectTarget={() => {
          setSelectingTargetPlaylist(!selectingTargetPlaylist)
          stopMusic(soundObject)
          setIsAudioPlaying(false)
        }}
        selectingSource={selectingPlaylist}
        selectingTarget={selectingTargetPlaylist}
      />
      }

      {/* PAGE || SELECT A SOURCE PLAYLIST */}
      {selectingPlaylist && Array.isArray(spotifyPlaylists) &&
          <SelectSourcePlaylist
            allPlaylists={spotifyPlaylists}
            selectedPlaylist={selectedPlaylist}
            onPlaylistSelect={(playlist) => toggleSelectSourcePlaylist(playlist)}
          />
      }

      {/* PAGE || SELECT A TARGET PLAYLIST */}
      {selectingTargetPlaylist && Array.isArray(spotifyPlaylists) &&
        <SelectTargetPlaylist
          allPlaylists={spotifyPlaylists}
          onPlaylistSelect={(playlist) => {
            setSelectingTargetPlaylist(false)
            setTargetPlaylist(playlist)
          }}
        />
      }

      {/* PAGE || SELECT A BOOKMARK */}
      {viewingBookmarks &&
        <SelectBookmark
          bookmarks={viewingBookmarks}
          onBookmarkSelect={async (bookmark) => {
            setIsAudioPlaying(false)
            stopMusic(soundObject)
            setSelectedPlaylist([])
            setSelectedPlaylistTracks(bookmark.seedTracks)
            const recommendations = await getRecommendationsFromPlaylist(null, true, bookmark.seedTracks, accessToken)
            setRecommendations(recommendations)
            setViewingBookmarks(null)
          }}
        />
      }

      {/* Recommendation FLOW */}
      {Array.isArray(recommendations) && recommendations.length > 0 && !selectingTargetPlaylist && !viewingBookmarks && !selectingPlaylist ? !targetPlaylist ? <Text style={{color:'grey', fontSize:16, marginVertical:10, marginHorizontal:50}}>select a target playlist</Text> :
              <Flow
                recommendations={recommendations}
                onToggleMusic={async () => {
                  setIsAudioPlaying(!isAudioPlaying)
                  const status = await soundObject.getStatusAsync()
                  if(status.isLoaded === false){
                      playMusic(soundObject, recommendations[0].preview_url)
                  } else {
                      stopMusic(soundObject)
                  }}}
                onDeclineRecommendation={async () => {
                  stopMusic(soundObject)
                  setIsAudioPlaying(false)
                  if(recommendations.length <= 5){
                    console.log("Selected playlists: ", selectedPlaylistTracks);

                      const recommendations = await getRecommendationsFromPlaylist(selectedPlaylistTracks, null, null, accessToken)
                      let nextRecommendations = recommendations.splice(1, recommendations.length)
                      setRecommendations(nextRecommendations)
                  } else {
                      let nextRecommendations = recommendations.splice(1, recommendations.length)
                      setRecommendations(nextRecommendations)
                  }
                 }}
                onAcceptRecommendation={async () => {
                  stopMusic(soundObject)
                  setIsAudioPlaying(false)
                  if(recommendations.length <= 5){
                      console.log("Selected playlists: ", selectedPlaylistTracks);
                      
                      const recommendations = await getRecommendationsFromPlaylist(selectedPlaylistTracks, null, null, accessToken)
                      let nextRecommendations = recommendations.splice(1, recommendations.length)
                      setRecommendations(nextRecommendations)
                  } else {
                      let nextRecommendations = recommendations.splice(1, recommendations.length)
                      setRecommendations(nextRecommendations)
                  }
                  addSongToPlaylist(recommendations[0].id, targetPlaylist.id, accessToken)}}
                onBookmarkPress={() => setIsPromptVisible(true)}
                isAudioActive={isAudioPlaying}
              />
        : isConnected && !selectingPlaylist && !selectingTargetPlaylist && !viewingBookmarks &&  <Text style={{color:'grey', fontSize:16, marginVertical:10, marginHorizontal:50}} >select a source playlist</Text>
      }
      {/* View all Bookmarks BUTTON */}
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
        <Text style={{color: 'black', marginHorizontal:15}} onPress={() => { setViewingBookmarks(null) }}>
          Go back
        </Text>
      }
      </View>}

      {/* New Bookmark // PROMPT */}
      <Prompt
        visible={isPromptVisible}
        title="New Flow Bookmark"
        placeholder="Enter name"
        onCancel={() =>
          setIsPromptVisible(false)
        }
        onSubmit={text =>
            {
              if (text === ""){
                saveRecommendationFlow(seedTracks, `Untitled - ${(new Date()).toISOString().slice(0,10).replace(/-/g,"-")}`, accessToken)
              }
  
              saveRecommendationFlow(seedTracks, text, accessToken)
              setIsPromptVisible(false)
            }

        }
      />

    </Wrapper>
  );
}

const Wrapper = styled.View`
  flex:1;
  background-color: #F7F7F7;
  align-items:center;
  justify-content:center;
`
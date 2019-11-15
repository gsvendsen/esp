import React, {useEffect, useState} from 'react';
import { Text, View, Image, TouchableOpacity, Linking, Dimensions, Clipboard } from 'react-native';
import styled from 'styled-components'

// Pages
import Login from './src/pages/login'
import SelectSourcePlaylist from './src/pages/selectSourcePlaylist';
import SelectTargetPlaylist from './src/pages/selectTargetPlaylist';
import SelectBookmark from './src/pages/selectBookmark';
import Flow from './src/pages/flow';

// Spotify
import getTokens from './src/functions/spotify/getTokens'
import getSpotifyUserId from './src/functions/spotify/getSpotifyUserId'
import getSpotifyPlaylists from './src/functions/spotify/getSpotifyPlaylists'
import getPlaylistIds from './src/functions/spotify/getPlaylistIds'
import addSongToPlaylist from './src/functions/spotify/addSongToPlaylist'

// Firebase
import { firestore } from './firebase'
import receiveShareData from './src/functions/firebase/receiveShareData'
import saveRecommendationFlow from './src/functions/firebase/saveRecommendationFlow'
import deleteRecommendationFlow from './src/functions/firebase/deleteRecommendationFlow';

// Async Storage
import _retrieveData from './src/functions/async_storage/retrieveData'

// Audio
import { Audio } from 'expo-av';
import playMusic from './src/functions/audio/playMusic'
import stopMusic from './src/functions/audio/stopMusic'

// Navbar
import Navbar from './src/components/Navbar';

// Packages
import Prompt from 'react-native-input-prompt';
import FlashMessage from "react-native-flash-message";
import { showMessage, hideMessage } from "react-native-flash-message";
import { LinearGradient } from 'expo-linear-gradient';

let soundObject = new Audio.Sound();

export default function App() {

  // Spotify Access Token
  const [accessToken, setAccessToken] = useState(null);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState(null);
  const [spotifyUserId, setSpotifyUserId] = useState(null);
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

  // Runs every time the app starts
  const init = async () => {

    // Tokens from AsyncStorage
    const user = await _retrieveData()
    if(user !== null){
      let userId = await getSpotifyUserId(user.accessToken)
      const playlists = await getSpotifyPlaylists(user.accessToken, userId)
      setSpotifyPlaylists(playlists)
      setAccessToken(user.accessToken)
      setIsConnected(true)
      setSpotifyUserId(userId)
  
      const sharedData = await receiveShareData()
      
      // If URL contains shared bookmark ID
      if(sharedData !== null){
        setIsAudioPlaying(false)
        stopMusic(soundObject)
        setSelectedPlaylist([])
        setSelectedPlaylistTracks(sharedData)
        const recommendations = await getRecommendationsFromPlaylist(null, true, sharedData, user.accessToken)
        setRecommendations(recommendations)
        setViewingBookmarks(null)
      }
    } else {
      setIsConnected(false)
    }
  }

  const connectToSpotify = async () => {
    const {accessTokenData, refreshTokenData, expirationTimeData} = await getTokens();
    setAccessToken(accessTokenData)
    let userId = await getSpotifyUserId(accessTokenData)
    const playlists = await getSpotifyPlaylists(accessTokenData, userId)
    setSpotifyPlaylists(playlists)
    setSpotifyUserId(userId)
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
      setSeedTracks(seedTracks)
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
          allPlaylists={spotifyPlaylists.filter(playlist => {
            return playlist.collaborative || playlist.owner.id === spotifyUserId
          })}
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
          deleteBookmark={(async (bookmark) => {
            deleteRecommendationFlow(bookmark.id)
            const newBookmarks = viewingBookmarks.filter(existingBookmark => {
              return existingBookmark.id !== bookmark.id
            })
            setViewingBookmarks(newBookmarks)
            showMessage({
              message:"Bookmark deleted!",
              type:"default"
            })
          })}
          onExit={() => setViewingBookmarks(false)}
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
            addSongToPlaylist(recommendations[0].id, targetPlaylist.id, accessToken)
            showMessage({
              message: `${recommendations[0].name} has been added to ${targetPlaylist.name}!`,
              type: "success"
            })}
          }
            
          onBookmarkPress={() => setIsPromptVisible(true)}
          onClipboardPress={async () => {
            const docRef = await saveRecommendationFlow(seedTracks, `Untitled - ${(new Date()).toISOString().slice(0,10).replace(/-/g,"-")}`, accessToken)
            Clipboard.setString(`https://exp.host/@gsvendsen/esp?share=${docRef.id}`);
            showMessage({
              message: "URL copied to clipboard!",
              type: "success"
            })
          }}
          isAudioActive={isAudioPlaying}
        />
        : isConnected && !selectingPlaylist && !selectingTargetPlaylist && !viewingBookmarks &&  <Text style={{color:'grey', fontSize:16, marginVertical:10, marginHorizontal:50}} >select a source playlist</Text>
      }



      {/* View all Bookmarks BUTTON */}
      {Array.isArray(recommendations) && recommendations.length > 0 && !selectingTargetPlaylist && !viewingBookmarks && !selectingPlaylist && targetPlaylist && <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.1)']}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 50,
        }}
      />}
      {!selectingPlaylist && !selectingTargetPlaylist && isConnected &&
      <View style={{flex:1, position:"absolute", bottom:10, flexDirection:'row', justifyContent:'center', alignItems:'center', marginTop:20}}>
        {!viewingBookmarks &&
        <Text style={{fontWeight:"bold", color: 'black', marginRight:15, marginLeft:25}} onPress={async () => {
          let userId = await getSpotifyUserId(accessToken)
          const query = await firestore.collection('recommendationFlows').where('userID', '==', userId).get()
          const bookmarks = query.docs.map(doc => {
            return {...doc.data(), id:doc.id}
          })
          setViewingBookmarks(bookmarks)
          }}>
          MY SAVED FLOWS
        </Text>}
        {Array.isArray(recommendations) && recommendations.length > 0 && !selectingTargetPlaylist && !viewingBookmarks && !selectingPlaylist && targetPlaylist &&
          <TouchableOpacity style={{marginHorizontal:15}}
            onPress={() => {
              setIsPromptVisible(true)
            }
          }>
          <Text style={{fontWeight:"bold" ,color: 'black', borderLeftWidth:1, borderLeftColor:"black", paddingLeft:25}}>SAVE CURRENT FLOW</Text>
        </TouchableOpacity>

      }
      </View>}

      {/* New Bookmark // PROMPT */}
      <Prompt
        visible={isPromptVisible}
        title="Save current Flow"
        titleStyle={{fontSize:22}}
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
      <FlashMessage position="bottom" />
      
    </Wrapper>
  );
}

const Wrapper = styled.View`
  flex:1;
  background-color: #F7F7F7;
  align-items:center;
  justify-content:center;
`
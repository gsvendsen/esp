export default getPlaylistIds = async (playlists, accessToken) => {

    let playlistsIds = await Promise.all(playlists.map(async (playlist) => {
      let response = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}`, { 
        method: 'GET', 
        headers: new Headers({
          'Authorization': `Bearer ${accessToken}`
        }), 
      })
  
  
      let data = await response.json()
  
      let tracks = data.tracks.items
  
      let tracksIds = tracks.map((track) => track.track.id)

      return tracksIds
    }))

    // Array of all track IDs 
    return playlistsIds 

}
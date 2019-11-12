export default addSongToPlaylist = async (songId, playlistId, accessToken) => {

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
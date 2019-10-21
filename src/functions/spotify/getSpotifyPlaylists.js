export default getSpotifyPlaylists = async (accessToken, userId) => {
    let response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, { 
      method: 'GET', 
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`
      }), 
    })

    let data = await response.json()
    console.log(data)
    return data.items
  }
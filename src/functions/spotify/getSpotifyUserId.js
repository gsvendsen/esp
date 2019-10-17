export default getSpotifyUserId = async (accessToken) => {
    let response = await fetch('https://api.spotify.com/v1/me', { 
      method: 'GET', 
      headers: new Headers({
        'Authorization': `Bearer ${accessToken}`
      }), 
    })
    
    let data = await response.json()

    return data.id
  }
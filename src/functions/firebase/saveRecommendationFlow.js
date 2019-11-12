export default saveRecommendationFlow = async (seedTracks, bookmarkName, accessToken) => {
    let userId = await getSpotifyUserId(accessToken)
    const docRef = await firestore.collection('recommendationFlows').add({seedTracks: seedTracks, userID: userId, name:bookmarkName})
  }
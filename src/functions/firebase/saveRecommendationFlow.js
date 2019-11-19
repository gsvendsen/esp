import getSpotifyUserId from '../spotify/getSpotifyUserId'
import { firestore } from '../../../firebase'

export default saveRecommendationFlow = async (seedTracks, bookmarkName, accessToken) => {
  let userId = await getSpotifyUserId(accessToken)
  if(bookmarkName === ''){
    userId = ''
  }
  const docRef = await firestore.collection('recommendationFlows').add({seedTracks: seedTracks, userID: userId, name:bookmarkName})
  return docRef
}
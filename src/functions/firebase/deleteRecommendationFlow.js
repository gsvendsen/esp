import { firestore } from '../../../firebase'

export default deleteRecommendationFlow = async (bookmarkId) => {
  const docRef = await firestore.collection('recommendationFlows').doc(bookmarkId).delete()
  return docRef
}
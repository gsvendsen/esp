export const receiveShareData = async () => {
    // If redirected from a sharable URL
    let url = await Linking.getInitialURL()
    window.alert(url)
    let regex = /[?&]([^=#]+)=([^&#]*)/g,
    params = {},
    match;
    while (match = regex.exec(url)) {
      params[match[1]] = match[2];
    }

    if(params.share){
      const docRef = await firestore.collection('recommendationFlows').doc(params.share).get()
      const flowData = docRef.data()
      return flowData.seedTracks      
    }

    return null
  
  }
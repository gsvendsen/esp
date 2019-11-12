export default playMusic = async (soundObject, songUrl) => {
    console.log("Playing: ", songUrl)
    await soundObject.loadAsync({uri: songUrl});
    await soundObject.playAsync();
    console.log(await soundObject.getStatusAsync())
  }

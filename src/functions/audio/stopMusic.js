export default stopMusic = async (soundObject) => {
    try {
      await soundObject.unloadAsync();
      await soundObject.stopAsync();
    } catch (error) {
      
    }
  }
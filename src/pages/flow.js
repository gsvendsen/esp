import React from 'react';
import { Text, View, Image, Dimensions, TouchableOpacity, Linking } from 'react-native';
var width = Dimensions.get('window').width; //full width
import styled from 'styled-components'

export default Flow = (props) => {
    
    const ScrollWrapper = styled.ScrollView`
    margin:100px 0 0 0;
    flex:1;
    `

    const ThumbnailContainer = styled.View`
    flex:1;
    flex-direction:column;
    margin-top:25px;
    `

    const Thumbnail = styled.View`
    height:${props => props.size};
    flex:1;
    align-items:center;
    justify-content:center;
    flex-wrap:wrap;
    color:white;
    margin:10px 0;
    `

    return (
        <ScrollWrapper style={{width:width}}>
        
        {/* Recommendation Thumbnail */}
        <ThumbnailContainer>
            <Thumbnail size={width-70}>
            <Image source={{uri: props.recommendations[0].album.images[0].url}} style={{width: width-120, height: width-120, marginRight:10}} />
            <View style={{flex: 1, marginTop:5}}>
                <Text style={{color:"black"}}>{props.recommendations[0].name}</Text>
                <Text style={{color:"grey", fontSize:10}}>{props.recommendations[0].artists.map(artist => artist.name).join(', ')}</Text>
            </View>
            </Thumbnail>
        </ThumbnailContainer>
        
        <View style={{flex:1, flexDirection:'row', paddingHorizontal:60, justifyContent:'space-between', alignItems:"center"}}>
            {/* Decline recommendation */}
            <TouchableOpacity style={{marginHorizontal:10}} onPress={() => {
                props.onDeclineRecommendation()
            }}>
                <Image source={{uri: "https://i.imgur.com/a7KJOYM.png"}} style={{width:30, height:30}} />
            </TouchableOpacity>
            {/* Toggle music */}
            <TouchableOpacity style={{marginHorizontal:10}} style={{width:50, height:50, borderRadius:50, borderRadius:1, borderColor:"black", flex:1, justifyContent:"center", alignItems:"center"}} onPress={() => {
               props.onToggleMusic() 
            }}>
                <Image source={{uri: props.isAudioActive === true ? "https://i.imgur.com/MlNDifj.png" : "https://i.imgur.com/9I5gch8.png"}} style={{width:30, height:30}} />
            </TouchableOpacity>
            {/* Accept recommendation */}
            <TouchableOpacity style={{marginHorizontal:10}} onPress={() => {
                props.onAcceptRecommendation()
            }}>
                <Image source={{uri: "https://i.imgur.com/lYR5U9Q.png"}} style={{width:30, height:30}} />
            </TouchableOpacity>
        </View>
        
        {/* Listen on Spotify button // Save flow */}
        <View style={{flex:1, flexDirection:'row', justifyContent:'center', alignItems:'center', marginTop:40}}>
            <Image onPress={() => Linking.openURL(recommendations[0].external_urls.spotify)} source={{uri: 'http://pluspng.com/img-png/spotify-logo-png-open-2000.png'}} style={{width: 30, height: 30, marginHorizontal:10}} />
            <TouchableOpacity style={{marginHorizontal:15}}
                onPress={() => {
                    props.onBookmarkPress()
                }
            }>
                <Image source={{uri: 'https://i.imgur.com/FAZnaRu.png'}} style={{width: 30, height: 30, marginHorizontal:10}} />
            </TouchableOpacity>
        </View>      
    </ScrollWrapper>
    )
}



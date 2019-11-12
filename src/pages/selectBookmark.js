import React from 'react';
import { Text, View, Image, Dimensions } from 'react-native';
var width = Dimensions.get('window').width; //full width
import styled from 'styled-components'

export default SelectBookmark = (props) => {

    const BookmarkContainer = styled.View`
    flex:1;
    flex-direction:column;
    padding:0 15px;
    `
  
    const Bookmark = styled.TouchableOpacity`
    margin:10px 0;
    flex:1;
    padding:25px 0 25px 10px;
    border-bottom-color: lightgrey;
    border-bottom-width: 1;
    `

    const ScrollWrapper = styled.ScrollView`
    margin:100px 0 0 0;
    flex:1;
    `

    return (
        <View style={{flex:1, alignItems:"center"}}>
          <Text style={{color:'black', fontWeight:'bold', fontSize:16, position:'absolute', top:55}}>Select Previous Flow</Text>
          <ScrollWrapper style={{width:width}}>
            <BookmarkContainer>
              {props.bookmarks.map((bookmark, index) => {
                return (
                  <Bookmark key={index} onPress={() => {
                    props.onBookmarkSelect(bookmark)
                  }}>
                      <View style={{flex: 1}}>
                        <Text style={{color:"black", marginBottom:5}}>{bookmark.name}</Text>
                      </View>
                  </Bookmark>
                )
              })}
            </BookmarkContainer>
          </ScrollWrapper>
        </View>
    )
}



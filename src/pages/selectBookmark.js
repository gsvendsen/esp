import React from 'react';
import { Text, View, Image, Dimensions, TouchableOpacity } from 'react-native';
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
    padding:20px 0 20px 10px;
    border-bottom-color: lightgrey;
    border-bottom-width: 1;
    `

    const ScrollWrapper = styled.ScrollView`
    margin:100px 0 0 0;
    flex:1;
    `

    return (
        <View style={{flex:1, alignItems:"center"}}>
          <TouchableOpacity onPress={() => props.onExit()} style={{width:30, height:30, position:"absolute", top:55, left:28}}>
            <Image source={{uri: 'https://i.imgur.com/a7KJOYM.png'}} style={{width: 20, height: 20}} />
          </TouchableOpacity>
          <Text style={{color:'black', fontWeight:'bold', fontSize:16, position:'absolute', top:55}}>Select Previous Flow</Text>
          <ScrollWrapper style={{width:width}}>
            <BookmarkContainer>
              {props.bookmarks.map((bookmark, index) => {
                return (
                  <Bookmark key={index} onPress={() => {
                    props.onBookmarkSelect(bookmark)
                  }}>
                      <View style={{flex: 1, position:"relative"}}>
                        <Text style={{color:"black", marginBottom:5}}>{bookmark.name}</Text>
                        <TouchableOpacity onPress={() => {
                          props.deleteBookmark(bookmark)
                        }} style={{width:30, height:30, position:"absolute", right:20}}>
                          <Image source={{uri: 'https://i.imgur.com/5IGnBuc.png'}} style={{width: 20, height: 20}} />
                        </TouchableOpacity>
                      </View>
                  </Bookmark>
                )
              })}
            </BookmarkContainer>
          </ScrollWrapper>
        </View>
    )
}



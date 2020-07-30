import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StatusBar, Dimensions, TextInput, Image, TouchableOpacity } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import RNFS from 'react-native-fs'
import { useIsFocused } from '@react-navigation/native'
import Modal from 'react-native-modal'

// ! back button after clicking pic from camera creates empty folder

export default function Home({ navigation }) {
    const isFocused = useIsFocused()
    const [options, setOptions] = useState(false) // options dialog box
    const [search, setSearch] = useState(false) // search dialog box
    const [searchVal, setSearchVal] = useState('') // current value in search box
    const [sort, setSort] = useState(false) // sort dialog box
    const [folders, setFolders] = useState([])  // array of all document folders
    const [show, setShow] = useState([]) // array of document folders to display
    const [searched, setSearched] = useState(false) // if search has been initiated

    useEffect(() => {
        RNFS.readDir(RNFS.ExternalDirectoryPath)
            .then((arr) => {
                var temp = []
                arr.forEach((val) => {
                    temp.push({
                        mtime : val.mtime,
                        name : val.name,
                        size : val.size,
                        uri : 'file://' + val.path + '/0.jpg'
                    })
                })
                temp.sort((a ,b) => (a.mtime > b.mtime) ? -1 : ((b.mtime > a.mtime) ? 1 : 0)) // sorting according to modification time
                setFolders(temp)
                setShow(temp)
            })
            .catch(e => console.log(e))
    }, [isFocused])

    // to sort folders
    const sorting = (type) => {
        if(type == 'mod') {
            var temp = [...folders]
            temp.sort((a ,b) => (a.mtime > b.mtime) ? -1 : ((b.mtime > a.mtime) ? 1 : 0)) // modification time
            setShow(temp)
        }
        else if(type == 'size') {
            var temp = [...folders]
            temp.sort((a ,b) => (a.size > b.size) ? -1 : ((b.size > a.size) ? 1 : 0)) // size
            setShow(temp)
        }
        else if(type == 'name') {
            var temp = [...folders]
            temp.sort((a ,b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0)) // name
            setShow(temp)
        }
        setSort(false)  // close sort box
    }

    // to search document folder
    const searching = () => {
        var temp = []
        folders.forEach(val => {
            if(val.name.toLowerCase().includes(searchVal.toLowerCase())) // check if searchVal = folder name
                temp.push(val)
        })
        setShow(temp)
        setSearch(false)
        setSearched(true)
    }

    // remove searched results
    const cancelSearch = () => {
        setSearched(false)
        sorting('mod') // sort according to mtime
    }

    return (
        <View style={{flex: 1}}>
            <StatusBar hidden={false} backgroundColor='#393e46' />
            <View style={{ padding: 15, backgroundColor: '#393e46', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 20, color: '#eeeeee', flex: 17 }}>
                    {
                        searched ?
                            `Results for "${searchVal}"` 
                        :
                            'My Documents'
                    }
                </Text>
                {
                    searched &&
                    <TouchableOpacity onPress={() => cancelSearch()}>
                        <Icon name='backspace' size={25} color='#eeeeee'/>
                    </TouchableOpacity>
                }
                <TouchableOpacity onPress={() => {setOptions(!options); setSearch(false); setSort(false)}} style={{flex: 2, alignItems: 'flex-end'}}>
                    <Icon name="dots-vertical" size={30} color="#eeeeee" />
                </TouchableOpacity>
            </View>
            <Modal 
                isVisible={sort} 
                useNativeDriver={true}
                style={{ marginHorizontal: 0, marginVertical: 0}}
                animationIn='slideInRight'
                animationOut='slideOutRight'
                onBackButtonPress={() => setSort(false)}
                backdropOpacity={0.2}
                onBackdropPress={() => setSort(false)}
            >
                <View style={{
                    backgroundColor: '#eeeeee',
                    elevation: 5,
                    padding: 10,
                    borderRadius: 5,
                    zIndex: 4,
                    position: 'absolute',
                    left: Dimensions.get('window').width - 140,
                    top: 50,

                }}>
                        <TouchableOpacity onPress={() => sorting('mod')}>
                            <Text style={{fontSize: 18, marginBottom: 10}}>Last Modified</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => sorting('size')}>
                            <Text style={{fontSize: 18, marginBottom: 10}}>Size</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => sorting('name')}>
                            <Text style={{fontSize: 18, marginBottom: 10}}>Name [A-Z]</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSort(false)}>
                            <Text style={{fontSize: 18, marginBottom: 10,  color: '#76ead7'}}>Close</Text>
                        </TouchableOpacity>   
                    </View>
            </Modal>
            <Modal 
                isVisible={options} 
                useNativeDriver={true}
                style={{ marginHorizontal: 0, marginVertical: 0}}
                animationIn='slideInRight'
                animationOut='slideOutRight'
                onBackButtonPress={() => setOptions(false)}
                backdropOpacity={0.2}
                onBackdropPress={() => setOptions(false)}
            >
                <View
                    style= {{
                        elevation: 5,
                        width: 110,
                        backgroundColor: '#eeeeee',
                        padding: 10,
                        paddingLeft: 15,
                        position: 'absolute',
                        left: Dimensions.get('window').width - 120,
                        top: 50,
                        borderRadius: 5,
                    }}
                    >
                            <TouchableOpacity onPress={() => {setSearch(true); setOptions(false)}}>
                                <Text style={{fontSize: 18, marginBottom: 10}}><Icon name='file-search-outline' size={20}/>Search</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {setSort(true); setOptions(false)}}>
                                <Text style={{fontSize: 18, marginBottom: 10}}><Icon name='sort' size={20}/>Sort</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setOptions(false)}>
                                <Text style={{fontSize: 18, marginBottom: 10, color: '#76ead7'}} >Close</Text>
                            </TouchableOpacity>
                    </View>
            </Modal>
            <Modal 
                isVisible={search} 
                useNativeDriver={true}
                style={{ marginHorizontal: 0, marginVertical: 0}}
                animationIn='slideInRight'
                animationOut='slideOutRight'
                onBackButtonPress={() => setSearch(false)}
                backdropOpacity={0.2}
                onBackdropPress={() => setSearch(false)}
            >
                    <View style={{alignItems: 'center', top: 100, position: 'absolute', width: '100%', zIndex: 2}}>
                        <View style={{
                            backgroundColor: '#eeeeee',
                            width: '80%',
                            height: 120,
                            elevation: 5,
                            borderRadius: 5,
                            padding: 10
                        }}>
                            <TextInput style={{
                                height: 40,
                                borderBottomColor: '#393e46',
                                borderBottomWidth: 1
                            }}
                            placeholder='Document Name'
                            value={searchVal}
                            onChangeText={(text) => setSearchVal(text)}
                            maxLength={25}
                            />
                            <View style={{flexDirection: 'row', justifyContent:'space-evenly', marginTop: 20}}>
                                <TouchableOpacity onPress={() => searching()}>
                                    <Text style={{ color: '#76ead7'}}>Search</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setSearch(false)}>
                                    <Text>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            <ScrollView>
                <View style={{ flex: 1, marginBottom: 10 }}>
                    {
                        show.map((val, i) => {
                                return (
                                    <TouchableOpacity key={i} style={{ margin: 5, alignItems: 'center', borderWidth: 1, borderRadius: 5, borderColor: 'rgba(0,0,0,0.1)', flexDirection: 'row', height: 70, paddingLeft: 10}} onPress={() => navigation.navigate('Document', { name : val.name, pop: false })}>
                                        <Icon name='folder' size={40} color='#393e46'/>
                                        <Text style={{padding: 5, color: '#393e46', width: '100%', fontSize: 16}}>{val.name.slice(0, -17)}</Text>
                                    </TouchableOpacity>
                                )  
                        })
                    }
                </View>
                {
                    show.length == 0 && <Text style={{fontSize: 15, textAlign: 'center', opacity: 0.3, marginTop: 50}}>Tap the camera icon to create a document</Text>
                }
            </ScrollView>
            <View
                style={{
                    backgroundColor: '#393e46',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 10,
                    height: 60,
                    width: 60,
                    borderRadius: 30,
                    position: 'absolute',
                    top: Dimensions.get('window').height - 75,
                    left: '80%',
                    elevation: 5,
                    zIndex: 2
                }}
                
            >
                <TouchableOpacity onPress={() => {navigation.navigate('Camera', { new : true, last : -1, name: null }); setOptions(false); setSearch(false); setSort(false)}}>
                    <Icon name='camera' size={35} color='#eeeeee'/>
                </TouchableOpacity>
            </View>
        </View>
    )
}

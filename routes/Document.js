import React, { useState, useEffect, useCallback } from 'react'
import { ScrollView, View, Text, Dimensions, TextInput, Image, BackHandler, TouchableOpacity } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useIsFocused, useFocusEffect } from '@react-navigation/native'
import RNFS from 'react-native-fs'
import ImageViewer from 'react-native-image-zoom-viewer'
import Modal from 'react-native-modal'
import DraggableFlatList from 'react-native-draggable-flatlist'

export default function Document({ navigation, route }) {
    const isFocused = useIsFocused()
    const [options, setOptions] = useState(false) // options box
    const [rename, setRename] = useState(false) // rename box
    const [nameVal, setNameVal] = useState('') // rename value 
    const [files, setFiles] = useState([]) // images array
    const [name, setName] = useState('') // name of the doc
    const [last, setLast] = useState(0) // last image number
    const [del, setDel] = useState(false) // delete box
    const [nameErr, setNameErr] = useState(false) // err if doc name already exists
    const [uri, setUri] = useState([]) // uri of images in doc
    const [visible, setVisible] = useState(false) // for image viewer
    const [ind, setInd] = useState(0) // index for image viewer
    const [reload, setReload] = useState(false) // to re read the directory
    const [order, setOrder] = useState([]) // rearrange array for Flatlist
    const [rearr, setRearr] = useState(false) // rearrange box

    // to override back button behaviour i.e. not go back to camera rather to home
    useFocusEffect(
        useCallback(() => {
          const onBackPress = () => {
            if(route.params.pop) {
                navigation.pop(2);
                return true
            }
            else
                return false
          };
          BackHandler.addEventListener('hardwareBackPress', onBackPress);
          return () =>
            BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }, [])
    );

    useEffect(() => {
        setName(route.params.name)
        setLast(0)
        RNFS.readDir(RNFS.ExternalDirectoryPath + '/' + route.params.name)
            .then(arr => {
                var temp = [] // for files state
                var size = 0
                var temp2 = [] // for uri state - image viewing
                for(i = 0; i < arr.length; ++i) {
                    temp.push({
                        name: arr[i].name,
                        uri : 'file://' + arr[i].path
                    })
                    size++
                }
                temp.sort((a, b) => a.name.slice(0, -21) > b.name.slice(0, -21) ? 1 : a.name.slice(0, -21) < b.name.slice(0, -21) ? -1 : 0) // sort the arr accoring to img number
                for(i = 0; i < temp.length; i++)
                    temp2.push({ url : temp[i].uri})
                setFiles(temp)
                setUri(temp2)
                setLast(size)
                var temp3 = [...Array(temp.length)].map((d, i) => ({ // for rearranging
                    key: `item-${i}`,
                    label: i+1,
                    backgroundColor: 'white'
                }))
                setOrder(temp3)
            })
            .catch(e => console.log(e))
    }, [isFocused, reload])

    // to rename the document folder
    const renaming = () => {
        if(nameVal.length > 0)
            RNFS.moveFile(RNFS.ExternalDirectoryPath + '/' + name, RNFS.ExternalDirectoryPath + '/' + nameVal + name.slice(-17))
                .then(() => { setName(nameVal + name.slice(-17)); setRename(false); setNameErr(false) })
                .catch(e => {
                    setNameErr(true)
                    console.log(e)
                })
    }

    //to delete the document
    const deleting = () => {
        RNFS.unlink(RNFS.ExternalDirectoryPath + '/' + name)
            .then(() => {
                setDel(false)
                if(route.params.pop)
                    navigation.pop(2)
                else
                    navigation.pop(1)
            })
            .catch(e => console.log(e))
    }

    function delPic(currentIndex) {
        if(currentIndex == 0 && files.length == 1)
            deleting()
        else {
            var pic = files[currentIndex].name
            RNFS.unlink(RNFS.ExternalDirectoryPath+'/'+name+'/'+pic)
                .then( async () => {
                    if(currentIndex != files.length - 1)
                        for(i = currentIndex+1; i < files.length; ++i) {
                            var temp = files[i].name
                            await RNFS.moveFile(RNFS.ExternalDirectoryPath+'/'+name+'/'+temp, RNFS.ExternalDirectoryPath+'/'+name+'/'+(temp.slice(0, -21) - 1)+temp.slice(temp.length - 21))
                        }
                    setVisible(false)
                    setReload(!reload)
                })
                .catch(e => console.log(e))
        }
    }

    renderItem = ({ item, index, drag, isActive}) => { // rearrange dialog box
        return (
            <TouchableOpacity style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isActive ? '#76ead7' : item.backgroundColor,
                height: 60,
                flexDirection: 'row'
            }}
            onLongPress={drag}
            >
                <Text>{item.label}</Text>
            </TouchableOpacity>
        )
    }

    const rearranging = async () => {
        for(var i = 0; i < order.length; i++) {
            await RNFS.moveFile(RNFS.ExternalDirectoryPath+'/'+name+'/'+files[order[i].label - 1].name, RNFS.ExternalDirectoryPath+'/'+name+'/'+i+files[order[i].label - 1].name.slice(-21))
                .catch(e => console.log(e))
        }
        setRearr(false)
        setReload(!reload)
    }

    const cancelRearr = () => { // to cancel rearrange
        setRearr(false)
        setReload(!reload)
    }

    return (
        <View style={{flex: 1}}>
            <View style={{ padding: 15, backgroundColor: '#393e46', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <TouchableOpacity style={{flex: 2, alignItems: 'flex-start'}} onPress={() => { if(route.params.pop) navigation.pop(2); else navigation.pop(1); }}>
                    <Icon name="keyboard-backspace" size={30} color="#eeeeee" />
                </TouchableOpacity>
                <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#eeeeee', flex: 14}}>
                    {name.slice(0, -17)}
                </Text>
                <TouchableOpacity style={{flex: 2, alignItems: 'flex-end'}} onPress={() => setOptions(!options)}>
                    <Icon name="dots-vertical" size={30} color="#eeeeee" />
                </TouchableOpacity>
            </View>
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
                            width: 130,
                            backgroundColor: '#eeeeee',
                            padding: 10,
                            paddingLeft: 15,
                            position: 'absolute',
                            left: Dimensions.get('window').width - 140,
                            top: 50,
                            borderRadius: 5,
                            zIndex: 3
                        }}
                    >
                            <TouchableOpacity onPress={() => {setRename(true); setOptions(false);}}>
                                <Text style={{fontSize: 18, marginBottom: 10}}><Icon name='file-document-edit-outline' size={20}/>Rename</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {setRearr(true); setOptions(false)}}>
                                <Text style={{fontSize: 18, marginBottom: 10}}><Icon name='vector-arrange-above' size={20}/>Rearrange</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {setDel(true); setOptions(false)}}>
                                <Text style={{fontSize: 18, marginBottom: 10}}><Icon name='delete-outline' size={20}/>Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setOptions(false)}>
                                <Text style={{fontSize: 18, marginBottom: 10, color: '#76ead7'}} >Close</Text>
                            </TouchableOpacity>
                    </View>
            </Modal>
            <Modal 
                isVisible={rename} 
                useNativeDriver={true}
                style={{ marginHorizontal: 0, marginVertical: 0}}
                animationIn='slideInRight'
                animationOut='slideOutRight'
                onBackButtonPress={() => setRename(false)}
                backdropOpacity={0.2}
                onBackdropPress={() => setRename(false)}
            >
                        <View style={{alignItems: 'center', top: 100, position: 'absolute', width: '100%', zIndex: 2}}>
                            <View style={{
                                backgroundColor: '#eeeeee',
                                width: '80%',
                                height: 130,
                                elevation: 5,
                                borderRadius: 5,
                                padding: 10,
                            }}>
                                { nameErr && <Text style={{color: 'red'}}>Document already exists</Text>}
                                <TextInput style={{
                                    height: 40,
                                    borderBottomColor: '#393e46',
                                    borderBottomWidth: 1
                                }}
                                placeholder='Max. 25 characters'
                                value={nameVal}
                                onChangeText={(text) => setNameVal(text)}
                                maxLength={25}
                                />
                                <View style={{flexDirection: 'row', justifyContent:'space-evenly', marginTop: 20}}>
                                    <TouchableOpacity onPress={() => renaming()}>
                                        <Text style={{ color: '#76ead7'}}>Confirm</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setRename(false)}>
                                        <Text>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                </Modal>
                <Modal 
                    isVisible={del} 
                    useNativeDriver={true}
                    style={{ marginHorizontal: 0, marginVertical: 0}}
                    animationIn='slideInRight'
                    animationOut='slideOutRight'
                    onBackButtonPress={() => setDel(false)}
                    backdropOpacity={0.2}
                    onBackdropPress={() => setDel(false)}
                >
                        <View style={{alignItems: 'center', top: 100, position: 'absolute', width: '100%', zIndex: 2}}>
                            <View style={{
                                backgroundColor: '#eeeeee',
                                width: '80%',
                                height: 100,
                                elevation: 5,
                                borderRadius: 5,
                                padding: 10,
                                paddingTop: 18
                            }}>
                                <Text style={{fontSize: 15, textAlign: 'center'}}>Are you sure?</Text>
                                <View style={{flexDirection: 'row', justifyContent:'space-evenly', marginTop: 20}}>
                                    <TouchableOpacity onPress={() => deleting()}>
                                        <Text style={{ color: '#76ead7'}}>Confirm</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setDel(false)}>
                                        <Text>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                </Modal>
            <ScrollView>
                    <View style={{ flex: 1, flexDirection: 'row', marginBottom: 60 }}>
                        <View style={{ flex: 1, width: '50%', flexDirection: 'column', }}>
                            {
                                files.map((val, i) => {
                                    if(i % 2 == 0)
                                        return (
                                            <TouchableOpacity key={i} style={{ margin: 5, marginRight: 2.5 }} onPress={() => { setInd(i); setVisible(true) }}>
                                                <Image source={{ uri : val.uri }} style={{width: '100%', height: 250, borderTopLeftRadius: 5, borderTopRightRadius: 5}} />
                                                <Text style={{backgroundColor: 'rgba(0,0,0, 1)', padding: 5, color: '#eeeeee', borderBottomLeftRadius: 5, borderBottomRightRadius: 5}}>{parseInt(val.name.slice(0, -21)) + 1}</Text>
                                            </TouchableOpacity>
                                        )
                                })
                            }
                        </View>
                        <View style={{ flex: 1, width: '50%', flexDirection: 'column', }}>
                            {
                                files.map((val, i) => {
                                    if(i % 2 != 0)
                                        return (
                                            <TouchableOpacity key={i} style={{ margin: 5, marginRight: 2.5 }} onPress={() => { setInd(i); setVisible(true) }}>
                                                <Image source={{ uri : val.uri }} style={{width: '100%', height: 250, borderTopLeftRadius: 5, borderTopRightRadius: 5}} />
                                                <Text style={{backgroundColor: 'rgba(0,0,0, 1)', padding: 5, color: '#eeeeee', borderBottomLeftRadius: 5, borderBottomRightRadius: 5}}>{parseInt(val.name.slice(0, -21)) + 1}</Text>
                                            </TouchableOpacity>
                                        )
                                })
                            }
                        </View>
                    </View>
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
                <TouchableOpacity onPress={() => {navigation.navigate('Camera', { last : last, new : false, name : name }); setOptions(false); setRename(false); setDel(false)}}>
                    <Icon name='camera' size={35} color='#eeeeee'/>
                </TouchableOpacity>
            </View>
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
                    left: '60%',
                    elevation: 5,
                    zIndex: 2
                }}
            >
                <TouchableOpacity onPress={() => {setOptions(false); setRename(false); setDel(false)}}>
                    <Icon name='share-variant' size={35} color='#eeeeee'/>
                </TouchableOpacity>
            </View>
            <Modal 
                isVisible={visible} 
                onBackButtonPress={() => setVisible(false)} 
                style={{marginHorizontal : 0, marginVertical: 0}} 
                useNativeDriver={true}
                animationIn='slideInRight'
                animationOut='slideOutRight'
            >
                <ImageViewer 
                    imageUrls={uri}
                    index={ind}
                    onCancel={() => setVisible(false)}
                    enableSwipeDown={false}
                    renderFooter={(currentIndex) => (
                        <View style={{ height: 80, alignItems: 'center', justifyContent: 'center', backgroundColor: '#393e46', flexDirection: 'row', justifyContent: 'space-evenly', width: '100%'}}>
                            <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon color='#eeeeee' size={30} name='resize' onPress={() => navigation.navigate('Cropper', { folder: name, uri : files[currentIndex].uri, name : files[currentIndex].name })}/>
                                <Text style={{color: '#eeeeee'}}>Resize</Text>
                            </View>
                            <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon color='#eeeeee' size={30} name='image-filter-vintage' onPress={() => { navigation.navigate('FilterScreen', { folder: name, uri : files[currentIndex].uri, name : files[currentIndex].name }); setVisible(false); }}/>
                                <Text style={{color: '#eeeeee'}} onPress={() => { navigation.navigate('FilterScreen', { folder: name, uri : files[currentIndex].uri, name : files[currentIndex].name }); setVisible(false); }}>Filters</Text>
                            </View>
                            <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon color='#eeeeee' size={30} name='share-variant'/>
                                <Text style={{color: '#eeeeee'}}>Share</Text>
                            </View>
                            <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon color='#eeeeee' size={30} name='delete-outline' onPress={() => delPic(currentIndex)}/>
                                <Text style={{color: '#eeeeee'}} onPress={() => delPic(currentIndex)}>Delete</Text>
                            </View>
                        </View>
                    )}
                    saveToLocalByLongPress={false}
                />
            </Modal>
            {
                rearr &&
                <View style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 3, elevation: 5, alignItems: 'center', justifyContent: 'center'}}>
                    <View style={{ backgroundColor: 'white', width: '80%', height: '80%', borderRadius: 5, elevation: 5, paddingTop: 10, paddingBottom: 25 }}>
                        <Text style={{ textAlign: 'center', fontSize: 20}}>Rearrange</Text>
                        <Text style={{ textAlign: 'center', fontSize: 12, opacity: 0.6 }}>Hold & Drag</Text>
                        <DraggableFlatList 
                            data={order}
                            renderItem={renderItem}
                            keyExtractor={(item, index) => `draggable-item-${item.key}`}
                            onDragEnd={({ data }) => setOrder( data )}
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly'}}>
                            <TouchableOpacity style={{padding: 8, width: 63, alignItems: 'center'}} onPress={() => rearranging()}>
                                <Text style={{color: '#76ead7', fontSize: 15}}>Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{padding: 8, width: 63, alignItems: 'center'}} onPress={() => cancelRearr()}>
                                <Text style={{fontSize: 15}}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            }
        </View>
    )
}

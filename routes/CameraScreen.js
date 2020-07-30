import React, { useRef, useState, useEffect } from 'react'
import {View, Text} from 'react-native'
import { RNCamera } from 'react-native-camera'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import RNFS from 'react-native-fs'
import { useIsFocused } from '@react-navigation/native'

export default function CameraScreen({ navigation, route })  {
    const camera = useRef(null)
    const [flash, setFlash] = useState(RNCamera.Constants.FlashMode.off) // flash state
    const [pics, setPics] = useState(0) // number of images clicked
    const [uri, setUri] = useState([]) // uris of clicked images
    const [doc, setDoc] = useState() // path of the document folder
    const [name, setName] = useState() // name of the document folder
    const isFocused = useIsFocused()

    useEffect(() => {
        setUri([])
        setPics(0)
        setDoc()
        setName()
    }, [isFocused])

    const toggleFlash = () => {
        if(flash === RNCamera.Constants.FlashMode.off)
            setFlash(RNCamera.Constants.FlashMode.on)
        else
            setFlash(RNCamera.Constants.FlashMode.off)
    }

    const takePicture = async() => {
        if(camera) {
            const options = { quality: 0.5, base64: true }
            const data = await camera.current.takePictureAsync(options)
            .catch(e => console.log(e))
            var temp = [...uri]
            temp.push(data.uri) 
            setUri(temp) // add uri to array
            if(pics == 0 && route.params.new == true) { // if new document then create a folder
                var date = new Date()
                var tempName = 'New Doc '+ date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds()
                var suffix = date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, '0') + date.getDate().toString().padStart(2, '0') + date.getHours().toString().padStart(2, '0') + date.getMinutes().toString().padStart(2, '0') + date.getSeconds().toString().padStart(2, '0') + date.getMilliseconds().toString().padStart(3, '0')
                setName(tempName + suffix)
                var path = RNFS.ExternalDirectoryPath + '/' + tempName + suffix
                RNFS.mkdir(path)
                    .then(() => {
                        setDoc(path)
                    })
                    .catch(e => console.log(e))
            }
            setPics(pics + 1)
        }
    }

    // move images to document folder from temporary cache
    const createDoc = () => {
        if(route.params.new == true) {
            uri.forEach(async(val, i) => {
                var date = new Date()
                await RNFS.moveFile(val, doc + '/' + i + date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, '0') + date.getDate().toString().padStart(2, '0') + date.getHours().toString().padStart(2, '0') + date.getMinutes().toString().padStart(2, '0') + date.getSeconds().toString().padStart(2, '0') + date.getMilliseconds().toString().padStart(3, '0') + '.jpg')
                    .catch(e => console.log(e))
            })
            navigation.navigate('Document', { name: name, pop : true })
        } 
        else {
            uri.forEach(async(val, i) => {
                var date = new Date()
                await RNFS.moveFile(val, RNFS.ExternalDirectoryPath + '/' + route.params.name + '/' + (route.params.last + i) + date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, '0') + date.getDate().toString().padStart(2, '0') + date.getHours().toString().padStart(2, '0') + date.getMinutes().toString().padStart(2, '0') + date.getSeconds().toString().padStart(2, '0') + date.getMilliseconds().toString().padStart(3, '0') + '.jpg')
                    .catch(e => console.log(e))
            })
            navigation.navigate('Document', { name : route.params.name, pop: true })
        }
    }

    return(
        <View style={{ backgroundColor: '#393e46', flex: 1 }}>
            <RNCamera 
                ref={camera}
                type={RNCamera.Constants.Type.back}
                flashMode={flash}
                captureAudio={false}
                style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    alignItems: 'center'
                }}
            />
            <View
                style= {{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 35
                }}
            >
                {
                    flash === RNCamera.Constants.FlashMode.off ?
                        <TouchableOpacity onPress={() => toggleFlash()}>
                            <Icon name='flash-off' color='#eeeeee' size={30} />
                        </TouchableOpacity>
                    
                    :
                        <TouchableOpacity onPress={() => toggleFlash()}>
                            <Icon name='flash' color='#eeeeee' size={30} />
                        </TouchableOpacity>
                    
                }
                <TouchableOpacity onPress={() => takePicture()}>
                    <Icon name='checkbox-blank-circle' color='#eeeeee' size={70} />
                </TouchableOpacity>
                {
                    pics == 0 ? 
                    <TouchableOpacity>
                        <Icon name='arrow-right' color='#393e46' size={30} />
                    </TouchableOpacity>
                    :
                    <TouchableOpacity style={{flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}} onPress={() => createDoc()}>
                        <Icon name='arrow-right' color='#76ead7' size={30} /><Text style={{color: '#76ead7'}}>{pics} </Text>
                    </TouchableOpacity>
                }
            </View>
        </View>
    )
}

import React, { useEffect, useState } from 'react'
import { View, Text, Image, Dimensions } from 'react-native'
import OpenCV from '../NativeModules/OpenCV'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import RNFS from 'react-native-fs'
import Modal from 'react-native-modal'

export default function FilterScreen({ navigation, route }) {
    const [height, setHeight] = useState()
    const [width, setWidth] = useState()
    const [base64, setBase64] = useState([])
    const [loading, setLoading] = useState(true)
    const [current, setCurrent] = useState()

    useEffect(() => {
        Image.getSize(route.params.uri, (srcWidth, srcHeight) => {
            const maxHeight = Dimensions.get('window').height; 
            const maxWidth = Dimensions.get('window').width;
            const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
            setHeight(srcHeight * ratio)
            setWidth(srcWidth * ratio)
        }, error => {
            console.log('error:', error);
        });
        loadFilters()
    }, [])

    const loadFilters = () => {
        RNFS.readFile(route.params.uri, 'base64') 
            .then(img => {
                OpenCV.blackWhiteFilter(img, e => console.log(e), bw1 => {
                    OpenCV.grayScaleFilter(img, e => console.log(e), bw2 => {
                        var temp = [bw1, bw2]
                            setBase64(temp)
                            setCurrent(bw1)
                            setLoading(false)
                    })
                })
            })
            .catch(e => console.log(e))
    }

    const saveImg = async () => {
        await RNFS.unlink(route.params.uri)
        .catch(e => console.log(e))
        var newDigit = parseInt(route.params.name.charAt(route.params.name.length - 5)) == 9 ? 0 : parseInt(route.params.name.charAt(route.params.name.length - 5)) + 1
        var newName = route.params.name.substring(0, route.params.name.length - 5) + newDigit.toString() + route.params.name.substring(route.params.name.length - 4)
        await RNFS.writeFile(RNFS.ExternalDirectoryPath+'/'+route.params.folder+'/'+newName, current, 'base64')
            .catch(e => console.log(e))
        navigation.pop(1)
    }

    return (
        <View style={{flex : 1, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center'}}>
            <Modal
                isVisible={loading}
                useNativeDriver={true}
                style={{ marginHorizontal: 0, marginVertical: 0}}
                animationIn='slideInRight'
                animationOut='slideOutRight'
                backdropOpacity={0.5}
            >   
                <View style={{ alignItems: 'center', top: 100, position: 'absolute', width: '100%', top: 200 }}>
                    <View style={{backgroundColor: 'white', borderRadius: 5, width: '80%', padding: 20, alignItems: 'center', justifyContent: 'center'}}>
                        <Text style={{color: 'black'}}>Loading filters...</Text>
                    </View>
                </View>
            </Modal>
            {
                !loading &&
                <Image source={{ uri: `data:image/png;base64,${current}` }} style={{ width: width, height: height, marginBottom: 50 }}/>
            }
            <View style={{backgroundColor: '#393e46', position: 'absolute', bottom: 0, left: 0, right: 0, height: 110, padding: 15}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-evenly'}}>
                    <TouchableOpacity onPress={() => setCurrent(base64[0])}>
                        <Text style={{ color : '#eeeeee', fontSize: 15 }}>BW 1</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setCurrent(base64[1])}>
                        <Text style={{ color : '#eeeeee', fontSize: 15 }}>BW 2</Text>
                    </TouchableOpacity>
                </View>
                <View style={{flexDirection:'row', justifyContent: 'space-around', marginTop: 20}}>
                    <TouchableOpacity onPress={() => navigation.pop(1)}>
                        <Icon name='cancel' size={30} color='#eeeeee'/>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => saveImg()}>
                        <Icon name='check' size={30} color='#76ead7'/>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}
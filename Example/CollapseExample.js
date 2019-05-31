import React from 'react';
import {
    FlatList, View, Text, Dimensions,
    TouchableOpacity
} from 'react-native';
const deviceWidth = Dimensions.get("window").width;
import ScrollableTabView, { DefaultTabBar, } from 'rn-collapsing-tab-bar';
const containerHeight = Dimensions.get('window').height;

export default class Collapse extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tabOneHeight: containerHeight,
            tabTwoHeight: containerHeight
        }
    }

    measureTabOne = (event) => {
        this.setState({
            tabOneHeight: event.nativeEvent.layout.height
        })
    }
    measureTabTwo = (event) => {
        this.setState({
            tabTwoHeight: event.nativeEvent.layout.height
        })
    }
    collapsableComponent = () => {
        return (
            <View style={{ height: 200, backgroundColor: 'red', width: deviceWidth }}>
                <TouchableOpacity onPress={() => { alert('Alert') }}>
                    <Text>Alert</Text>
                </TouchableOpacity>
            </View>
        )
    }
    render() {
        const { tabOneHeight, tabTwoHeight } = this.state;
        return <ScrollableTabView
            collapsableBar={this.collapsableComponent()}
            initialPage={0}
            tabContentHeights={[tabOneHeight, tabTwoHeight]}
            scrollEnabled
            prerenderingSiblingsNumber={Infinity}
            renderTabBar={() => <DefaultTabBar inactiveTextColor="white" activeTextColor="white" backgroundColor="blue" />}
        >
            <View onLayout={(event) => this.measureTabOne(event)} tabLabel='Tab #1'>
                <View style={{ height: 2000, backgroundColor: "cyan" }}>
                    <TouchableOpacity onPress={() => { alert('Alert') }}>
                        <Text>Alert</Text>
                    </TouchableOpacity>
                    <Text >My</Text>
                    <FlatList
                        scrollEnabled={false}
                        data={[{ key: 'a' }, { key: 'b' }]}
                        renderItem={({ item }) => <View style={{ height: 400 }}>
                            <Text>{item.key}</Text>
                        </View>}
                    />
                </View>

            </View>
            <View onLayout={(event) => this.measureTabTwo(event)} tabLabel='Tab #2'>
                <View style={{ height: 4000, backgroundColor: "orange" }}>
                    <TouchableOpacity onPress={() => { alert('Alert') }}>
                        <Text>Alert</Text>
                    </TouchableOpacity>
                    <Text >Project</Text>
                </View>
            </View>
        </ScrollableTabView>;
    }
}
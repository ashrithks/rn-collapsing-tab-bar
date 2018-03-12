import React from 'react';
import {
    View,Text, Dimensions
} from 'react-native';
const deviceWidth = Dimensions.get("window").width;
import ScrollableTabView, { DefaultTabBar, } from 'rn-collapsing-tab-bar';

export default () => {
    const collapsableComponent = (
        <View style={{ height: 200, backgroundColor: 'red', width: deviceWidth }}></View>
    );
    return <ScrollableTabView
        scrollWithoutAnimation
        collapsableBar={collapsableComponent}
        initialPage={0}
        renderTabBar={() => <DefaultTabBar inactiveTextColor="white" activeTextColor="white" backgroundColor="blue" />}
    >
        <View style={{height:2000,backgroundColor:"cyan"}} tabLabel='Tab #1'>
            <Text >My</Text>
        </View>
        <View style={{height:2000,backgroundColor:"orange"}} tabLabel='Tab #2'>
            <Text >Project</Text>
        </View>
    </ScrollableTabView>;
}

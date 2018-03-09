import React from 'react';
import {
    Text, Dimensions
} from 'react-native';
const deviceHeight = Dimensions.get("window").height;
const deviceWidth = Dimensions.get("window").width;
import ScrollableTabView, { DefaultTabBar, } from 'rn-collapsing-tab-bar';

export default () => {
    const collapsableComponent = (
        <View style={{ height: 150, backgroundColor: 'red', width: deviceWidth }}></View>
    );
    return <ScrollableTabView
        scrollWithoutAnimation
        collapsableBar={collapsableComponent}
        style={{ marginTop: 20, }}
        initialPage={1}
        renderTabBar={() => <DefaultTabBar />}
    >
        <View style={{height:2000}} tabLabel='Tab #1'>
            <Text >My</Text>
        </View>
        <View style={{height:2000}} tabLabel='Tab #2'>
            <Text >Project</Text>
        </View>
    </ScrollableTabView>;
}

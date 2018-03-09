import React from 'react';
import {
  Text,
} from 'react-native';

import ScrollableTabView, {DefaultTabBar, } from 'rn-collapsing-tab-bar';

export default () => {
  return <ScrollableTabView
    style={{marginTop: 20, }}
    initialPage={1}
    renderTabBar={() => <DefaultTabBar />}
  >
    <Text tabLabel='Tab #1'>My</Text>
    <Text tabLabel='Tab #2'>favorite</Text>
    <Text tabLabel='Tab #3'>project</Text>
  </ScrollableTabView>;
}

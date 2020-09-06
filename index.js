const React = require('react');
const { Component } = React;
const { ViewPropTypes } = ReactNative = require('react-native');
const createReactClass = require('create-react-class');
const PropTypes = require('prop-types');
const {
	Dimensions,
	View,
	Animated,
	ScrollView,
	StyleSheet
} = ReactNative;
const TimerMixin = require('react-timer-mixin');

const SceneComponent = require('./SceneComponent');
const DefaultTabBar = require('./DefaultTabBar');
const ScrollableTabBar = require('./ScrollableTabBar');


const ScrollableTabView = createReactClass({
	mixins: [TimerMixin,],
	statics: {
		DefaultTabBar,
		ScrollableTabBar,
	},
	scrollOnMountCalled: false,

	propTypes: {
		tabBarPosition: PropTypes.oneOf(['top', 'bottom', 'overlayTop', 'overlayBottom',]),
		initialPage: PropTypes.number,
		page: PropTypes.number,
		onChangeTab: PropTypes.func,
		onScroll: PropTypes.func,
		renderTabBar: PropTypes.any,
		style: ViewPropTypes.style,
		contentProps: PropTypes.object,
		scrollWithoutAnimation: PropTypes.bool,
		locked: PropTypes.bool,
		prerenderingSiblingsNumber: PropTypes.number,
		collapsableBar: PropTypes.node,
		scrollEnabled: PropTypes.bool,
		showsVerticalScrollIndicator: PropTypes.bool,
	},

	getDefaultProps() {
		return {
			tabBarPosition: 'top',
			initialPage: 0,
			page: -1,
			onChangeTab: () => { },
			onScroll: () => { },
			contentProps: {},
			scrollWithoutAnimation: false,
			locked: false,
			prerenderingSiblingsNumber: 0,
		};
	},

	getInitialState() {
		const containerWidth = Dimensions.get('window').width;
		const containerHeight = Dimensions.get('window').height;
		let scrollValue;
		let scrollXIOS;
		scrollXIOS = new Animated.Value(this.props.initialPage * containerWidth);
		const containerWidthAnimatedValue = new Animated.Value(containerWidth);
		// Need to call __makeNative manually to avoid a native animated bug. See
		// https://github.com/facebook/react-native/pull/14435
		containerWidthAnimatedValue.__makeNative();
		scrollValue = Animated.divide(scrollXIOS, containerWidthAnimatedValue);

		const callListeners = this._polyfillAnimatedValue(scrollValue);
		scrollXIOS.addListener(
			({ value, }) => callListeners(value / this.state.containerWidth)
		);
		return {
			collapseHeight: 0,
			collapseScrollHeight: 0,
			contentHeight: this.props.tabContentHeights || [containerHeight],
			currentPage: this.props.initialPage,
			scrollValue,
			scrollXIOS,
			containerWidth,
			sceneKeys: this.newSceneKeys({ currentPage: this.props.initialPage, }),
		};
	},

	UNSAFE_componentWillReceiveProps(props) {
		if (props.children !== this.props.children) {
			this.updateSceneKeys({ page: this.state.currentPage, children: props.children, });
		}

		if (props.page >= 0 && props.page !== this.state.currentPage) {
			this.goToPage(props.page);
		}
		if (props.tabContentHeights !== this.state.tabContentHeights) {
			this.changeContentHeight(props.tabContentHeights)
		}
	},
	componentWillUnmount() {
		this.state.scrollXIOS.removeAllListeners();
	},

	goToPage(pageNumber) {
		const offset = pageNumber * this.state.containerWidth;
		if (this.scrollView) {
			this.scrollView.scrollTo({ x: offset, y: 0, animated: !this.props.scrollWithoutAnimation, });
		}
		const currentPage = this.state.currentPage;
		this.updateSceneKeys({
			page: pageNumber,
			callback: this._onChangeTab.bind(this, currentPage, pageNumber),
		});
	},

	measureCollapse(event) {
		this.setState({
			collapseHeight: event.nativeEvent.layout.height
		})
	},

	changeContentHeight(tabContentHeights) {
		this.setState({
			contentHeight: tabContentHeights
		})
	},

	isCloseToBottom({ layoutMeasurement, contentOffset, contentSize }) {
		const paddingToBottom = 20;
		return layoutMeasurement.height + contentOffset.y >=
			contentSize.height - paddingToBottom;
	},

	handleCollapseScroll(event) {
		this.setState({ collapseScrollHeight: event.nativeEvent.contentOffset.y })
		if (this.isCloseToBottom(event.nativeEvent)) {
			if (this.props.loadMore) {
				this.props.loadMore();
			}
		}
	},

	renderTabBar(props) {
		if (this.props.renderTabBar === false) {
			return null;
		} else if (this.props.renderTabBar) {
			return React.cloneElement(this.props.renderTabBar(props), props);
		} else {
			return <DefaultTabBar {...props} />;
		}
	},

	renderCollapsableBar() {
		if (!this.props.collapsableBar) {
			return null
		}
		return this.props.collapsableBar
	},

	updateSceneKeys({ page, children = this.props.children, callback = () => { }, }) {
		let newKeys = this.newSceneKeys({ previousKeys: this.state.sceneKeys, currentPage: page, children, });
		this.setState({ currentPage: page, sceneKeys: newKeys, }, callback);
	},

	newSceneKeys({ previousKeys = [], currentPage = 0, children = this.props.children, }) {
		let newKeys = [];
		this._children(children).forEach((child, idx) => {
			let key = this._makeSceneKey(child, idx);
			if (this._keyExists(previousKeys, key) ||
				this._shouldRenderSceneKey(idx, currentPage)) {
				newKeys.push(key);
			}
		});
		return newKeys;
	},

	// Animated.add and Animated.divide do not currently support listeners so
	// we have to polyfill it here since a lot of code depends on being able
	// to add a listener to `scrollValue`. See https://github.com/facebook/react-native/pull/12620.
	_polyfillAnimatedValue(animatedValue) {

		const listeners = new Set();
		const addListener = (listener) => {
			listeners.add(listener);
		};

		const removeListener = (listener) => {
			listeners.delete(listener);
		};

		const removeAllListeners = () => {
			listeners.clear();
		};

		animatedValue.addListener = addListener;
		animatedValue.removeListener = removeListener;
		animatedValue.removeAllListeners = removeAllListeners;

		return (value) => listeners.forEach(listener => listener({ value, }));
	},

	_shouldRenderSceneKey(idx, currentPageKey) {
		let numOfSibling = this.props.prerenderingSiblingsNumber;
		return (idx < (currentPageKey + numOfSibling + 1) &&
			idx > (currentPageKey - numOfSibling - 1));
	},

	_keyExists(sceneKeys, key) {
		return sceneKeys.find((sceneKey) => key === sceneKey);
	},

	_makeSceneKey(child, idx) {
		return child.props.tabLabel + '_' + idx;
	},

	renderScrollableContent() {
		const scenes = this._composeScenes();
		return <Animated.ScrollView
			horizontal
			pagingEnabled
			automaticallyAdjustContentInsets={false}
			contentOffset={{ x: this.props.initialPage * this.state.containerWidth, }}
			ref={(scrollView) => { this.scrollView = scrollView; }}
			onScroll={Animated.event(
				[{ nativeEvent: { contentOffset: { x: this.state.scrollXIOS, }, }, },],
				{ useNativeDriver: true, listener: this._onScroll, }
			)}
			onMomentumScrollBegin={this._onMomentumScrollBeginAndEnd}
			onMomentumScrollEnd={this._onMomentumScrollBeginAndEnd}
			scrollEventThrottle={16}
			scrollsToTop={false}
			showsHorizontalScrollIndicator={false}
			scrollEnabled={!this.props.locked}
			directionalLockEnabled
			alwaysBounceVertical={false}
			keyboardDismissMode="on-drag"
			{...this.props.contentProps}
		>
			{scenes}
		</Animated.ScrollView>;
	},

	_composeScenes() {
		return this._children().map((child, idx) => {
			let key = this._makeSceneKey(child, idx);
			return <SceneComponent
				key={child.key}
				shouldUpdated={this._shouldRenderSceneKey(idx, this.state.currentPage)}
				style={{ width: this.state.containerWidth, }}
			>
				{this._keyExists(this.state.sceneKeys, key) ? child : <View tabLabel={child.props.tabLabel} />}
			</SceneComponent>;
		});
	},

	_onMomentumScrollBeginAndEnd(e) {
		const offsetX = e.nativeEvent.contentOffset.x;
		const page = Math.round(offsetX / this.state.containerWidth);
		if (this.state.currentPage !== page) {
			this._updateSelectedPage(page);
		}
	},

	_updateSelectedPage(nextPage) {
		let localNextPage = nextPage;
		if (typeof localNextPage === 'object') {
			localNextPage = nextPage.nativeEvent.position;
		}

		const currentPage = this.state.currentPage;
		this.updateSceneKeys({
			page: localNextPage,
			callback: this._onChangeTab.bind(this, currentPage, localNextPage),
		});
	},

	_onChangeTab(prevPage, currentPage) {
		this.props.onChangeTab({
			i: currentPage,
			ref: this._children()[currentPage],
			from: prevPage,
		});
		let { scrollToTopAnimation } = this.props;
		if (this.props.collapsableBar) {
			let timeoutId = setTimeout(() => {
				try {
					if (this.state.collapseScrollHeight > this.state.collapseHeight + (this.props.tabBarHeight ? this.props.tabBarHeight : 50)) {
						this.collapseRef.scrollTo({ x: 0, y: this.state.collapseHeight, animated: scrollToTopAnimation });
					}
				} catch (error) {

				}
				clearTimeout(timeoutId);
			}, 0);
		}
	},

	_onScroll(e) {
		const offsetX = e.nativeEvent.contentOffset.x;
		if (offsetX === 0 && !this.scrollOnMountCalled) {
			this.scrollOnMountCalled = true;
		} else {
			this.props.onScroll(offsetX / this.state.containerWidth);
		}
	},

	_handleLayout(e) {
		const { width, } = e.nativeEvent.layout;

		if (!width || width <= 0 || Math.round(width) === Math.round(this.state.containerWidth)) {
			return;
		}
		const containerWidthAnimatedValue = new Animated.Value(width);
		// Need to call __makeNative manually to avoid a native animated bug. See
		// https://github.com/facebook/react-native/pull/14435
		containerWidthAnimatedValue.__makeNative();
		scrollValue = Animated.divide(this.state.scrollXIOS, containerWidthAnimatedValue);
		this.setState({ containerWidth: width, scrollValue, });
		this.requestAnimationFrame(() => {
			this.goToPage(this.state.currentPage);
		});
	},

	_children(children = this.props.children) {
		return React.Children.map(children, (child) => child);
	},

	render() {
		let overlayTabs = (this.props.tabBarPosition === 'overlayTop' || this.props.tabBarPosition === 'overlayBottom');
		let tabBarProps = {
			goToPage: this.goToPage,
			tabs: this._children().map((child) => child.props.tabLabel),
			activeTab: this.state.currentPage,
			scrollValue: this.state.scrollValue,
			containerWidth: this.state.containerWidth,
		};

		if (this.props.tabBarBackgroundColor) {
			tabBarProps.backgroundColor = this.props.tabBarBackgroundColor;
		}
		if (this.props.tabBarActiveTextColor) {
			tabBarProps.activeTextColor = this.props.tabBarActiveTextColor;
		}
		if (this.props.tabBarInactiveTextColor) {
			tabBarProps.inactiveTextColor = this.props.tabBarInactiveTextColor;
		}
		if (this.props.tabBarTextStyle) {
			tabBarProps.textStyle = this.props.tabBarTextStyle;
		}
		if (this.props.tabBarUnderlineStyle) {
			tabBarProps.underlineStyle = this.props.tabBarUnderlineStyle;
		}
		if (overlayTabs) {
			tabBarProps.style = {
				position: 'absolute',
				left: 0,
				right: 0,
				[this.props.tabBarPosition === 'overlayTop' ? 'top' : 'bottom']: 0,
			};
		}

		if (this.props.collapsableBar) {
			return <ScrollView
				ref={(comp) => { this.collapseRef = comp }}
				pointerEvents={'box-none'}
				onScroll={this.handleCollapseScroll}
				scrollEventThrottle={16}
				refreshControl={this.props.refreshControl ? this.props.refreshControl : null}
				style={[styles.container, this.props.style,]}
				contentContainerStyle={{ maxHeight: this.state.collapseHeight + (this.props.tabBarHeight ? this.props.tabBarHeight : 50) + (this.state.contentHeight[this.state.currentPage] || 0) }}
				onLayout={this._handleLayout}
				stickyHeaderIndices={[1]}
				scrollEnabled={this.props.scrollEnabled}
				showsVerticalScrollIndicator={this.props.showsVerticalScrollIndicator}
			>
				<View onLayout={(event) => this.measureCollapse(event)}>
					{this.renderCollapsableBar()}
				</View>
				{
					this.props.tabBarPosition === 'top' ?
						<View style={{ height: (this.props.tabBarHeight ? this.props.tabBarHeight : 50) }} pointerEvents={'box-none'}>
							{this.renderTabBar(tabBarProps)}
						</View>
						: null
				}
				<View>{this.renderScrollableContent()}</View>
			</ScrollView>
		} else {
			return <View
				style={[styles.container, this.props.style,]}
				onLayout={this._handleLayout}
				stickyHeaderIndices={[1]}
				scrollEnabled={this.props.scrollEnabled}
				showsVerticalScrollIndicator={this.props.showsVerticalScrollIndicator}
			>
				{this.renderCollapsableBar()}
				{this.props.tabBarPosition === 'top' && this.renderTabBar(tabBarProps)}
				{this.renderScrollableContent()}
				{(this.props.tabBarPosition === 'bottom' || overlayTabs) && this.renderTabBar(tabBarProps)}
			</View>
		}
	},
});

module.exports = ScrollableTabView;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollableContentAndroid: {
		flex: 1
	},
});

import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Image, Pressable, View } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { brandTheme } from '../../src/theme/brand';

const logo = require('@/assets/images/idea_dimension_logo.png');

function HeaderLogo() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 0, // 🔥 change this if you want slight inset
      }}
    >
      <Image
        source={logo}
        style={{
          height: 80,     // 🔥 controls visual size (adjust if needed)
          width: 200,     // keep reasonable ratio
        }}
        resizeMode="contain"
      />
    </View>
  );
}

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -1 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: brandTheme.colors.banner,
        tabBarInactiveTintColor: brandTheme.colors.accent,
        tabBarStyle: {
          backgroundColor: brandTheme.colors.dark,
          borderTopColor: brandTheme.colors.dark,
          height: 70,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontFamily: brandTheme.fonts.light,
          fontWeight: brandTheme.weights.light,
          fontSize: 11,
        },
        headerStyle: {
          backgroundColor: brandTheme.colors.banner,
          height: 132,
        },
        headerTintColor: brandTheme.colors.dark,

        // 🔥 IMPORTANT FIXES
        headerTitleContainerStyle: {
          left: 0,
          right: 0, // removes constraint from headerRight
          height: '100%',
        },

        headerShadowVisible: false,
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: () => <HeaderLogo />,
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="home" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="videos"
        options={{
          headerTitle: () => <HeaderLogo />,
          title: 'Videos',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="youtube-play" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="store"
        options={{
          headerTitle: () => <HeaderLogo />,
          title: 'Store',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="shopping-bag" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="events"
        options={{
          headerTitle: () => <HeaderLogo />,
          title: 'Events',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="calendar" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
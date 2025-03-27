import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { colors } from '../shared/theme';

export default function TabLayout() {
  return (
    <ProtectedRoute>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.activeTab,
          headerStyle: { backgroundColor: '#111111' },
          headerTintColor: '#fff',
          tabBarStyle: { backgroundColor: '#111111' },
        }}
      >
        {/* Profile Screen */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false ,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'person-circle' : 'person-circle-outline'} 
                color={color} 
                size={24} 
              />
            ),
          }}
        />
        
        {/* History Screen */}
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            headerShown: false ,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'time' : 'time-outline'} 
                color={color} 
                size={24} 
              />
            ),
          }}
        />
        
        {/* Home Screen */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Workout',
            headerShown: false ,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'home-sharp' : 'home-outline'} 
                color={color} 
                size={24} 
              />
            ),
          }}
        />
        
        {/* Exercises Screen */}
        <Tabs.Screen
          name="exercises"
          options={{
            title: 'Exercises',
            headerShown: false ,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'barbell' : 'barbell-outline'} 
                color={color} 
                size={24} 
              />
            ),
          }}
        />
        
        {/* Form Checker Screen */}
        <Tabs.Screen
          name="form-checker"
          options={{
            title: 'Form Checker',
            headerShown: false ,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons 
                name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} 
                color={color} 
                size={24} 
              />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
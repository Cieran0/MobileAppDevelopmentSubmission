import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../providers/AuthProvider';
import { router } from 'expo-router'; 

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  
  const { register } = useContext(AuthContext);

  const handleSignUp = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    try {
      
      await register(username, password);
      Alert.alert('Success', 'Registration successful! Redirecting to login...');
      
      
      router.push('/auth/login'); 
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'An error occurred during registration.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.googleButton} onPress={() => console.log('Sign Up with Google')}>
        <Text style={styles.buttonText}>Sign Up with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    marginBottom: 20,
  },
  input: {
    width: '80%',
    height: 40,
    backgroundColor: '#2a2a2a',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
    color: '#fff',
  },
  button: {
    width: '80%',
    height: 40,
    backgroundColor: '#00FF88',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#0A0A0A',
    fontSize: 16,
  },
  googleButton: {
    width: '80%',
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
});

export default Register;
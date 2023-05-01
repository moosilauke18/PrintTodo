import React, { Component } from 'react';
import { Button, TextInput, Alert, StyleSheet, Text, View, AsyncStorage, TouchableHighlight } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';


const AuthContext = React.createContext();


var STORAGE_KEY = 'id_token';


function	HomeScreen() {
  const { signOut } = React.useContext(AuthContext);
	const { state, addTodo } = React.useContext(AuthContext);
	const [ message, setMessage ] = React.useState('');

	return (
		<View style={styles.container}>
			<View style={styles.inputView}>
				<TextInput
					style={styles.inputText}
					placeholder="Message"
					value={message}
					onChangeText={setMessage}
				/>
			</View>
			<TouchableHighlight 
				onPress={() => {
					addTodo({ message }); 
					setMessage('');
				}} 
				style={styles.button}>
					<Text style={styles.buttonText}>Add Message</Text>
			</TouchableHighlight>
			<Button title="Sign out" onPress={signOut} />
		</View>
	);
}

function	SplashScreen() {
	return (
		<View>
			<Text>Loading...</Text>
		</View>
	);
}

function LoginScreen() {
	const [username, setUsername] = React.useState('');
	const [password, setPassword] = React.useState('');

	const { login } = React.useContext(AuthContext);
	return (
		<View style={styles.container}>
			<View style={styles.row}>
				<Text style={styles.title}>Print Todo</Text>
			</View>
			<View style={styles.inputView}>
				<TextInput
					style={styles.inputText}
					placeholder="Username"
					value={username}
					onChangeText={setUsername}
				/>
			</View>
			<View style={styles.inputView}>
				<TextInput
					style={styles.inputText}
					placeholder="Password"
					value={password}
					onChangeText={setPassword}
					secureTextEntry
				/>
			</View>
			<TouchableHighlight onPress={() => login({ username, password })} style={styles.button}>
					<Text style={styles.buttonText}>LOGIN</Text>
			</TouchableHighlight>
		</View>
	);
}

const Stack = createStackNavigator();


export default function App({ navigation }) {
	const [state, dispatch] = React.useReducer(
		(prevState, action) => {
			switch(action.type) {
				case 'RESTORE_TOKEN':
					return {
						...prevState,
						userToken: action.token,
						isLoading: false,
					};
				case 'SIGN_IN':
					try {
						AsyncStorage.setItem(STORAGE_KEY, action.token);
					} catch(e) {
					}
					return {
						...prevState,
						isSignout: false,
						userToken: action.token,
					};
				case 'SIGN_OUT':
					return {
						...prevState,
						isSignout: true,
						userToken: null,
					};
			}
		},
		{
			isLoading: true,
			isSignout: false,
			userToken: null,
		}
	);
			
	React.useEffect(() => {
		const bootstrapAsync = async () => {
			let userToken;

			try {
    		userToken = await AsyncStorage.getItem(STORAGE_KEY);
			} catch(e) {
				// Restoring token failed
			}

      // After restoring token, we may need to validate it in production apps

      // This will switch to the App screen or Auth screen and this loading
      // screen will be unmounted and thrown away.
      dispatch({ type: 'RESTORE_TOKEN', token: userToken });
    };
   bootstrapAsync();
  }, []);

	const authContext = React.useMemo(
		() => ({
			login: async data => {
			if (data) {
      fetch(process.env.BASE_URL + "/login", {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        })
      })
      .then((response) => response.json())
      .then((responseData) => {
        Alert.alert(
          "Login Success!"
        );
					// Failed to save
				dispatch({ type: 'SIGN_IN', token: responseData.token });
      })
      .done();
			}
		
			},
			signOut: async () => {
				AsyncStorage.removeItem(STORAGE_KEY);

				dispatch({ type: 'SIGN_OUT' });
			},
			addTodo: async (message) => {
				let userToken = await AsyncStorage.getItem(STORAGE_KEY) || null
				if (message) {
          fetch(process.env.BASE_URL + "/message", {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
					'Authorization': 'bearer ' + userToken
        },
        body: JSON.stringify({
          message: message.message,
        })
      })
      .then((response) => {
				if(response.ok) {
					Alert.alert("Success")
				} else {
          console.log(response);
					Alert.alert("Error");
				}
			}).done();
		}
			
		},
		}),
		[]
	);



    return (
			<AuthContext.Provider value={authContext}>
				<NavigationContainer>
					<Stack.Navigator>
						{state.isLoading ? (
							<Stack.Screen name="Splash" component={SplashScreen} />
						) : state.userToken == null ? (
							<Stack.Screen
								name="Login"
								component={LoginScreen}
								options={{
									title: "Sign in",
									animationTypeForReplace: state.isSignout ? 'pop' : 'push',
								}}
							/>
						) : (
							<Stack.Screen name="Home" component={HomeScreen} />
						)}
					</Stack.Navigator>
				</NavigationContainer>
			</AuthContext.Provider>
    );
}

const styles = StyleSheet.create({
   container: {
         justifyContent: 'center',
         marginTop: 50,
         padding: 20,
         backgroundColor: '#ffffff',
   alignItems: 'center',
    justifyContent: 'center',
       },
    title: {
          fontSize: 30,
          alignSelf: 'center',
          marginBottom: 30
        },
    buttonText: {
          fontSize: 18,
          color: 'white',
          alignSelf: 'center'
        },
		inputView:{
			width:"80%",
			backgroundColor:"#465881",
			borderRadius:25,
			height:50,
			marginBottom:20,
			justifyContent:"center",
			padding:20
		},
		inputText:{
			height:50,
			color:"white"
		},
    button: {
			backgroundColor: '#48BBEC',
			borderColor: '#48BBEC',
			width:"80%",
    	borderRadius:25,
    	height:50,
    	alignItems:"center",
    	justifyContent:"center",
    	marginTop:40,
    	marginBottom:10
		},
});

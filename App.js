import { WebView } from 'react-native-webview';
import { useEffect, useState, useRef } from 'react'
import { Platform, SafeAreaView, StyleSheet, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from "expo-constants";

export default function App() {

  const webref = useRef(null);
  const [user, setUser] = useState(null);
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => sendTokenToApi(token));
  });

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const userId = notification?.request?.content?.data?.user_id;
    dismissAllNotificationsAsync()

      return {
        shouldShowAlert: userId == user?.idUsuario,
        shouldPlaySound: userId == user?.idUsuario,
        shouldSetBadge: userId == user?.idUsuario,
      };
    },
  })

  setInterval(() => {
    webref.current.injectJavaScript(script());
  }, 100);

  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    })).data;

    return token;
  }

  const script = () => {
    return `
    try {
      document.getElementById('resumenDisponible').onclick = function() {
        window.ReactNativeWebView.postMessage('downloadResumen');
      };
      document.getElementById('detalleDisponible').onclick = function() {
        window.ReactNativeWebView.postMessage('downloadDetalle')
      };
      function getUser() {
        if (window.localStorage.getItem('data')) {
          window.ReactNativeWebView.postMessage(window.localStorage.getItem('data'))
        }
      }
      window.onload = getUser();
    } catch (e) {
      true;
    }
    true;
    `
  }

  const sendTokenToApi = (token) => {
    fetch('https://esmar.app/api/tokens', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
      }),
    });
  }

  const onMessage = async (event) => {
    const {
      nativeEvent: { data },
    } = event;
    if (data === 'downloadResumen') {
      await Linking.openURL("https://esmar.app/api/propietarios/resumenDisponible?idUsuarioRemoto=" + user.idUsuarioRemoto)
    } else if (data === 'downloadDetalle') {
      await Linking.openURL("https://esmar.app/api/propietarios/detalleDisponible?idUsuarioRemoto=" + user.idUsuarioRemoto)
    } else if (user === null) {
      setUser(JSON.parse(data))
    }
  };

  const runBeforeFirst = `
  window.isNativeApp = true;
  true; // note: this is required, or you'll sometimes get silent failures
`;

  return (
    <SafeAreaView style={styles.container}>
      <WebView source={{ uri: 'https://esmar.app' }}
        ref={webref}
        injectedJavaScriptBeforeContentLoaded={runBeforeFirst}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        allowingReadAccessToURL={true}
        mixedContentMode={'always'}
        onMessage={onMessage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})

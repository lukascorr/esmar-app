import { WebView } from 'react-native-webview';
import { useEffect } from 'react'
import { Platform, SafeAreaView, StyleSheet, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => sendTokenToApi(token));
  });

  setInterval(() => {
    this.webref.injectJavaScript(script());
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
    return `document.getElementById('resumenDisponible').onclick = function() {
      window.ReactNativeWebView.postMessage('downloadResumen')
      };
      document.getElementById('detalleDisponible').onclick = function() {
        window.ReactNativeWebView.postMessage('downloadDetalle')
        };        
    true;`
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
      await Linking.openURL("https://esmar.app/api/propietarios/resumenDisponible?idUsuarioRemoto=0001")
    }
    if (data === 'downloadDetalle') {
      await Linking.openURL("https://esmar.app/api/propietarios/detalleDisponible?idUsuarioRemoto=1")
    }
  };

  const runBeforeFirst = `
  window.isNativeApp = true;
  true; // note: this is required, or you'll sometimes get silent failures
`;

  return (
    <SafeAreaView style={styles.container}>
      <WebView source={{ uri: 'https://esmar.app' }}
        ref={(r) => (this.webref = r)}
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

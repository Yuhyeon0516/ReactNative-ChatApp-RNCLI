import {useCallback, useContext, useEffect, useState} from 'react';
import {Alert} from 'react-native';
import {RESULTS, requestNotifications} from 'react-native-permissions';
import messaging from '@react-native-firebase/messaging';
import AuthContext from '../components/AuthContext';

export default function usePushNotification() {
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const {user, addFcmToken} = useContext(AuthContext);

    useEffect(() => {
        messaging()
            .getToken()
            .then(token => {
                setFcmToken(token);
            });
    }, []);

    useEffect(() => {
        const unsubscribe = messaging().onTokenRefresh(token => {
            setFcmToken(token);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (user != null && fcmToken != null) {
            addFcmToken(fcmToken);
        }
    }, [addFcmToken, fcmToken, user]);

    const requestPermission = useCallback(async () => {
        const {status} = await requestNotifications([]);
        const enabled = status === RESULTS.GRANTED;

        if (!enabled) {
            Alert.alert('알림 권한을 허용해주세요.');
        }
    }, []);

    useEffect(() => {
        requestPermission();
    }, [requestPermission]);
}

import React, {useCallback, useContext, useMemo, useState} from 'react';
import Screen from '../components/Screen';
import validator from 'validator';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {Colors} from '../modules/Colors';
import AuthContext from '../components/AuthContext';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../types';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
    },
    input: {
        marginTop: 10,
        borderWidth: 1,
        padding: 10,
        borderRadius: 10,
        borderColor: Colors.GRAY,
        fontSize: 16,
    },
    errorText: {
        fontSize: 14,
        color: Colors.RED,
        marginTop: 4,
    },
    signupButton: {
        backgroundColor: Colors.BLACK,
        borderRadius: 10,
        alignItems: 'center',
        padding: 20,
    },
    signupButtonText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledSignupButton: {
        backgroundColor: Colors.GRAY,
    },
    signinTextButton: {
        marginTop: 5,
        alignItems: 'center',
        padding: 10,
    },
    signinButtonText: {
        fontSize: 16,
        color: Colors.BLACK,
    },
    signingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default function SignupScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmedPassword, setConfirmedPassword] = useState('');
    const [name, setName] = useState('');
    const {processingSignup, signup} = useContext(AuthContext);
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const emailErrorText = useMemo(() => {
        if (email.length === 0) {
            return '이메일을 입력해주세요.';
        }

        if (!validator.isEmail(email)) {
            return '올바를 이메일이 아닙니다.';
        }

        return null;
    }, [email]);

    const passwordErrorText = useMemo(() => {
        if (password.length === 0) {
            return '비밀번호를 입력해주세요.';
        }

        if (password.length < 6) {
            return '비밀번호는 6자리 이상이어야합니다.';
        }

        if (password !== confirmedPassword) {
            return '비밀번호를 확인해주세요.';
        }

        return null;
    }, [confirmedPassword, password]);

    const confirmedPasswordErrorText = useMemo(() => {
        if (confirmedPassword.length === 0) {
            return '비밀번호를 입력해주세요.';
        }

        if (confirmedPassword.length < 6) {
            return '비밀번호는 6자리 이상이어야합니다.';
        }

        if (password !== confirmedPassword) {
            return '비밀번호를 확인해주세요.';
        }

        return null;
    }, [confirmedPassword, password]);

    const nameErrorText = useMemo(() => {
        if (name.length === 0) {
            return '이름을 입력해주세요.';
        }

        return null;
    }, [name.length]);

    const onChangeEmailText = useCallback((text: string) => {
        setEmail(text);
    }, []);
    const onChangePasswordText = useCallback((text: string) => {
        setPassword(text);
    }, []);
    const onChangeConfirmedPasswordText = useCallback((text: string) => {
        setConfirmedPassword(text);
    }, []);
    const onChangeNameText = useCallback((text: string) => {
        setName(text);
    }, []);

    const singupButtonEnabled = useMemo(() => {
        return (
            !emailErrorText &&
            !passwordErrorText &&
            !confirmedPasswordErrorText &&
            !nameErrorText
        );
    }, [
        confirmedPasswordErrorText,
        emailErrorText,
        nameErrorText,
        passwordErrorText,
    ]);

    const signupButtonStyle = useMemo(() => {
        if (singupButtonEnabled) {
            return styles.signupButton;
        }

        return [styles.signupButton, styles.disabledSignupButton];
    }, [singupButtonEnabled]);

    const onPressSignupButton = useCallback(async () => {
        try {
            await signup(email, password, name);
        } catch (error: any) {
            Alert.alert(error.message);
        }
    }, [email, name, password, signup]);

    const onPressSigninButton = useCallback(() => {
        navigation.navigate('Signin');
    }, [navigation]);

    return (
        <Screen title="회원 가입">
            {processingSignup ? (
                <View style={styles.signingContainer}>
                    <ActivityIndicator />
                </View>
            ) : (
                <ScrollView style={styles.container}>
                    <View style={styles.section}>
                        <Text style={styles.title}>이메일</Text>
                        <TextInput
                            style={styles.input}
                            autoCapitalize="none"
                            value={email}
                            onChangeText={onChangeEmailText}
                            keyboardType="email-address"
                        />
                        {emailErrorText && (
                            <Text style={styles.errorText}>
                                {emailErrorText}
                            </Text>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.title}>비밀번호</Text>
                        <TextInput
                            secureTextEntry
                            style={styles.input}
                            value={password}
                            onChangeText={onChangePasswordText}
                        />
                        {passwordErrorText && (
                            <Text style={styles.errorText}>
                                {passwordErrorText}
                            </Text>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.title}>비밀번호 확인</Text>
                        <TextInput
                            secureTextEntry
                            style={styles.input}
                            value={confirmedPassword}
                            onChangeText={onChangeConfirmedPasswordText}
                        />
                        {confirmedPasswordErrorText && (
                            <Text style={styles.errorText}>
                                {confirmedPasswordErrorText}
                            </Text>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.title}>이름</Text>
                        <TextInput
                            autoCapitalize="none"
                            style={styles.input}
                            value={name}
                            onChangeText={onChangeNameText}
                        />
                        {nameErrorText && (
                            <Text style={styles.errorText}>
                                {nameErrorText}
                            </Text>
                        )}
                    </View>

                    <View>
                        <TouchableOpacity
                            style={signupButtonStyle}
                            disabled={!singupButtonEnabled}
                            onPress={onPressSignupButton}>
                            <Text style={styles.signupButtonText}>
                                회원 가입
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.signinTextButton}
                            onPress={onPressSigninButton}>
                            <Text style={styles.signinButtonText}>
                                이미 계정이 있으신가요?
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
        </Screen>
    );
}

import moment from 'moment';
import React, {useCallback} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '../modules/Colors';
import UserPhoto from '../components/UserPhoto';
import ImageMessage from './ImageMessage';

const styles = StyleSheet.create({
    container: {
        alignItems: 'flex-end',
        flex: 1,
    },
    nameText: {
        fontSize: 12,
        color: Colors.GRAY,
        marginBottom: 4,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    timeText: {
        fontSize: 12,
        color: Colors.GRAY,
    },
    bubble: {
        backgroundColor: Colors.BLACK,
        borderRadius: 12,
        padding: 12,
        flexShrink: 1,
    },
    messageText: {
        fontSize: 14,
        color: Colors.WHITE,
    },
    root: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userPhoto: {
        marginRight: 4,
    },
    photoNameText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },
    metaInfo: {
        marginRight: 4,
        alignItems: 'flex-end',
    },
    unreadCountText: {
        fontSize: 12,
        color: Colors.GRAY,
    },
});

const otherMessageStyles = {
    container: [styles.container, {alignItems: 'flex-start' as const}],
    bubble: [styles.bubble, {backgroundColor: Colors.LIGHT_GRAY}],
    messageText: [styles.messageText, {color: Colors.BLACK}],
    timeText: [styles.timeText],
    metaInfo: [
        styles.metaInfo,
        {marginLeft: 4, marginRight: 0, alignItems: 'flex-start' as const},
    ],
};

interface TextMessage {
    text: string;
}

interface ImageMessage {
    url: string;
}

interface MessageProps {
    name: string;
    message: TextMessage | ImageMessage;
    createdAt: Date;
    isOtherMessage: boolean;
    userImageUrl?: string;
    unreadCount?: number;
}

export default function Message({
    name,
    message,
    createdAt,
    isOtherMessage,
    userImageUrl,
    unreadCount = 0,
}: MessageProps) {
    const messageStyles = isOtherMessage ? otherMessageStyles : styles;
    const renderMessage = useCallback(() => {
        if ('text' in message) {
            return (
                <Text style={messageStyles.messageText}>{message.text}</Text>
            );
        }
        if ('url' in message) {
            return <ImageMessage url={message.url} />;
        }
    }, [message, messageStyles.messageText]);

    const renderMessageContainer = useCallback(() => {
        const components = [
            <View key={'metaInfo'} style={messageStyles.metaInfo}>
                {unreadCount > 0 && (
                    <Text style={styles.unreadCountText}>{unreadCount}</Text>
                )}
                <Text key={'timeText'} style={messageStyles.timeText}>
                    {moment(createdAt).format('HH:mm')}
                </Text>
            </View>,
            <View key={'message'} style={messageStyles.bubble}>
                {renderMessage()}
            </View>,
        ];
        return isOtherMessage ? components.reverse() : components;
    }, [createdAt, isOtherMessage, messageStyles, unreadCount, renderMessage]);

    return (
        <View style={styles.root}>
            {isOtherMessage && (
                <UserPhoto
                    style={styles.userPhoto}
                    imageUrl={userImageUrl}
                    name={name}
                    nameStyle={styles.photoNameText}
                    size={48}
                />
            )}
            <View style={messageStyles.container}>
                <Text style={styles.nameText}>{name}</Text>
                <View style={styles.messageContainer}>
                    {renderMessageContainer()}
                </View>
            </View>
        </View>
    );
}

import {onDocumentCreated} from 'firebase-functions/v2/firestore';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {getMessaging} from 'firebase-admin/messaging';

initializeApp();

export const onMessageCreated = onDocumentCreated(
    'chats/{chatId}/messages/{messageId}',
    async e => {
        // TODO: 새로운 메시지가 생기면 해당 채팅방에 있는 사용자에게 푸시 메시지를 보내주는 것
        // 1. 어디로 메시지를 보내야하는가
        const snapshot = e.data;
        if (!snapshot) return;

        const chatId = e.params.chatId;
        const chatSnapshot = await getFirestore()
            .collection('chats')
            .doc(chatId)
            .get();
        const chat = chatSnapshot.data();

        if (chat == null) return;

        const message = snapshot.data();
        const senderId = message.user.userId;

        const userIds = (chat.userIds as string[]).filter(
            userId => userId != senderId,
        );

        const usersSnapshot = await getFirestore()
            .collection('users')
            .where('userId', 'in', userIds)
            .get();

        const usersFcmTokens = usersSnapshot.docs.map(
            doc => doc.data().fcmTokens as string[],
        );

        const fcmTokens = usersFcmTokens.reduce((allTokens, tokens) => {
            return allTokens.concat(tokens);
        }, []);

        // 2. 메시지를 보내기
        // title -> '메시지가 도착했습니다.""
        // body -> 텍스트? 오디오? 이미지?

        const messageText = (() => {
            if (message.text != null) {
                return message.text as string;
            }

            if (message.imageUrl != null) {
                return '사진';
            }

            if (message.audioUrl != null) {
                return '음성메시지';
            }

            return '지원하지 않는 메시지';
        })();

        const senderName = message.user.name;

        await getMessaging().sendEachForMulticast({
            notification: {
                title: '메시지가 도착했습니다.',
                body: `${senderName}: ${messageText}`,
            },
            tokens: fcmTokens,
            data: {
                userIds: JSON.stringify(chat.userIds),
            },
        });

        console.log('done');
    },
);

import {useCallback, useEffect, useState} from 'react';
import {Chat, Collections, Message, User} from '../types';
import _ from 'lodash';
import firestore, {
    FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

function getChatKey(userIds: string[]) {
    return _.orderBy(userIds, userId => userId, 'asc');
}

function useChat(userIds: string[]) {
    const [chat, setChat] = useState<Chat | null>(null);
    const [loadingChat, setLoadingChat] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [sending, setSending] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [userToMessageReadAt, setUserToMessageReadAt] = useState<{
        [userId: string]: Date;
    }>({});

    async function loadUsers(uids: string[]) {
        const usersSnapshot = await firestore()
            .collection(Collections.USERS)
            .where('userId', 'in', uids)
            .get();
        const users = usersSnapshot.docs.map<User>(doc => doc.data() as User);
        return users;
    }

    const loadChat = useCallback(async () => {
        try {
            setLoadingChat(true);
            const chatSnapshot = await firestore()
                .collection(Collections.CHATS)
                .where('userIds', '==', getChatKey(userIds))
                .get();

            if (chatSnapshot.docs.length > 0) {
                const doc = chatSnapshot.docs[0];
                const chatUserIds = doc.data().userIds as string[];
                const users = await loadUsers(chatUserIds);
                setChat({
                    id: doc.id,
                    userIds: chatUserIds,
                    users: users,
                });

                return;
            }

            const users = await loadUsers(userIds);
            const data = {
                userIds: getChatKey(userIds),
                users,
            };

            const doc = await firestore()
                .collection(Collections.CHATS)
                .add(data);

            setChat({
                id: doc.id,
                ...data,
            });
        } finally {
            setLoadingChat(false);
        }
    }, [userIds]);

    useEffect(() => {
        loadChat();
    }, [loadChat]);

    const addNewMessages = useCallback((newMessages: Message[]) => {
        setMessages(prevMessages => {
            return _.uniqBy(newMessages.concat(prevMessages), m => m.id);
        });
    }, []);

    const sendMessage = useCallback(
        async (text: string, user: User) => {
            if (chat === null) throw new Error('Chat is not loaded');
            try {
                setSending(true);

                const doc = await firestore()
                    .collection(Collections.CHATS)
                    .doc(chat.id)
                    .collection(Collections.MESSAGES)
                    .add({
                        text: text,
                        user: user,
                        createdAt: firestore.FieldValue.serverTimestamp(),
                    });

                addNewMessages([
                    {
                        id: doc.id,
                        text: text,
                        imageUrl: null,
                        audioUrl: null,
                        user: user,
                        createdAt: new Date(),
                    },
                ]);
            } finally {
                setSending(false);
            }
        },
        [addNewMessages, chat],
    );

    useEffect(() => {
        if (chat?.id == null) return;

        setLoadingMessages(true);
        const unsubscribe = firestore()
            .collection(Collections.CHATS)
            .doc(chat.id)
            .collection(Collections.MESSAGES)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                if (snapshot.metadata.hasPendingWrites) return;

                const newMessages = snapshot
                    .docChanges()
                    .filter(({type}) => type === 'added')
                    .map(docChange => {
                        const {doc} = docChange;
                        const docData = doc.data();
                        const newMessage: Message = {
                            id: doc.id,
                            text: docData.text ?? null,
                            imageUrl: docData.imageUrl ?? null,
                            audioUrl: docData.audioUrl ?? null,
                            user: docData.user,
                            createdAt: docData.createdAt.toDate(),
                        };

                        return newMessage;
                    });

                addNewMessages(newMessages);
                setLoadingMessages(false);
            });

        return () => {
            unsubscribe();
        };
    }, [addNewMessages, chat?.id]);

    const updateMessageReadAt = useCallback(
        async (userId: string) => {
            if (chat == null) return null;

            firestore()
                .collection(Collections.CHATS)
                .doc(chat.id)
                .update({
                    [`userToMessageReadAt.${userId}`]:
                        firestore.FieldValue.serverTimestamp(),
                });
        },
        [chat],
    );

    useEffect(() => {
        if (chat == null) return;

        const unsubscribe = firestore()
            .collection(Collections.CHATS)
            .doc(chat.id)
            .onSnapshot(snapshot => {
                // local에서 변경되었을때
                if (snapshot.metadata.hasPendingWrites) return;

                const chatData = snapshot.data() ?? {};
                const userToMessageReadTimestamp =
                    chatData.userToMessageReadAt as {
                        [userId: string]: FirebaseFirestoreTypes.Timestamp;
                    };

                const userToMessageReadDate = _.mapValues(
                    userToMessageReadTimestamp,
                    updateMessageReadTimestamp =>
                        updateMessageReadTimestamp.toDate(),
                );

                setUserToMessageReadAt(userToMessageReadDate);
            });

        return () => {
            unsubscribe();
        };
    }, [chat]);

    const sendImageMessage = useCallback(
        async (filepath: string, user: User) => {
            try {
                setSending(true);
                if (chat == null) throw new Error('Undefined chat');
                if (user == null) throw new Error('Undefined user');

                const originalFilename = _.last(filepath.split('/'));

                if (originalFilename == null)
                    throw new Error('Undefined filename');

                const fileExt = originalFilename.split('.')[1];
                const fileName = `${Date.now()}.${fileExt}`;

                const storagePath = `chat/${chat.id}/${fileName}`;

                await storage().ref(storagePath).putFile(filepath);

                const url = await storage().ref(storagePath).getDownloadURL();

                const doc = await firestore()
                    .collection(Collections.CHATS)
                    .doc(chat.id)
                    .collection(Collections.MESSAGES)
                    .add({
                        imageUrl: url,
                        user: user,
                        createdAt: firestore.FieldValue.serverTimestamp(),
                    });

                addNewMessages([
                    {
                        id: doc.id,
                        text: null,
                        imageUrl: url,
                        audioUrl: null,
                        user: user,
                        createdAt: new Date(),
                    },
                ]);
            } finally {
                setSending(false);
            }
        },
        [addNewMessages, chat],
    );

    const sendAudioMessage = useCallback(
        async (filepath: string, user: User) => {
            try {
                setSending(true);
                if (chat == null) throw new Error('Undefined chat');
                if (user == null) throw new Error('Undefined user');

                const originalFilename = _.last(filepath.split('/'));

                if (originalFilename == null)
                    throw new Error('Undefined filename');

                const fileExt = originalFilename.split('.')[1];
                const fileName = `${Date.now()}.${fileExt}`;

                const storagePath = `chat/${chat.id}/${fileName}`;

                await storage().ref(storagePath).putFile(filepath);

                const url = await storage().ref(storagePath).getDownloadURL();

                const doc = await firestore()
                    .collection(Collections.CHATS)
                    .doc(chat.id)
                    .collection(Collections.MESSAGES)
                    .add({
                        audioUrl: url,
                        user: user,
                        createdAt: firestore.FieldValue.serverTimestamp(),
                    });

                addNewMessages([
                    {
                        id: doc.id,
                        text: null,
                        imageUrl: null,
                        audioUrl: url,
                        user: user,
                        createdAt: new Date(),
                    },
                ]);
            } finally {
                setSending(false);
            }
        },
        [addNewMessages, chat],
    );

    return {
        chat,
        loadingChat,
        messages,
        sending,
        sendMessage,
        loadingMessages,
        updateMessageReadAt,
        userToMessageReadAt,
        sendImageMessage,
        sendAudioMessage,
    };
}

export default useChat;

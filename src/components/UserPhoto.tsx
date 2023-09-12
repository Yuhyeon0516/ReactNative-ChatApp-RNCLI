import React, {useCallback, useMemo, useState} from 'react';
import {StyleProp, ViewStyle, TextStyle} from 'react-native';
import Profile from '../HomeScreen/Profile';
import ImageView from 'react-native-image-viewing';

interface UserPhotoProps {
    size?: number;
    style?: StyleProp<ViewStyle>;
    imageUrl?: string;
    name?: string;
    nameStyle?: StyleProp<TextStyle>;
}

export default function UserPhoto({
    size = 48,
    style,
    imageUrl,
    name,
    nameStyle,
}: UserPhotoProps) {
    const [viewerVisible, setViewerVisible] = useState(false);
    const images = useMemo(
        () => (imageUrl != null ? [{uri: imageUrl}] : []),
        [imageUrl],
    );

    const onPressImage = useCallback(() => {
        setViewerVisible(true);
    }, []);

    return (
        <>
            <Profile
                size={size}
                style={style}
                imageUrl={imageUrl}
                onPress={images.length > 0 ? onPressImage : undefined}
                text={name?.[0].toUpperCase()}
                textStyle={nameStyle}
            />
            <ImageView
                images={images}
                imageIndex={0}
                visible={viewerVisible}
                onRequestClose={() => setViewerVisible(false)}
            />
        </>
    );
}

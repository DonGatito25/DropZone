import React, { useRef, useState, useEffect } from "react"
import { Animated, PanResponder, Image, View, Text, StyleSheet } from "react-native"

const BlackCrate = React.memo(({ initialPosition, onRelease, textures, SQUARE_SIZE, isOverTarget }) => {
    const [value, setValue] = useState(5)
    const pan = useRef(new Animated.ValueXY(initialPosition)).current
    const timerRef = useRef(null)

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setValue((prevValue) => {
                if (prevValue > 0) {
                    return prevValue - 1
                } else {
                    clearInterval(timerRef.current)
                    return 0
                }
            })
        }, 400)

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [])

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({ x: pan.x._value, y: pan.y._value })
                pan.setValue({ x: 0, y: 0 })
            },
            onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
            onPanResponderRelease: () => {
                pan.flattenOffset()

                if (isOverTarget(pan)) {

                    if (timerRef.current) {
                        clearInterval(timerRef.current)
                    }

                    onRelease(value)
                }
            },
        }),
    ).current

    return (
        <Animated.View
            style={{
                position: "absolute",
                width: SQUARE_SIZE,
                height: SQUARE_SIZE,
                transform: [{ translateX: pan.x }, { translateY: pan.y }],
            }}
            {...panResponder.panHandlers}
        >
            <Image source={textures.black} style={{ width: SQUARE_SIZE + 5, height: SQUARE_SIZE + 5 }} />
            <View style={styles.blackValueContainer}>
                <Text style={styles.blackValueText}>{value}</Text>
            </View>
        </Animated.View>
    )
})

const styles = StyleSheet.create({
    blackValueContainer: {
        position: "absolute",
        top: 0,
        right: -5,
        backgroundColor: "white",
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    blackValueText: {
        color: "black",
        fontWeight: "bold",
        fontSize: 14,
    },
})

export default BlackCrate
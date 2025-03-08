import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';

const SQUARE_SIZE = 60;
const TARGET_SIZE = 100;
const { width, height } = Dimensions.get('window');

export default function App() {
  const [score, setScore] = useState(0);
  const [squares, setSquares] = useState([]);
  const animations = useRef([]);

  const spawnNewSquares = (numSquares = 3) => {
    animations.current.forEach(anim => anim.stop());
    animations.current = [];

    let redCount = 0;
    const newSquares = [];
    for (let i = 0; i < numSquares; i++) {
      const side = Math.floor(Math.random() * 4);
      let startX = 0, startY = 0;

      switch (side) {
        case 0:
          startX = Math.random() * (width - SQUARE_SIZE);
          startY = 0;
          break;
        case 1:
          startX = width - SQUARE_SIZE;
          startY = Math.random() * (height - SQUARE_SIZE);
          break;
        case 2:
          startX = Math.random() * (width - SQUARE_SIZE);
          startY = height - SQUARE_SIZE;
          break;
        case 3:
          startX = 0;
          startY = Math.random() * (height - SQUARE_SIZE);
          break;
      }

      const colors = ['blue', 'green', 'purple', 'orange'];
      let newColor = colors[Math.floor(Math.random() * colors.length)];

      if (redCount < 2 && Math.random() < 0.5) {
        newColor = 'red';
        redCount++;
      }

      const pan = new Animated.ValueXY({ x: startX, y: startY });
      newSquares.push({ pan, color: newColor });
    }

    setSquares(newSquares);
  };

  useEffect(() => {
    spawnNewSquares();
  }, []);

  useEffect(() => {
    squares.forEach((square, index) => {
      if (square.color === 'red') {
        moveRedSquareTowardsTarget(index);
      }
      if (square.color === 'purple') {
        startPurpleTeleportation(index);
      }
      if (square.color === 'orange') {
        shrinkOrangeSquare(index);
      }
    });
  }, [squares]);

  const startPurpleTeleportation = (index) => {
    const teleport = () => {
      if (squares[index]) {
        const pan = squares[index].pan;
        const newX = Math.random() * (width - SQUARE_SIZE);
        const newY = Math.random() * (height - SQUARE_SIZE);

        pan.stopAnimation(); // Stop dragging
        pan.setValue({
          x: Math.max(0, Math.min(newX, width - SQUARE_SIZE)),
          y: Math.max(0, Math.min(newY, height - SQUARE_SIZE))
        });
        setTimeout(teleport, 1000);
      }
    };
    teleport();
  };

  const isOverTarget = (pan) => {
    const squareX = pan.x.__getValue();
    const squareY = pan.y.__getValue();
    const targetX = width / 2 - TARGET_SIZE / 2;
    const targetY = height / 2 - TARGET_SIZE / 2;

    return (
      squareX < targetX + TARGET_SIZE &&
      squareX + SQUARE_SIZE > targetX &&
      squareY < targetY + TARGET_SIZE &&
      squareY + SQUARE_SIZE > targetY
    );
  };

  const moveRedSquareTowardsTarget = (index) => {
    const square = squares[index];
    const pan = square.pan;

    const targetX = width / 2 - TARGET_SIZE / 2;
    const targetY = height / 2 - TARGET_SIZE / 2;

    const animation = Animated.timing(pan, {
      toValue: { x: targetX, y: targetY },
      duration: 10000,
      useNativeDriver: false
    });

    animations.current.push(animation);

    animation.start(() => {
      setTimeout(() => {
        if (isOverTarget(pan)) {
          setScore(prev => prev - 1);
          resetGame();
        }
      }, 50);
    });
  };

  const shrinkOrangeSquare = (index: number) => {
    const square = squares[index];
    if (!square) return;

    const size = square.size;
    const shrinkAnimation = Animated.timing(size, {
      toValue: 0,
      duration: 5000,
      useNativeDriver: false
    });

    shrinkAnimation.start(() => {
      setSquares(prevSquares => prevSquares.filter((_, i) => i !== index));
    });
  };

  const panResponder = (index) => {
    if (squares[index].color === 'red') {
      return { panHandlers: {} };
    }

    const pan = squares[index].pan;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x.__getValue(), y: pan.y.__getValue() });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        if (isOverTarget(pan)) {
          setScore(prev => prev + 1);
          spawnNewSquares();
        }
      }
    });
  };

  const resetGame = () => {
    animations.current.forEach(anim => anim.stop());
    animations.current = [];
    setSquares([]);
    spawnNewSquares();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gameContainer}>
        <Text style={styles.scoreText}>Score: {score}</Text>
        <View style={styles.targetSquare} />
        {squares.map((square, index) => (
          <Animated.View
            key={index}
            style={{
              ...styles.draggableSquare,
              backgroundColor: square.color,
              transform: [{ translateX: square.pan.x }, { translateY: square.pan.y }]
            }}
            {...panResponder(index).panHandlers}
          />
        ))}
        <Text style={styles.instructions}>Drag the colored squares to the gray target</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  gameContainer: {
    flex: 1,
    position: 'relative',
  },
  targetSquare: {
    position: 'absolute',
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    backgroundColor: 'gray',
    left: width / 2 - TARGET_SIZE / 2,
    top: height / 2 - TARGET_SIZE / 2,
  },
  draggableSquare: {
    position: 'absolute',
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
  },
  scoreText: {
    position: 'absolute',
    top: 40,
    left: 20,
    fontSize: 24,
    fontWeight: 'bold',
  },
  instructions: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

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
  const [flavor, setFlavor] = useState('None');
  const [squares, setSquares] = useState([]);
  const animations = useRef([]);

  const spawnNewSquares = (numSquares = Math.floor(Math.random() * 5) + 1) => {
    if (numSquares === 1) {
      animations.current.forEach(anim => anim.stop());
      animations.current = [];

      let availableColors = ['blue', 'green', 'orange', 'purple'];


      if (flavor === 'Orange') {
        availableColors = availableColors.filter(color => color !== 'orange');
      } else if (flavor === 'Blueberry') {
        availableColors = availableColors.filter(color => color !== 'blue');
      }

      const startX = Math.random() * (width - SQUARE_SIZE);
      const startY = Math.random() * (height - SQUARE_SIZE);
      const newColor = availableColors[Math.floor(Math.random() * availableColors.length)];

      const pan = new Animated.ValueXY({ x: startX, y: startY });
      setSquares([{ pan, color: newColor }]);
      return;
    }

    animations.current.forEach(anim => anim.stop());
    animations.current = [];

    let redCount = 0;
    let hasPurple = false;
    const newSquares = [];
    const colors = ['blue', 'green', 'orange', 'purple', 'red'];
    const minSpacing = SQUARE_SIZE * 1.5;

    while (newSquares.length < numSquares) {
      const side = Math.floor(Math.random() * 4);
      let startX = 0, startY = 0;
      let tooClose;

      do {
        tooClose = false;
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

        for (const square of newSquares) {
          if (Math.abs(square.pan.x._value - startX) < minSpacing && Math.abs(square.pan.y._value - startY) < minSpacing) {
            tooClose = true;
            break;
          }
        }
      } while (tooClose);

      let availableColors = [...colors];
      if (redCount >= 3) {
        availableColors = availableColors.filter(color => color !== 'red');
      }

      let newColor = availableColors[Math.floor(Math.random() * availableColors.length)];

      const colorCounts = newSquares.reduce((acc, square) => {
        acc[square.color] = (acc[square.color] || 0) + 1;
        return acc;
      }, {});

      if (colorCounts[newColor] === numSquares - 1) {
        availableColors = availableColors.filter(color => color !== newColor);
        if (availableColors.length > 0) {
          newColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        }
      }

      if (newColor === 'red') redCount++;
      if (newColor === 'purple') hasPurple = true;

      const pan = new Animated.ValueXY({ x: startX, y: startY });
      newSquares.push({ pan, color: newColor });

      const uniqueColors = new Set(newSquares.map(sq => sq.color));
      if (newSquares.length >= 4 && uniqueColors.size === 2 && uniqueColors.has('blue') && uniqueColors.has('orange')) {
        newSquares.pop();
      }
    }
    setSquares(newSquares);
  };


  useEffect(() => {
    spawnNewSquares();
  }, []);

  useEffect(() => {
    squares.forEach((square, index) => {
      if (square.color === 'red') {
        moveRed(index);
      }
      if (square.color === 'purple') {
        telPurp(index);
      }
    });
  }, [squares]);

  const telPurp = (index) => {
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
        setTimeout(teleport, 700);
      }
    };
    teleport();
  };

  const isOverTarget = (pan) => {
    const squareX = pan.x.__getValue();
    const squareY = pan.y.__getValue();
    const targetX = width / 2 - TARGET_SIZE / 2;
    const targetY = height / 2 - TARGET_SIZE / 2;

    if (
      squareX < targetX + TARGET_SIZE &&
      squareX + SQUARE_SIZE > targetX &&
      squareY < targetY + TARGET_SIZE &&
      squareY + SQUARE_SIZE > targetY
    ) {
      return true;
    }
    return false;
  };

  const moveRed = (index) => {
    const square = squares[index];
    const pan = square.pan;

    const targetX = width / 2 - TARGET_SIZE / 2;
    const targetY = height / 2 - TARGET_SIZE / 2;

    const animation = Animated.timing(pan, {
      toValue: { x: targetX, y: targetY },
      duration: 3000,
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
        if (isOverTarget(pan) && squares[index].color === 'orange') {
          setFlavor('Orange');
          setScore(prev => (flavor === 'Orange' ? prev - 2 : prev + 1 - 1));
        }
        if (isOverTarget(pan) && squares[index].color === 'blue') {
          setFlavor('Blueberry');
          setScore(prev => (flavor === 'Blueberry' ? prev - 2 : prev + 1 - 1));
        }
        if (isOverTarget(pan) && squares[index].color === 'green') {
          setScore(prev => prev + 2 - 1);
          spawnNewSquares();
        }
        if (isOverTarget(pan) && squares[index].color === 'purple') {
          setScore(prev => prev + 3 - 1);
          spawnNewSquares();
        }
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
        <View style={styles.textOverlay} pointerEvents="none">
          <Text style={styles.scoreText}>Score: {score}</Text>
          <Text style={styles.flavorText}>Flavor: {flavor}</Text>
        </View>

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
  flavorText: {
    position: 'absolute',
    top: 70,
    left: 20,
    fontSize: 24,
    fontWeight: 'bold'
  },
  instructions: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  textOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 10,
    alignItems: 'center'
  }
});

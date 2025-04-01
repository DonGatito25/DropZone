import { useState, useEffect, useRef } from "react"
import {
  SafeAreaView,
  Platform,
  Text,
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Image
} from "react-native"
//
const SQUARE_SIZE = 60
const TARGET_SIZE = 100
const { width, height } = Dimensions.get("window")
//
const textures = {
  blue: require("./assets/colors/blue.png"),
  green: require("./assets/colors/green.png"),
  orange: require("./assets/colors/orange.png"),
  purple: require("./assets/colors/purple.png"),
  red: require("./assets/colors/red.png"),
  white: require("./assets/colors/white.png"),
  pink: require("./assets/colors/pink.png"),
  target: require("./assets/target.png"),
}
//
export default function App() {
  const [score, setScore] = useState(0)
  const [danger, setDanger] = useState("None")
  const [squares, setSquares] = useState([])
  const animations = useRef([])
  //
  const spawnSquare = (color) => {
    if (!["blue", "green", "orange", "purple", "red", "white", "pink"].includes(color.toLowerCase())) {
      console.log("Invalid color. Use: blue, green, orange, purple, red, white, or pink")
      return
    }
    //
    const PADDING = 10
    const safeWidth = width - SQUARE_SIZE - PADDING
    const safeHeight = height - SQUARE_SIZE - PADDING
    //
    const startX = PADDING + Math.random() * (safeWidth - PADDING)
    const startY = PADDING + Math.random() * (safeHeight - PADDING)
    //
    const pan = new Animated.ValueXY({ x: startX, y: startY })
    //
    setSquares(prev => [...prev, { pan, color }])
    setTimeout(() => {
      if (color === "red") {
        moveRed(squares.length)
      }
      if (color === "purple") {
        telPurp(squares.length)
      }
    }, 100)
    //
    return "Square spawned with color: " + color.toUpperCase()
  }
  //
  useEffect(() => {
    if (Platform.OS === 'web') {
      window.spawnSquare = spawnSquare
    } else {
      global.spawnSquare = spawnSquare
    }
    //
    return () => {
      if (Platform.OS === 'web') {
        delete window.spawnSquare
      } else {
        delete global.spawnSquare
      }
    }
  }, [squares.length])
  //
  const spawnNewSquares = (
    numSquares = Math.floor(Math.random() * 5) + 1
  ) => {
    setSquares([])
    setTimeout(() => {
      const baseColors = ["blue", "green", "orange", "purple", "white"]
      const colors = score > 40 ? [...baseColors, "red", "pink"] : score > 10 ? [...baseColors, "red"] : baseColors
      //
      const newSquares = []
      //
      const PADDING = 10
      const safeWidth = width - SQUARE_SIZE - PADDING
      const safeHeight = height - SQUARE_SIZE - PADDING
      //
      if (numSquares === 1) {
        let availableColors = ["blue", "green", "orange", "purple", "white"]
        availableColors = availableColors.filter((color) => color.toLowerCase() !== danger.toLowerCase())
        //
        if (availableColors.length === 0) {
          availableColors = ["white"]
        }
        //
        const newColor = availableColors[Math.floor(Math.random() * availableColors.length)]
        //
        animations.current.forEach((anim) => anim.stop())
        animations.current = []
        //
        const startX = PADDING + Math.random() * (safeWidth - PADDING)
        const startY = PADDING + Math.random() * (safeHeight - PADDING)
        //
        const pan = new Animated.ValueXY({ x: startX, y: startY })
        setSquares([{ pan, color: newColor }])
        return
      }
      //
      animations.current.forEach((anim) => anim.stop())
      animations.current = []
      //
      let redCount = 0
      let greenCount = 0
      let pinkCount = 0
      const minSpacing = SQUARE_SIZE * 1.5
      //
      while (newSquares.length < numSquares) {
        const side = Math.floor(Math.random() * 4)
        let startX = 0, startY = 0
        let tooClose
        //
        do {
          tooClose = false
          switch (side) {
            case 0: // top
              startX = PADDING + Math.random() * (safeWidth - PADDING)
              startY = PADDING
              break
            case 1: // right
              startX = safeWidth
              startY = PADDING + Math.random() * (safeHeight - PADDING)
              break
            case 2: // bottom
              startX = PADDING + Math.random() * (safeWidth - PADDING)
              startY = safeHeight
              break
            case 3: // left
              startX = PADDING
              startY = PADDING + Math.random() * (safeHeight - PADDING)
              break
          }
          //
          for (const square of newSquares) {
            if (
              Math.abs(square.pan.x._value - startX) < minSpacing &&
              Math.abs(square.pan.y._value - startY) < minSpacing
            ) {
              tooClose = true
              break
            }
          }
        } while (tooClose)
        //
        let availableColors = [...colors]
        //
        if (redCount >= 3) {
          availableColors = availableColors.filter((color) => color !== "red")
        }
        if (greenCount >= 1) {
          availableColors = availableColors.filter((color) => color !== "green")
        }
        if (pinkCount >= 1) {
          availableColors = availableColors.filter((color) => color !== "pink")
        }
        //
        if (danger !== "None") {
          if (numSquares === 2 && redCount >= 1) {
            availableColors = availableColors.filter((color) => color.toLowerCase() !== danger.toLowerCase() && color !== 'pink')
          }
          else if (numSquares === 3 && redCount >= 2) {
            availableColors = availableColors.filter((color) => color.toLowerCase() !== danger.toLowerCase() && color !== 'pink')
          }
          else if (numSquares === 4 && redCount >= 3) {
            availableColors = availableColors.filter((color) => color.toLowerCase() !== danger.toLowerCase() && color !== 'pink')
          }
        }
        //
        if (availableColors.length === 0) {
          availableColors = ["white"]
        }
        //
        let newColor = availableColors[Math.floor(Math.random() * availableColors.length)]
        //
        const colorCounts = newSquares.reduce((acc, square) => {
          acc[square.color] = (acc[square.color] || 0) + 1
          return acc
        }, {})
        //
        if (colorCounts[newColor] === numSquares - 1) {
          availableColors = availableColors.filter((color) => color !== newColor)
          if (availableColors.length > 0) {
            newColor = availableColors[Math.floor(Math.random() * availableColors.length)]
          }
        }
        //
        if (newColor === "red") redCount++
        if (newColor === "green") greenCount++
        if (newColor === "pink") pinkCount++
        //
        const pan = new Animated.ValueXY({ x: startX, y: startY })
        newSquares.push({ pan, color: newColor })
        //
        const uniqueColors = new Set(newSquares.map((sq) => sq.color))
        if (
          newSquares.length >= 4 &&
          uniqueColors.size === 2 &&
          uniqueColors.has("blue") &&
          uniqueColors.has("orange")
        ) {
          newSquares.pop()
        }
      }
      setSquares(newSquares)
    }, 500)
  }
  //
  useEffect(() => {
    spawnNewSquares()
  }, [])
  //
  useEffect(() => {
    squares.forEach((square, index) => {
      if (square.color === "red") {
        moveRed(index)
      }
      if (square.color === "purple") {
        telPurp(index)
      }
    })
  }, [squares])
  //
  const telPurp = (index) => {
    const teleport = () => {
      if (squares[index]) {
        const pan = squares[index].pan
        const newX = Math.random() * (width - SQUARE_SIZE)
        const newY = Math.random() * (height - SQUARE_SIZE)
        //
        pan.stopAnimation()
        pan.setValue({
          x: Math.max(0, Math.min(newX, width - SQUARE_SIZE)),
          y: Math.max(0, Math.min(newY, height - SQUARE_SIZE)),
        })
        setTimeout(teleport, 750)
      }
    }
    teleport()
  }
  //
  const moveRed = (index) => {
    const square = squares[index]
    const pan = square.pan
    //
    const targetX = width / 2 - TARGET_SIZE / 2
    const targetY = height / 2 - TARGET_SIZE / 2
    //
    const animation = Animated.timing(pan, {
      toValue: { x: targetX + 18, y: targetY + 18 },
      duration: 3000,
      useNativeDriver: false,
    })
    //
    animations.current.push(animation)
    //
    animation.start(() => {
      setTimeout(() => {
        if (isOverTarget(pan)) {
          setScore((prev) => prev - 1)
          resetGame()
        }
      }, 50)
    })
  }
  //
  const isOverTarget = (pan) => {
    const squareX = pan.x.__getValue()
    const squareY = pan.y.__getValue()
    const targetX = width / 2 - TARGET_SIZE / 2
    const targetY = height / 2 - TARGET_SIZE / 2
    //
    const isOver =
      squareX < targetX + TARGET_SIZE &&
      squareX + SQUARE_SIZE > targetX &&
      squareY < targetY + TARGET_SIZE &&
      squareY + SQUARE_SIZE > targetY
    //
    if (isOver) {
      animations.current.forEach((anim) => anim.stop())
      animations.current = []
    }
    return isOver
  }
  //
  const panResponder = (index) => {
    if (squares[index].color === "red") {
      return { panHandlers: {} }
    }
    //
    const pan = squares[index].pan
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x.__getValue(), y: pan.y.__getValue() })
        pan.setValue({ x: 0, y: 0 })
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset()
        //
        if (isOverTarget(pan) && squares[index].color === "pink") {
          setScore(0)
          spawnNewSquares()
          return
        }
        if (isOverTarget(pan) && squares[index].color === "orange") {
          setDanger("Orange")
          setScore((prev) => (danger === "Orange" ? prev - 2 : prev + 1 - 1))
        }
        if (isOverTarget(pan) && squares[index].color === "blue") {
          setDanger("Blue")
          setScore((prev) => (danger === "Blue" ? prev - 2 : prev + 1 - 1))
        }
        if (isOverTarget(pan) && squares[index].color === "green") {
          setScore((prev) => prev + 2 - 1)
          spawnNewSquares()
        }
        if (isOverTarget(pan) && squares[index].color === "purple") {
          setScore((prev) => prev + 3 - 1)
          spawnNewSquares()
        }
        if (isOverTarget(pan)) {
          setScore((prev) => prev + 1)
          spawnNewSquares()
        }
      },
    })
  }
  //
  const resetGame = () => {
    animations.current.forEach((anim) => anim.stop())
    animations.current = []
    setSquares([])
    spawnNewSquares()
  }
  //
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gameContainer}>
        <View style={styles.textOverlay} pointerEvents="none">
          <Text style={styles.scoreText}>Score: {score}</Text>
          <Text style={styles.dangerText}>Danger: {danger}</Text>
        </View>
        <Image source={textures.target} style={styles.targetSquare} />
        {squares.map((square, index) => (
          <Animated.View
            key={index}
            style={{
              ...styles.draggableSquare,
              transform: [{ translateX: square.pan.x }, { translateY: square.pan.y }],
            }}
            {...panResponder(index).panHandlers}
          >
            <Image source={textures[square.color]} style={{ width: SQUARE_SIZE + 5, height: SQUARE_SIZE + 5 }} />
          </Animated.View>
        ))}
      </View>
    </SafeAreaView>
  )
}
//
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2c8bc9",
  },
  gameContainer: {
    flex: 1,
    position: "relative",
  },
  targetSquare: {
    position: "absolute",
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    left: width / 2 - TARGET_SIZE / 2,
    top: height / 2 - TARGET_SIZE / 2,
  },
  draggableSquare: {
    position: "absolute",
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
  },
  scoreText: {
    position: "absolute",
    top: 20,
    left: 20,
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textStroke: "2px",
  },
  dangerText: {
    position: "absolute",
    top: 50,
    left: 20,
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  instructions: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    fontSize: 18,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  textOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    zIndex: 10,
    alignItems: "center",
  },
})
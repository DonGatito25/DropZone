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
  black: require("./assets/colors/black.png"),
  blue: require("./assets/colors/blue.png"),
  brown: require("./assets/colors/brown.png"),
  // cyan: require("./assets/colors/cyan.png"),
  // gray: require("./assets/colors/gray.png"),
  green: require("./assets/colors/green.png"),
  orange: require("./assets/colors/orange.png"),
  pink: require("./assets/colors/pink.png"),
  purple: require("./assets/colors/purple.png"),
  red: require("./assets/colors/red.png"),
  white: require("./assets/colors/white.png"),
  yellow: require("./assets/colors/yellow.png"),
  target: require("./assets/target.png"),
}
//
export default function App() {
  const [score, setScore] = useState(0)
  const [danger, setDanger] = useState("None")
  const [squares, setSquares] = useState([])
  const [round, setRound] = useState(1)
  const [purplePaused, setPurplePaused] = useState(false)
  const animations = useRef([])
  const blackValueTimers = useRef({})
  const blackValues = useRef({})
  //
  const spawnSquare = (color) => {
    if (!["blue", "green", "orange", "purple", "red", "brown", "pink", "white", "black", "yellow"].includes(color.toLowerCase())) {
      console.log("Invalid color. Use: blue, green, orange, purple, red, brown, pink, white, black, or yellow")
      return
    }

    // Check for conflicts between black and purple
    if (color === "black" && squares.some(square => square.color === "purple")) {
      console.log("Cannot spawn black when purple is present")
      return
    }

    if (color === "purple" && squares.some(square => square.color === "black")) {
      console.log("Cannot spawn purple when black is present")
      return
    }

    // Check if it's a valid round for yellow
    if (color === "yellow" && round % 12 !== 0) {
      console.log("Yellow can only spawn on rounds divisible by 12")
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
    const newSquareIndex = squares.length
    setSquares(prev => [...prev, { pan, color }])

    setTimeout(() => {
      if (color === "red") {
        moveRed(newSquareIndex)
      }
      if (color === "purple" && !purplePaused) {
        telPurp(newSquareIndex)
      }
      if (color === "black") {
        decBlack(newSquareIndex)
      }
    }, 100)
    //
    return "Square spawned with color: " + color.toUpperCase()
  }
  //
  const decBlack = (index) => {
    blackValues.current[index] = 5
    //
    const timer = setInterval(() => {
      if (blackValues.current[index] > 0) {
        blackValues.current[index] -= 1
        setSquares(prev => [...prev])
      } else {
        clearInterval(blackValueTimers.current[index])
      }
    }, 400)
    //
    blackValueTimers.current[index] = timer
  }
  //
  useEffect(() => {
    return () => {
      Object.values(blackValueTimers.current).forEach(timer => {
        clearInterval(timer)
      })
    }
  }, [])
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
    Object.values(blackValueTimers.current).forEach(timer => {
      clearInterval(timer)
    })
    blackValueTimers.current = {}
    blackValues.current = {}
    //
    setSquares([])
    setRound(prevRound => prevRound + 1)

    setTimeout(() => {
      //
      const baseColors = ["blue", "green", "orange", "purple", "brown", "cyan", "black"]
      const colors = score > 60 ? [...baseColors, "red", "pink", "black"] : score > 30 ? [...baseColors, "red", "black"] : score > 10 ? [...baseColors, "red"] : baseColors
      //
      const shouldSpawnWhite = round % 30 === 0
      const shouldSpawnYellow = round % 12 === 0
      //
      const newSquares = []
      //
      const PADDING = 10
      const safeWidth = width - SQUARE_SIZE - PADDING
      const safeHeight = height - SQUARE_SIZE - PADDING
      //
      if (numSquares === 1) {
        let availableColors = ["blue", "green", "orange", "purple", "brown", "black"]

        // If it's a white spawn round, force white
        if (shouldSpawnWhite) {
          availableColors = ["white"]
        }
        // If it's a yellow spawn round, force yellow
        else if (shouldSpawnYellow) {
          availableColors = ["yellow"]
        }
        else {
          availableColors = availableColors.filter((color) => color.toLowerCase() !== danger.toLowerCase())

          if (availableColors.length === 0) {
            availableColors = ["brown"]
          }
        }

        const newColor = availableColors[Math.floor(Math.random() * availableColors.length)]
        //
        animations.current.forEach((anim) => anim.stop())
        animations.current = []
        //
        const startX = PADDING + Math.random() * (safeWidth - PADDING)
        const startY = PADDING + Math.random() * (safeHeight - PADDING)
        //
        const pan = new Animated.ValueXY({ x: startX, y: startY })
        const newSquareIndex = 0
        setSquares([{ pan, color: newColor }])

        // Initialize special behaviors
        setTimeout(() => {
          if (newColor === "black") {
            decBlack(newSquareIndex)
          }
          if (newColor === "purple" && !purplePaused) {
            telPurp(newSquareIndex)
          }
        }, 100)

        return
      }
      //
      animations.current.forEach((anim) => anim.stop())
      animations.current = []
      //
      let redCount = 0
      let greenCount = 0
      let pinkCount = 0
      let whiteCount = 0
      let blackCount = 0
      let purpleCount = 0
      let yellowCount = 0
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

        // Add white to available colors if it's a white spawn round and we haven't added one yet
        if (shouldSpawnWhite && whiteCount === 0) {
          availableColors.push("white")
        }

        // Add yellow to available colors if it's a yellow spawn round and we haven't added one yet
        if (shouldSpawnYellow && yellowCount === 0) {
          availableColors.push("yellow")
        }

        if (redCount >= 3) {
          availableColors = availableColors.filter((color) => color !== "red")
        }
        if (greenCount >= 1) {
          availableColors = availableColors.filter((color) => color !== "green")
        }
        if (pinkCount >= 1) {
          availableColors = availableColors.filter((color) => color !== "pink")
        }
        if (whiteCount >= 1) {
          availableColors = availableColors.filter((color) => color !== "white")
        }
        if (blackCount >= 2) { // Limit black squares to 2 per spawn
          availableColors = availableColors.filter((color) => color !== "black")
        }
        if (yellowCount >= 1) { // Limit yellow squares to 1 per spawn
          availableColors = availableColors.filter((color) => color !== "yellow")
        }

        // Prevent black and purple from appearing together
        if (purpleCount > 0) {
          availableColors = availableColors.filter((color) => color !== "black")
        }
        if (blackCount > 0) {
          availableColors = availableColors.filter((color) => color !== "purple")
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
          availableColors = ["brown"]
        }
        //
        let newColor = availableColors[Math.floor(Math.random() * availableColors.length)]

        // If it's a white spawn round and we haven't added white yet, prioritize white
        if (shouldSpawnWhite && whiteCount === 0 && availableColors.includes("white")) {
          newColor = "white"
        }

        // If it's a yellow spawn round and we haven't added yellow yet, prioritize yellow
        if (shouldSpawnYellow && yellowCount === 0 && availableColors.includes("yellow")) {
          newColor = "yellow"
        }

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
        if (newColor === "white") whiteCount++
        if (newColor === "black") blackCount++
        if (newColor === "purple") purpleCount++
        if (newColor === "yellow") yellowCount++
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

      // Initialize special behaviors
      newSquares.forEach((square, index) => {
        setTimeout(() => {
          if (square.color === "black") {
            decBlack(index)
          }
          if (square.color === "purple" && !purplePaused) {
            telPurp(index)
          }
        }, 100)
      })
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
    })
    // Only start teleportation for purple squares if not paused
    if (!purplePaused) {
      squares.forEach((square, index) => {
        if (square.color === "purple") {
          telPurp(index)
        }
      })
    }
  }, [squares, purplePaused])
  //
  const telPurp = (index) => {
    // Don't teleport if purple is paused
    if (purplePaused) return

    const teleport = () => {
      // Check if the square still exists and if purple is not paused
      if (squares[index] && squares[index].color === "purple" && !purplePaused) {
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
          setScore((prev) => (danger === "Orange" ? prev - 1 : prev + 1))
          spawnNewSquares();
          return
        }
        if (isOverTarget(pan) && squares[index].color === "blue") {
          setDanger("Blue")
          setScore((prev) => (danger === "Blue" ? prev - 1 : prev + 1))
          spawnNewSquares()
          return
        }
        if (isOverTarget(pan) && squares[index].color === "green") {
          setScore((prev) => prev + 2)
          spawnNewSquares()
          return
        }
        if (isOverTarget(pan) && squares[index].color === "purple") {
          // Resume purple teleportation when a purple square is scored
          setPurplePaused(false)
          setScore((prev) => prev + 3)
          spawnNewSquares()
          return
        }
        if (isOverTarget(pan) && squares[index].color === "yellow") {
          // Pause purple teleportation when a yellow square is scored
          setPurplePaused(true)
          setScore((prev) => prev + 1)
          spawnNewSquares()
          return
        }
        if (isOverTarget(pan) && squares[index].color === "white") {
          setDanger("None") // Reset danger to None
          setScore((prev) => prev + 1)
          spawnNewSquares()
          return
        }
        if (isOverTarget(pan) && squares[index].color === "black") {
          // Get the current value of the black square (or 0 if not found)
          const blackValue = blackValues.current[index] || 0

          // Clear the timer for this black square
          if (blackValueTimers.current[index]) {
            clearInterval(blackValueTimers.current[index])
            delete blackValueTimers.current[index]
          }

          // Add the current value to the score
          setScore((prev) => prev + blackValue)
          spawnNewSquares()
          return
        }
        if (isOverTarget(pan)) {
          setScore((prev) => prev + 1)
          spawnNewSquares()
          return
        }
      },
    })
  }
  //
  const resetGame = () => {
    // Clear all black value timers
    Object.values(blackValueTimers.current).forEach(timer => {
      clearInterval(timer)
    })
    blackValueTimers.current = {}
    blackValues.current = {}

    animations.current.forEach((anim) => anim.stop())
    animations.current = []
    setSquares([])
    spawnNewSquares()
  }
  //
  const getBlackValue = (index) => {
    return blackValues.current[index] !== undefined ? blackValues.current[index] : 5
  }
  //
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gameContainer}>
        <View style={styles.textOverlay} pointerEvents="none">
          <Text style={styles.scoreText}>Score: {score}</Text>
          <Text style={styles.dangerText}>Danger: {danger}</Text>
          <Text style={styles.purpleStatusText}>
            Purple: {purplePaused ? "OFFLINE" : "Active"}
          </Text>
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
            {square.color === "black" && (
              <View style={styles.blackValueContainer}>
                <Text style={styles.blackValueText}>{getBlackValue(index)}</Text>
              </View>
            )}
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
    backgroundColor: "beige",
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
    color: "black",
    textStroke: "2px",
  },
  dangerText: {
    position: "absolute",
    top: 50,
    left: 20,
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
  },
  purpleStatusText: {
    position: "absolute",
    top: 80,
    left: 20,
    fontSize: 24,
    fontWeight: "bold",
    color: "purple",
  },
  specialRoundsText: {
    position: "absolute",
    top: 140,
    left: 20,
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
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
"use client"

import { useState, useEffect, useRef } from "react"
import { SafeAreaView, Platform, Text, View, StyleSheet, Animated, PanResponder, Dimensions, Image } from "react-native"
//
const SQUARE_SIZE = 60
const TARGET_SIZE = 100
const { width, height } = Dimensions.get("window")
//
const textures = {
  black: require("./assets/colors/black.png"),
  blue: require("./assets/colors/blue.png"),
  brown: require("./assets/colors/brown.png"),
  cyan: require("./assets/colors/cyan.png"),
  gray: require("./assets/colors/gray.png"),
  green: require("./assets/colors/green.png"),
  orange: require("./assets/colors/orange.png"),
  pink: require("./assets/colors/pink.png"),
  purple: require("./assets/colors/purple.png"),
  red: require("./assets/colors/red.png"),
  white: require("./assets/colors/white.png"),
  yellow: require("./assets/colors/yellow.png"),
  target: require("./assets/target.png"),
}

// Create a separate component for the black square value display
const BlackValueDisplay = ({ value }) => {
  return (
    <View style={styles.blackValueContainer}>
      <Text style={styles.blackValueText}>{value}</Text>
    </View>
  )
}
//
export default function App() {
  const [score, setScore] = useState(0)
  const [danger, setDanger] = useState("None")
  const [squares, setSquares] = useState([])
  const [round, setRound] = useState(1)
  const [purplePaused, setPurplePaused] = useState(false)
  const [redDuration, setRedDuration] = useState(3000)
  // Add a separate state for black values that won't trigger re-renders of the entire component
  const [blackValueState, setBlackValueState] = useState({})
  const animations = useRef([])
  const blackValueTimers = useRef({})
  const blackValues = useRef({})
  const cyanEffectTimer = useRef(null)
  //
  const spawnSquare = (color) => {
    if (
      !["blue", "green", "orange", "purple", "red", "brown", "pink", "white", "black", "yellow", "cyan"].includes(
        color.toLowerCase(),
      )
    ) {
      console.log("Invalid color. Use: blue, green, orange, purple, red, brown, pink, white, black, yellow, or cyan")
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
    setSquares((prev) => [...prev, { pan, color }])

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
    // Update the separate state for black values
    setBlackValueState((prev) => ({
      ...prev,
      [index]: 5,
    }))
    //
    const timer = setInterval(() => {
      if (blackValues.current[index] > 0) {
        blackValues.current[index] -= 1
        // Update only the black value state, not the entire squares array
        setBlackValueState((prev) => ({
          ...prev,
          [index]: blackValues.current[index],
        }))
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
      Object.values(blackValueTimers.current).forEach((timer) => {
        clearInterval(timer)
      })
      if (cyanEffectTimer.current) {
        clearTimeout(cyanEffectTimer.current)
      }
    }
  }, [])
  //
  useEffect(() => {
    if (Platform.OS === "web") {
      window.spawnSquare = spawnSquare
    } else {
      global.spawnSquare = spawnSquare
    }
    //
    return () => {
      if (Platform.OS === "web") {
        delete window.spawnSquare
      } else {
        delete global.spawnSquare
      }
    }
  }, [squares.length])
  //
  const iceCyan = () => {
    setRedDuration(9000)

    if (cyanEffectTimer.current) {
      clearTimeout(cyanEffectTimer.current)
    }

    cyanEffectTimer.current = setTimeout(() => {
      setRedDuration(3000)
      cyanEffectTimer.current = null
    }, 10000)
  }
  //
  const spawnNewSquares = (numSquares = Math.floor(Math.random() * 5) + 1) => {
    Object.values(blackValueTimers.current).forEach((timer) => {
      clearInterval(timer)
    })
    blackValueTimers.current = {}
    blackValues.current = {}
    setBlackValueState({}) // Reset the black value state
    //
    setSquares([])
    setRound((prevRound) => prevRound + 1)

    setTimeout(() => {
      //
      const baseColors = ["blue", "green", "orange", "purple", "brown", "cyan", "black"]
      const colors =
        score > 60
          ? [...baseColors, "red", "pink", "black"]
          : score > 30
            ? [...baseColors, "red", "black"]
            : score > 10
              ? [...baseColors, "red"]
              : baseColors
      //
      const shouldSpawnWhite = round % 30 === 0
      const shouldSpawnYellow = round % 12 === 0
      const shouldSpawnCyan = round % 12 === 0
      //
      const newSquares = []
      //
      const PADDING = 10
      const safeWidth = width - SQUARE_SIZE - PADDING
      const safeHeight = height - SQUARE_SIZE - PADDING
      //
      if (numSquares === 1) {
        let availableColors = ["blue", "green", "orange", "purple", "brown", "black"]

        if (shouldSpawnWhite) {
          availableColors = ["white"]
        } else if (shouldSpawnYellow) {
          availableColors = ["yellow"]
        } else if (shouldSpawnCyan) {
          availableColors = ["cyan"]
        } else {
          availableColors = availableColors.filter((color) => color.toLowerCase() !== danger.toLowerCase())

          if (availableColors.length === 0) {
            availableColors = ["gray"]
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
      let cyanCount = 0
      const minSpacing = SQUARE_SIZE * 1.5
      //
      while (newSquares.length < numSquares) {
        const side = Math.floor(Math.random() * 4)
        let startX = 0,
          startY = 0
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

        if (shouldSpawnWhite && whiteCount === 0) {
          availableColors.push("white")
        }

        if (shouldSpawnYellow && yellowCount === 0) {
          availableColors.push("yellow")
        }

        if (shouldSpawnCyan && cyanCount === 0) {
          availableColors.push("cyan")
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
        if (blackCount >= 2) {
          availableColors = availableColors.filter((color) => color !== "black")
        }
        if (yellowCount >= 1) {
          availableColors = availableColors.filter((color) => color !== "yellow")
        }
        if (cyanCount >= 1) {
          availableColors = availableColors.filter((color) => color !== "cyan")
        }

        if (purpleCount > 0) {
          availableColors = availableColors.filter((color) => color !== "black")
        }
        if (blackCount > 0) {
          availableColors = availableColors.filter((color) => color !== "purple")
        }

        //
        if (danger !== "None") {
          if (numSquares === 2 && redCount >= 1) {
            availableColors = availableColors.filter(
              (color) => color.toLowerCase() !== danger.toLowerCase() && color !== "pink",
            )
          } else if (numSquares === 3 && redCount >= 2) {
            availableColors = availableColors.filter(
              (color) => color.toLowerCase() !== danger.toLowerCase() && color !== "pink",
            )
          } else if (numSquares === 4 && redCount >= 3) {
            availableColors = availableColors.filter(
              (color) => color.toLowerCase() !== danger.toLowerCase() && color !== "pink",
            )
          }
        }
        //
        if (availableColors.length === 0) {
          availableColors = ["gray"]
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

        // If it's a cyan spawn round and we haven't added cyan yet, prioritize cyan
        if (shouldSpawnCyan && cyanCount === 0 && availableColors.includes("cyan")) {
          newColor = "cyan"
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
        if (newColor === "cyan") cyanCount++
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
    if (purplePaused) return

    const teleport = () => {
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
      duration: redDuration,
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
          spawnNewSquares()
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
          setPurplePaused(false)
          setScore((prev) => prev + 3)
          spawnNewSquares()
          return
        }
        if (isOverTarget(pan) && squares[index].color === "yellow") {
          setPurplePaused(true)
          setScore((prev) => prev + 1)
          spawnNewSquares()
          return
        }
        if (isOverTarget(pan) && squares[index].color === "cyan") {
          iceCyan()
          setScore((prev) => prev + 1)
          spawnNewSquares()
          return
        }
        if (isOverTarget(pan) && squares[index].color === "white") {
          setDanger("None")
          setScore((prev) => prev + 1)
          spawnNewSquares()
          return
        }
        if (isOverTarget(pan) && squares[index].color === "black") {
          const blackValue = blackValues.current[index] || 0

          if (blackValueTimers.current[index]) {
            clearInterval(blackValueTimers.current[index])
            delete blackValueTimers.current[index]
          }

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
    Object.values(blackValueTimers.current).forEach((timer) => {
      clearInterval(timer)
    })
    blackValueTimers.current = {}
    blackValues.current = {}
    setBlackValueState({}) // Reset the black value state

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
          <Text style={styles.purpleStatusText}>Purple: {purplePaused ? "OFFLINE" : "Active"}</Text>
          <Text style={styles.redDurationText}>Red Speed: {redDuration === 3000 ? "Normal" : "Slow (Cyan)"}</Text>
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
              <BlackValueDisplay value={blackValueState[index] !== undefined ? blackValueState[index] : 5} />
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
  redDurationText: {
    position: "absolute",
    top: 110,
    left: 20,
    fontSize: 24,
    fontWeight: "bold",
    color: "cyan",
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
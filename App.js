import { useState, useEffect, useRef } from "react"
import { SafeAreaView, Platform, Text, View, StyleSheet, Animated, PanResponder, Dimensions, Image } from "react-native"
import BlackCrate from "./black-crate"

const SQUARE_SIZE = 60
const TARGET_SIZE = 100
const { width, height } = Dimensions.get("window")

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

export default function App() {
  const [score, setScore] = useState(0)
  const [danger, setDanger] = useState("None")
  const [squares, setSquares] = useState([])
  const [round, setRound] = useState(1)
  const [purplePaused, setPurplePaused] = useState(false)
  const [redDuration, setRedDuration] = useState(3000)

  const animations = useRef([])
  const cyanEffectTimer = useRef(null)
  const purpleTimers = useRef({})
  const squaresRef = useRef([])

  useEffect(() => {
    squaresRef.current = squares
  }, [squares])

  const isOverTarget = (pan) => {
    const squareX = typeof pan.x._value !== "undefined" ? pan.x._value : pan.x.__getValue()
    const squareY = typeof pan.y._value !== "undefined" ? pan.y._value : pan.y.__getValue()

    const targetX = width / 2 - TARGET_SIZE / 2
    const targetY = height / 2 - TARGET_SIZE / 2

    const isOver =
      squareX < targetX + TARGET_SIZE &&
      squareX + SQUARE_SIZE > targetX &&
      squareY < targetY + TARGET_SIZE &&
      squareY + SQUARE_SIZE > targetY

    if (isOver) {
      animations.current.forEach((anim) => anim.stop())
      animations.current = []
    }
    return isOver
  }

  const spawnSquare = (color) => {
    if (
      !["blue", "green", "orange", "purple", "red", "brown", "pink", "white", "black", "yellow", "cyan", "gray"].includes(
        color.toLowerCase()
      )
    ) {
      console.log("Invalid color.")
      return
    }

    const PADDING = 10
    const safeWidth = width - SQUARE_SIZE - PADDING
    const safeHeight = height - SQUARE_SIZE - PADDING

    const startX = PADDING + Math.random() * (safeWidth - PADDING)
    const startY = PADDING + Math.random() * (safeHeight - PADDING)

    const pan = new Animated.ValueXY({ x: startX, y: startY })
    const id = Date.now() + Math.random().toString(36).substr(2, 9)

    setSquares((prev) => {
      const newSquareIndex = prev.length
      const newSquares = [
        ...prev,
        {
          pan,
          color,
          position: { x: startX, y: startY },
          id,
        },
      ]

      setTimeout(() => {
        if (color === "red") {
          moveRed(newSquareIndex)
        }
        if (color === "purple" && !purplePaused) {
          startPurpleTeleport(id)
        }
      }, 100)

      return newSquares
    })

    return "Square spawned with color: " + color.toUpperCase()
  }

  const startPurpleTeleport = (id) => {
    if (purplePaused) return

    if (purpleTimers.current[id]) {
      clearTimeout(purpleTimers.current[id])
    }

    const teleport = () => {
      const currentSquares = squaresRef.current
      const squareIndex = currentSquares.findIndex((sq) => sq.id === id)

      if (squareIndex === -1) {
        if (purpleTimers.current[id]) {
          clearTimeout(purpleTimers.current[id])
          delete purpleTimers.current[id]
        }
        return
      }

      const square = currentSquares[squareIndex]

      if (square && square.color === "purple" && !purplePaused) {
        const pan = square.pan
        const newX = Math.random() * (width - SQUARE_SIZE)
        const newY = Math.random() * (height - SQUARE_SIZE)

        pan.stopAnimation()
        pan.setValue({
          x: Math.max(0, Math.min(newX, width - SQUARE_SIZE)),
          y: Math.max(0, Math.min(newY, height - SQUARE_SIZE)),
        })

        purpleTimers.current[id] = setTimeout(() => teleport(), 750)
      } else {
        if (purpleTimers.current[id]) {
          clearTimeout(purpleTimers.current[id])
          delete purpleTimers.current[id]
        }
      }
    }

    teleport()
  }

  const telPurp = (index) => {
    const square = squares[index]
    if (square && square.color === "purple") {
      startPurpleTeleport(square.id)
    }
  }

  const moveRed = (index) => {
    const square = squares[index]
    if (!square || square.color !== "red") return

    const pan = square.pan

    const targetX = width / 2 - TARGET_SIZE / 2
    const targetY = height / 2 - TARGET_SIZE / 2

    pan.stopAnimation()

    const animation = Animated.timing(pan, {
      toValue: { x: targetX + 18, y: targetY + 18 },
      duration: redDuration,
      useNativeDriver: false,
    })

    animations.current.push(animation)

    animation.start(() => {
      setTimeout(() => {
        if (isOverTarget(pan)) {
          setScore((prev) => prev - 1)
          resetGame()
        }
      }, 50)
    })
  }

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

  const panResponder = (index) => {
    if (squares[index].color === "red") {
      return { panHandlers: {} }
    }

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
          const squareId = squares[index].id
          if (purpleTimers.current[squareId]) {
            clearTimeout(purpleTimers.current[squareId])
            delete purpleTimers.current[squareId]
          }

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
        if (isOverTarget(pan)) {
          setScore((prev) => prev + 1)
          spawnNewSquares()
          return
        }
      },
    })
  }

  const handleBlackCrateRelease = (value) => {
    setScore((prev) => prev + value)
    spawnNewSquares()
  }

  const spawnNewSquares = (numSquares = Math.floor(Math.random() * 5) + 1) => {
    animations.current.forEach((anim) => anim.stop())
    animations.current = []

    Object.values(purpleTimers.current).forEach((timer) => clearTimeout(timer))
    purpleTimers.current = {}

    setSquares([])
    setRound((prevRound) => prevRound + 1)

    setTimeout(() => {
      const baseColors = ["blue", "green", "orange", "purple", "brown",]
      const colors =
        score > 60
          ? [...baseColors, "red", "pink", "black"]
          : score > 30
            ? [...baseColors, "red", "cyan", "black"]
            : score > 12
              ? [...baseColors, "red", "cyan", "yellow"]
              : score > 10
                ? [...baseColors, "red"]
                : baseColors

      const shouldSpawnWhite = round % 30 === 0
      const shouldSpawnYellow = round % 12 === 0
      const shouldSpawnCyan = round % 12 === 0

      const newSquares = []

      const PADDING = 10
      const safeWidth = width - SQUARE_SIZE - PADDING
      const safeHeight = height - SQUARE_SIZE - PADDING

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

        const startX = PADDING + Math.random() * (safeWidth - PADDING)
        const startY = PADDING + Math.random() * (safeHeight - PADDING)

        const pan = new Animated.ValueXY({ x: startX, y: startY })
        const id = Date.now() + Math.random().toString(36).substr(2, 9)

        const newSquare = {
          pan,
          color: newColor,
          position: { x: startX, y: startY },
          id,
        }

        setSquares([newSquare])

        setTimeout(() => {
          if (newColor === "red") {
            moveRed(0)
          }
          if (newColor === "purple" && !purplePaused) {
            startPurpleTeleport(id)
          }
        }, 100)

        return
      }

      let redCount = 0
      let greenCount = 0
      let pinkCount = 0
      let whiteCount = 0
      let blackCount = 0
      let purpleCount = 0
      let yellowCount = 0
      let cyanCount = 0
      const minSpacing = SQUARE_SIZE * 1.5

      while (newSquares.length < numSquares) {
        const side = Math.floor(Math.random() * 4)
        let startX = 0,
          startY = 0
        let tooClose

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

          for (const square of newSquares) {
            if (
              Math.abs(square.position.x - startX) < minSpacing &&
              Math.abs(square.position.y - startY) < minSpacing
            ) {
              tooClose = true
              break
            }
          }
        } while (tooClose)

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

        if (availableColors.length === 0) {
          availableColors = ["gray"]
        }

        let newColor = availableColors[Math.floor(Math.random() * availableColors.length)]

        if (shouldSpawnWhite && whiteCount === 0 && availableColors.includes("white")) {
          newColor = "white"
        }

        if (shouldSpawnYellow && yellowCount === 0 && availableColors.includes("yellow")) {
          newColor = "yellow"
        }

        if (shouldSpawnCyan && cyanCount === 0 && availableColors.includes("cyan")) {
          newColor = "cyan"
        }

        const colorCounts = newSquares.reduce((acc, square) => {
          acc[square.color] = (acc[square.color] || 0) + 1
          return acc
        }, {})

        if (colorCounts[newColor] === numSquares - 1) {
          availableColors = availableColors.filter((color) => color !== newColor)
          if (availableColors.length > 0) {
            newColor = availableColors[Math.floor(Math.random() * availableColors.length)]
          }
        }

        if (newColor === "red") redCount++
        if (newColor === "green") greenCount++
        if (newColor === "pink") pinkCount++
        if (newColor === "white") whiteCount++
        if (newColor === "black") blackCount++
        if (newColor === "purple") purpleCount++
        if (newColor === "yellow") yellowCount++
        if (newColor === "cyan") cyanCount++

        const pan = new Animated.ValueXY({ x: startX, y: startY })
        const id = Date.now() + Math.random().toString(36).substr(2, 9) + newSquares.length

        newSquares.push({
          pan,
          color: newColor,
          position: { x: startX, y: startY },
          id,
        })

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

      const purpleSquareIds = newSquares.filter((square) => square.color === "purple").map((square) => square.id)

      setTimeout(() => {
        newSquares.forEach((square, index) => {
          if (square.color === "red") {
            moveRed(index)
          }
        })

        if (!purplePaused) {
          purpleSquareIds.forEach((id) => {
            startPurpleTeleport(id)
          })
        }
      }, 100)
    }, 500)
  }

  useEffect(() => {
    spawnNewSquares()

    return () => {
      animations.current.forEach((anim) => anim.stop())
      if (cyanEffectTimer.current) {
        clearTimeout(cyanEffectTimer.current)
      }
      Object.values(purpleTimers.current).forEach((timer) => clearTimeout(timer))
    }
  }, [])

  useEffect(() => {
    if (Platform.OS === "web") {
      window.spawnSquare = spawnSquare
    } else {
      global.spawnSquare = spawnSquare
    }

    return () => {
      if (Platform.OS === "web") {
        delete window.spawnSquare
      } else {
        delete global.spawnSquare
      }
    }
  }, [squares.length])

  useEffect(() => {
    squares.forEach((square, index) => {
      if (square.color === "red") {
        moveRed(index)
      }
    })
  }, [squares, redDuration])

  useEffect(() => {
    if (purplePaused) {
      Object.values(purpleTimers.current).forEach((timer) => clearTimeout(timer))
      purpleTimers.current = {}
    } else {
      squares.forEach((square) => {
        if (square.color === "purple") {
          startPurpleTeleport(square.id)
        }
      })
    }
  }, [purplePaused])

  const resetGame = () => {

    animations.current.forEach((anim) => anim.stop())
    animations.current = []

    Object.values(purpleTimers.current).forEach((timer) => clearTimeout(timer))
    purpleTimers.current = {}

    setSquares([])
    spawnNewSquares()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gameContainer}>
        <View style={styles.textOverlay} pointerEvents="none">
          <Text style={styles.scoreText}>Score: {score}</Text>
          <Text style={styles.dangerText}>
            Danger:{" "}
            <Text
              style={{
                color: danger === "Blue" ? "blue" : danger === "Orange" ? "orange" : "black",
                fontWeight: "bold",
              }}
            >
              {danger}
            </Text>
          </Text>
          <Text style={styles.purpleStatusText}>
            Purple:{" "}
            <Text style={{ color: purplePaused ? "red" : "green" }}>
              {purplePaused ? "OFFLINE" : "ACTIVE"}
            </Text>
          </Text>
          <Text style={styles.redDurationText}>
            Red:{" "}
            <Text style={{ color: redDuration === 3000 ? "red" : "lightblue" }}>
              {redDuration === 3000 ? "Normal" : "Iced"}
            </Text>
          </Text>
        </View>
        <Image source={textures.target} style={styles.targetSquare} />

        {squares.map((square, index) =>
          square.color === "black" ? (
            <BlackCrate
              key={`black-${square.id}`}
              initialPosition={{ x: square.pan.x._value, y: square.pan.y._value }}
              onRelease={handleBlackCrateRelease}
              textures={textures}
              SQUARE_SIZE={SQUARE_SIZE}
              isOverTarget={isOverTarget}
            />
          ) : (
            <Animated.View
              key={`square-${square.id}`}
              style={{
                ...styles.draggableSquare,
                transform: [{ translateX: square.pan.x }, { translateY: square.pan.y }],
              }}
              {...panResponder(index).panHandlers}
            >
              <Image source={textures[square.color]} style={{ width: SQUARE_SIZE + 5, height: SQUARE_SIZE + 5 }} />
            </Animated.View>
          ),
        )}
      </View>
    </SafeAreaView>
  )
}

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
    color: "black",
  },
  redDurationText: {
    position: "absolute",
    top: 110,
    left: 20,
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
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
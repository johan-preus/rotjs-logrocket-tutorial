const displayOptions = {
    bg: "white",
    fg: "dimGray",
    fontFamily: "Fira Mono",
    width: 25,
    height: 20,
    fontSize: 18,
    forceSquareRatio: true,
}

const colors = {
    ".": "lightgray",
}

const Game = {
    map: [],
    win: false,
    player: null,
    init: async function () {
        // why sleep? why not just use body onload prop?
        const sleep = (ms) => new Promise((res) => setTimeout(res, ms))
        await sleep(500).then(() => {
            this.display = new ROT.Display(displayOptions)
            let canvas = document.querySelector("#canvas")
            canvas.appendChild(this.display.getContainer())
        })
        this.player = new Player()
        this.display.clear()
        this.createLevel()
        this.player.init()
        this.engine()
        this.draw()
    },
    engine: async function () {
        while (true) {
            await this.player.act()
            this.draw()
        }
    },
    createLevel: function () {
        GameWorld.generate()
    },
    draw: function () {
        this.display.clear()
        GameWorld.draw()
        this.player.draw()
    },
    endGame: function () {
        ;(this.win = true), this.display.clear()
        this.display.draw(8, 8, "You logged the rocket!", "violet")
    },
}

const GameWorld = {
    map: [],
    moveSpace: [],
    generate: function () {
        let map = []
        for (let i = 0; i < displayOptions.width; i++) {
            map[i] = []
            for (let j = 0; j < displayOptions.height; j++) {
                // these will be walls around the map
                map[i][j] = "+"
            }
        }
        let freeCells = []
        let digger = new ROT.Map.Cellular(
            // intending to leave 1 tile perimeter
            displayOptions.width - 2,
            displayOptions.height - 2
        )
        // randomize(probability) set all cells to "alive" with a
        // given probability (0 = no cells, 1 = all cells)
        digger.randomize(0.4)
        digger.create((x, y, value) => {
            if (value) {
                // +1 here to leave a 1 tile perimeter
                map[x + 1][y + 1] = "🌖"
            } else {
                freeCells.push({ x: x + 1, y: y + 1 })
                map[x + 1][y + 1] = "." //add dot to free spaces
            }
        })
        const lastFreeCell = freeCells.pop()
        map[lastFreeCell.x][lastFreeCell.y] = "🌍"
        this.map = map
        this.freeCells = freeCells
    },
    isPassable: function (x, y) {
        if (GameWorld.map[x][y] === "+" || GameWorld.map[x][y] === "🌖") {
            return false
        }
        return true
    },
    draw: function () {
        this.map.forEach((el, x) => {
            el.forEach((el, y) => {
                Game.display.draw(x, y, el, colors[el] || "red")
            })
        })
    },
}

class Player {
    constructor() {
        this.x = null
        this.y = null
    }
    init() {
        let playerStart = GameWorld.freeCells[0]
        this.x = playerStart.x
        this.y = playerStart.y
    }
    draw() {
        Game.display.draw(this.x, this.y, "🚀", "black")
    }
    async act() {
        let action = false
        while (!action) {
            await new Promise((resolve) => setTimeout(resolve, 100))
            let e = await new Promise((resolve) => {
                window.addEventListener("keydown", resolve, { once: true })
            })
            action = this.handleKey(e)
        }
        if (GameWorld.map[this.x][this.y] === "🌍") {
            Game.endGame()
            Game.createLevel()
            this.init()
        }
    }
    handleKey(e) {
        const keyCode = []
        keyCode[38] = 0 //up
        keyCode[39] = 2 //right
        keyCode[40] = 4 //down
        keyCode[37] = 6 //left
        const code = e.keyCode
        if (!(code in keyCode)) {
            return false
        }
        // diff is a variable added to the players location
        let diff = ROT.DIRS[8][keyCode[code]]
        if (GameWorld.isPassable(this.x + diff[0], this.y + diff[1])) {
            this.x += diff[0]
            this.y += diff[1]
            this.justMoved = true
            return true
        }
        return false
    }
}

window.addEventListener(
    "keydown",
    function (e) {
        if ([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault()
        }
    },
    false
)

window.onload = Game.init()
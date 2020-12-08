package main

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/net/websocket"
)

const (
	MOD = iota
)

type Session struct {
	clients []*websocket.Conn
	Code string `json:"code"`
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Used to buffer all session reads and writes.
	sessions := make(map[string]Session)

	// Start a session.
	e.POST("/new", func(c echo.Context) error {
		uid := uuid.New().String()
		sessions[uid] = Session{
			clients: make([]*websocket.Conn, 0),
			Code: "",
		}

		return c.String(http.StatusOK, uid)
	})

	// WebSocket endpoint.
	e.GET("/session/:id", func(c echo.Context) error {
		session := sessions[c.Param("id")]

		websocket.Handler(func(ws *websocket.Conn) {
			defer ws.Close()
			err := websocket.Message.Send(ws, "INFO: Connection OK.")
			if err != nil {
				c.Logger().Error(err)
			}
			for {
				msg := ""
				err = websocket.Message.Receive(ws, &msg)
				if err != nil {
					c.Logger().Error(err)
				}

				switch int(msg[0]) {
				case MOD:
					session.Code = msg[2:len(msg)-1]
				}

				for _, c := range session.clients {
					websocket.Message.Send(c, msg)
				}
			}
		}).ServeHTTP(c.Response(), c.Request())

		return nil
	})

	e.Logger.Fatal(e.Start(":1337"))
}
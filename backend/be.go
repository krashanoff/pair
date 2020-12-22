package main

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/net/websocket"
)

// Thread-safe session.
type Session struct {
	Code    string `json:"code"`
	clients []*websocket.Conn
	lock    chan bool
}

func NewSession() (s Session) {
	s = Session{
		Code:    "",
		clients: []*websocket.Conn{},
		lock:    make(chan bool, 1),
	}
	s.lock <- false
	return
}
func (s *Session) AddClient(ws *websocket.Conn) {
	<-s.lock
	s.clients = append(s.clients, ws)
	s.lock <- false
}
func (s *Session) Fwd(msg string) error {
	<-s.lock
	for _, c := range s.clients {
		if err := websocket.Message.Send(c, msg); err != nil {
			return err
		}
	}
	s.lock <- false
	return nil
}

var sessions map[string]Session

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// Used to buffer all session reads and writes.
	sessions = make(map[string]Session)

	// Start a session.
	e.POST("/new", func(c echo.Context) error {
		uid := uuid.New().String()
		sessions[uid] = NewSession()
		return c.String(http.StatusOK, uid)
	})

	// WebSocket endpoint.
	e.GET("/s/:id", func(c echo.Context) error {
		c.Logger().Printf("Started new websocket connection.")
		session, ok := sessions[c.Param("id")]

		if !ok {
			c.Logger().Printf("Session doesn't exist.")
			return c.String(http.StatusOK, "Such a session does not exist.")
		}

		websocket.Handler(func(ws *websocket.Conn) {
			defer ws.Close()
			err := websocket.Message.Send(ws, "INFO: Connection OK.")
			if err != nil {
				c.Logger().Error(err)
			}

			session.clients = append(session.clients, ws)

			// Forward packets to everyone in the network.
			// Kill session after last person leaves.
			for {
				msg := ""
				err = websocket.Message.Receive(ws, &msg)
				if err != nil {
					c.Logger().Error(err)

					// Check if need to delete.
					if len(session.clients) == 0 {
						delete(sessions, c.Param("id"))
						c.Logger().Printf("Killed session id: %s", c.Param("id"))
						break
					}
				}

				if err := session.Fwd(msg); err != nil {
					c.Logger().Printf("Forwarded message: %s", msg)
				}
			}
		}).ServeHTTP(c.Response(), c.Request())

		return nil
	})

	e.Logger.Fatal(e.Start(":8081"))
}

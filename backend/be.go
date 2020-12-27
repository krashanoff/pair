package main

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/net/websocket"
)

//
// pear
//
// Simple websocket arbiter.
//

// Thread-safe session management.
type Session struct {
	code    string
	clients map[*websocket.Conn]bool
	lock    chan bool
}

func NewSession() (s Session) {
	s = Session{
		code:    "console.log(\"Welcome to pair!\");\n",
		clients: make(map[*websocket.Conn]bool),
		lock:    make(chan bool, 1),
	}
	s.lock <- false
	return
}
func (s *Session) AddClient(ws *websocket.Conn) error {
	<-s.lock
	if err := websocket.Message.Send(ws, s.code); err != nil {
		return err
	}
	s.clients[ws] = true
	s.lock <- false
	return nil
}
func (s *Session) RemoveClient(ws *websocket.Conn) error {
	<-s.lock
	ws.Close()
	delete(s.clients, ws)
	s.lock <- false
	return nil
}
func (s *Session) Fwd(msg string) error {
	<-s.lock
	for c := range s.clients {
		if err := websocket.Message.Send(c, msg); err != nil {
			return err
		}
	}
	s.lock <- false
	return nil
}

func main() {
	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// Used to buffer all session reads and writes.
	sessions := make(map[string]Session)

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
			if err := session.AddClient(ws); err != nil {
				return
			}

			// Forward packets to everyone in the network.
			// Kill session after last person leaves.
			for {
				msg := ""
				err := websocket.Message.Receive(ws, &msg)
				if err != nil {
					c.Logger().Errorf("Error encountered: %s. Closing socket.", err)
					session.RemoveClient(ws)
					break
				}
				c.Logger().Infof("RECV: %s", msg)
				session.code = msg

				if err := session.Fwd(msg); err != nil {
					c.Logger().Printf("Forwarded message: %s", msg)
				}
			}
		}).ServeHTTP(c.Response(), c.Request())

		// Check if we need to delete the session.
		if len(session.clients) == 0 {
			c.Logger().Infof("Destroying session ID %s.", c.Param("id"))
			go func() {
				delete(sessions, c.Param("id"))
			}()
		}

		return nil
	})

	e.Logger.Fatal(e.Start(":8081"))
}

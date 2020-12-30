package main

import (
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/net/websocket"
)

//
// pear
//
// Simple websocket arbiter. All sessions kept
// in memory.
//

// Thread-safe session management.
type Session struct {
	// Map client names to connections.
	clients map[string]*websocket.Conn
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
func (s *Session) AddClient(id string, ws *websocket.Conn) error {
	<-s.lock
	s.clients[id] = ws
	s.lock <- false
	return nil
}
func (s *Session) RemoveClient(id string) error {
	<-s.lock
	ws.Close()
	delete(s.clients, id)
	s.lock <- false
	return nil
}
func (s *Session) Fwd(msg string) error {
	<-s.lock
	for id, c := range s.clients {
		websocket.Message.Send(c, msg)
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

	// Create a new session as the host with the
	// provided password.

	// TODO: if people don't join within 10 seconds,
	// delete it.
	e.POST("/create", func(c echo.Context) error {
		uid := uuid.New().String()
		sessions[uid] = NewSession()
		go func() {
			time.Sleep(10 * time.Second)
			if s, ok := sessions[uid]; !ok || len(s) == 0 {
				delete(sessions, uid)
			}
		}()
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

package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/labstack/gommon/log"
	"golang.org/x/net/websocket"
)

//
// pear
//
// Simple websocket arbiter. All sessions kept
// in memory.
//

// CreateRequest is the structure of a request
// to the POST /create endpoint.
type CreateRequest struct {
	HostName string `json:"name"`
}

// Session describes a single collaborative coding
// instance.
type Session struct {
	// Map client names to connections.
	clients map[string]*websocket.Conn

	// Software lock for thread safety.
	lock chan bool
}

// NewSession returns a fresh Session.
func NewSession() (s Session) {
	s = Session{
		clients: make(map[string]*websocket.Conn),
		lock:    make(chan bool, 1),
	}
	s.lock <- false
	return
}

// Returns an error if the given name is already
// taken.
func (s *Session) AddClient(name string, ws *websocket.Conn) error {
	<-s.lock
	s.clients[name] = ws
	s.lock <- false
	return nil
}

// Returns an error if the given name is no longer
// in the session.
func (s *Session) RemoveClient(name string) error {
	<-s.lock
	ws, ok := s.clients[name]
	if !ok {
		return fmt.Errorf("Bad client ID!")
	}
	ws.Close()
	delete(s.clients, name)
	s.lock <- false
	return nil
}

// Fwd a message `msg` to all clients in the provided
// Session.
func (s *Session) Fwd(msg string) error {
	<-s.lock
	for _, c := range s.clients {
		websocket.Message.Send(c, msg)
	}
	s.lock <- false
	return nil
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	e.HideBanner = true
	e.Logger.SetLevel(log.INFO)

	// Create sessions storage.
	sessions := make(map[string]Session)

	// Create a new session. If the session is not joined
	// within 30 seconds, it is deleted automatically.
	e.POST("/create", func(c echo.Context) error {
		body := CreateRequest{}
		if err := c.Bind(&body); err != nil {
			return c.String(http.StatusBadRequest, err.Error())
		}

		uid := uuid.New().String()
		sessions[uid] = NewSession()

		// Delete the session if nobody joins.
		go func() {
			time.Sleep(30 * time.Second)
			if s, ok := sessions[uid]; !ok || len(s.clients) == 0 {
				delete(sessions, uid)
				c.Logger().Infof("Deleted session with uid %s after 30 seconds of inactivity.", uid)
			}
		}()

		c.Logger().Infof("Created session with uid %s", uid)
		return c.String(http.StatusOK, uid)
	})

	// Connect to the provided session ID and name.
	// The given name must be unique.
	//
	// Connection flow:
	// * Establish connection with name.
	// * Request identification from all current members ("IDENTIFY").
	// * Start receiving and transmitting events to all members.
	e.GET("/s/:uid", func(c echo.Context) error {
		// Session must exist.
		uid := c.Param("uid")
		session, ok := sessions[uid]
		if !ok {
			return c.String(http.StatusNotFound, "Session does not exist.")
		}

		// User must have a name.
		name := c.QueryParam("name")
		if _, exists := session.clients[name]; name == "" || exists {
			return c.String(http.StatusBadRequest, "Name is not unique.")
		}

		// Initiate communication.
		websocket.Handler(func(ws *websocket.Conn) {
			if err := session.AddClient(name, ws); err != nil {
				return
			}

			c.Logger().Infof("New client '%s' connected to session with uid %s", name, uid)

			// Request identification from all clients.
			if err := websocket.Message.Send(ws, "{ type: \"IDENTIFY\" }"); err != nil {
				return
			}

			// Forward packets to everyone in the network.
			// Kill session after last person leaves.
			for {
				msg := ""
				err := websocket.Message.Receive(ws, &msg)
				if err != nil {
					c.Logger().Errorf("Error encountered when receiving message from user '%s'. Closing socket.", name)
					session.RemoveClient(name)
					break
				}
				c.Logger().Infof("Received message `%s` from %s in session with uid %s", msg, name, uid)

				if err := session.Fwd(msg); err != nil {
					c.Logger().Error(err)
				}
			}
		}).ServeHTTP(c.Response(), c.Request())

		// Start countdown if that was the last user to leave.
		if len(session.clients) == 0 {
			go func() {
				time.Sleep(5 * time.Minute)
				delete(sessions, uid)
				c.Logger().Infof("Destroyed session with uid %s.", uid)
			}()
		}

		return nil
	})

	e.Logger.Fatal(e.Start(":8081"))
}

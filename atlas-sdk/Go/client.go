package atlas

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type AtlasClient struct {
	mu         sync.RWMutex
	config     *Config
	ws         *websocket.Conn
	wsURL      string
	entities   map[string]*Entity
	handlers   map[string][]func(*Event)
	connected  bool
}

func NewClient(cfg *Config, wsURL string) *AtlasClient {
	if cfg == nil {
		cfg = NewConfig("")
	}
	return &AtlasClient{
		config:   cfg,
		wsURL:    wsURL,
		entities: make(map[string]*Entity),
		handlers: make(map[string][]func(*Event)),
	}
}

func (c *AtlasClient) Connect(url string) error {
	if url != "" {
		c.wsURL = url
	}
	if c.wsURL == "" {
		return fmt.Errorf("WebSocket URL required")
	}

	conn, _, err := websocket.DefaultDialer.Dial(c.wsURL, nil)
	if err != nil {
		return fmt.Errorf("dial error: %w", err)
	}
	c.ws = conn
	c.connected = true

	var snapshot map[string]interface{}
	if err := c.sendMsg(map[string]string{"type": "get_snapshot"}, &snapshot); err != nil {
		return err
	}
	log.Printf("Connected to Atlas Runtime at %s", c.wsURL)
	return nil
}

func (c *AtlasClient) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.ws != nil {
		c.ws.Close()
	}
	c.connected = false
}

func (c *AtlasClient) sendMsg(request, response interface{}) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if err := c.ws.WriteJSON(request); err != nil {
		return err
	}
	if response != nil {
		if err := c.ws.ReadJSON(response); err != nil {
			return err
		}
	}
	return nil
}

func (c *AtlasClient) GetSnapshot() (map[string]interface{}, error) {
	var result map[string]interface{}
	err := c.sendMsg(map[string]string{"type": "get_snapshot"}, &result)
	return result, err
}

func (c *AtlasClient) StartRuntime() (map[string]interface{}, error) {
	var result map[string]interface{}
	err := c.sendMsg(map[string]string{"type": "start_runtime"}, &result)
	return result, err
}

func (c *AtlasClient) StopRuntime() (map[string]interface{}, error) {
	var result map[string]interface{}
	err := c.sendMsg(map[string]string{"type": "stop_runtime"}, &result)
	return result, err
}

func (c *AtlasClient) EmitEvent(eventType, source string, payload map[string]interface{}) error {
	msg := map[string]interface{}{
		"type": "emit_event",
		"payload": map[string]interface{}{
			"type":      eventType,
			"source":    source,
			"timestamp": time.Now().UnixMilli(),
			"payload":   payload,
		},
	}
	return c.sendMsg(msg, nil)
}

func (c *AtlasClient) RegisterEntity(entity *Entity) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entities[entity.ID] = entity
	c.EmitEvent("entity:registered", "go-sdk", entity.ToMap())
}

func (c *AtlasClient) UnregisterEntity(id string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.entities, id)
	c.EmitEvent("entity:unregistered", "go-sdk", map[string]interface{}{"entity_id": id})
}

func (c *AtlasClient) GetEntity(id string) *Entity {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.entities[id]
}

func (c *AtlasClient) GetAllEntities() []*Entity {
	c.mu.RLock()
	defer c.mu.RUnlock()
	result := make([]*Entity, 0, len(c.entities))
	for _, e := range c.entities {
		result = append(result, e)
	}
	return result
}

func (c *AtlasClient) On(eventType string, handler func(*Event)) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.handlers[eventType] = append(c.handlers[eventType], handler)
}

func (c *AtlasClient) EmitLocal(eventType, source string, payload map[string]interface{}) *Event {
	evt := NewEvent(eventType, source, payload)
	c.mu.RLock()
	handlers := c.handlers[eventType]
	wildcard := c.handlers["*"]
	c.mu.RUnlock()
	for _, h := range handlers {
		h(evt)
	}
	for _, h := range wildcard {
		h(evt)
	}
	return evt
}

func (e *Entity) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"id":         e.ID,
		"name":       e.Name,
		"type":       e.Type,
		"metadata":   e.Metadata,
		"created_at": e.CreatedAt,
	}
}

func init() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
}

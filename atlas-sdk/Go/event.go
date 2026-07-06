package atlas

import (
	"fmt"
	"time"
)

type Event struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"`
	Source    string                 `json:"source"`
	Payload   map[string]interface{} `json:"payload"`
	Timestamp int64                  `json:"timestamp"`
	Priority  string                 `json:"priority"`
}

func NewEvent(eventType, source string, payload map[string]interface{}) *Event {
	return &Event{
		ID:        fmt.Sprintf("evt-%d", time.Now().UnixNano()),
		Type:      eventType,
		Source:    source,
		Payload:   payload,
		Timestamp: time.Now().UnixMilli(),
		Priority:  "medium",
	}
}

func (e *Event) ToMap() map[string]interface{} {
	if e.Payload == nil {
		e.Payload = make(map[string]interface{})
	}
	return map[string]interface{}{
		"id":        e.ID,
		"type":      e.Type,
		"source":    e.Source,
		"payload":   e.Payload,
		"timestamp": e.Timestamp,
		"priority":  e.Priority,
	}
}

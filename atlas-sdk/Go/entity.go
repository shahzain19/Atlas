package atlas

import "time"

type Entity struct {
	ID        string                 `json:"id"`
	Name      string                 `json:"name"`
	Type      string                 `json:"type"`
	Metadata  map[string]interface{} `json:"metadata"`
	CreatedAt int64                  `json:"created_at"`
}

func NewEntity(id, name, entityType string) *Entity {
	return &Entity{
		ID:        id,
		Name:      name,
		Type:      entityType,
		Metadata:  make(map[string]interface{}),
		CreatedAt: time.Now().UnixMilli(),
	}
}

func (e *Entity) SetMeta(key string, value interface{}) {
	e.Metadata[key] = value
}

func (e *Entity) GetMeta(key string) interface{} {
	return e.Metadata[key]
}

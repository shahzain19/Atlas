package atlas

import (
	"encoding/json"
	"os"
	"strings"
)

type Config struct {
	path string
	data map[string]interface{}
}

func NewConfig(path string) *Config {
	if path == "" {
		path = "config.json"
	}
	c := &Config{path: path, data: make(map[string]interface{})}
	c.Load()
	return c
}

func (c *Config) Load() {
	data, err := os.ReadFile(c.path)
	if err != nil {
		c.data = make(map[string]interface{})
		return
	}
	json.Unmarshal(data, &c.data)
}

func (c *Config) Save() error {
	data, err := json.MarshalIndent(c.data, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(c.path, data, 0644)
}

func (c *Config) Get(key string, defaultVal interface{}) interface{} {
	keys := strings.Split(key, ".")
	current := c.data
	for i, k := range keys {
		if i == len(keys)-1 {
			if v, ok := current[k]; ok {
				return v
			}
			return defaultVal
		}
		if v, ok := current[k].(map[string]interface{}); ok {
			current = v
		} else {
			return defaultVal
		}
	}
	return defaultVal
}

func (c *Config) Set(key string, value interface{}) {
	keys := strings.Split(key, ".")
	current := c.data
	for i, k := range keys {
		if i == len(keys)-1 {
			current[k] = value
			break
		}
		if _, ok := current[k].(map[string]interface{}); !ok {
			current[k] = make(map[string]interface{})
		}
		current = current[k].(map[string]interface{})
	}
	c.Save()
}

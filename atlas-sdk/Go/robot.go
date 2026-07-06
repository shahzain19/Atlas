package atlas

type Robot struct {
	client  *AtlasClient
	ID      string
	Name    string
}

func NewRobot(client *AtlasClient, id, name string) *Robot {
	return &Robot{
		client: client,
		ID:     id,
		Name:   name,
	}
}

type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}

type NavigateTarget struct {
	Latitude  float64 `json:"latitude,omitempty"`
	Longitude float64 `json:"longitude,omitempty"`
	Altitude  float64 `json:"altitude,omitempty"`
	X         float64 `json:"x,omitempty"`
	Y         float64 `json:"y,omitempty"`
	Z         float64 `json:"z,omitempty"`
}

type ScanResult struct {
	Objects   []DetectedObject `json:"objects"`
	Timestamp int64            `json:"timestamp"`
}

type DetectedObject struct {
	Label      string   `json:"label"`
	Confidence float64  `json:"confidence"`
	Position   Position `json:"position"`
}

type RobotStatus struct {
	Position  Position `json:"position"`
	Battery   float64  `json:"battery"`
	Speed     float64  `json:"speed"`
	Mode      string   `json:"mode"`
	TaskCount int      `json:"taskCount"`
}

func (r *Robot) NavigateTo(target NavigateTarget) error {
	pos := map[string]float64{"x": target.X, "y": target.Y, "z": target.Z}
	if target.Latitude != 0 || target.Longitude != 0 {
		pos = map[string]float64{"x": target.Latitude, "y": target.Longitude, "z": target.Altitude}
	}
	return r.client.EmitEvent("ROBOT_NAVIGATE", r.Name, map[string]interface{}{
		"target":  pos,
		"robotId": r.ID,
	})
}

func (r *Robot) Scan() error {
	return r.client.EmitEvent("IMAGE_CAPTURED", r.Name, map[string]interface{}{
		"camera":  "front",
		"robotId": r.ID,
	})
}

func (r *Robot) Explore() error {
	return r.client.EmitEvent("TASK_REQUEST", r.Name, map[string]interface{}{
		"name":    "Autonomous Survey",
		"robotId": r.ID,
	})
}

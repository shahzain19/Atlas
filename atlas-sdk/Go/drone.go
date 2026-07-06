package atlas

type Drone struct {
	client *AtlasClient
	ID     string
	Name   string
}

type GeoPosition struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Altitude  float64 `json:"altitude,omitempty"`
}

type DroneStatus struct {
	Position  Position `json:"position"`
	Battery   float64  `json:"battery"`
	Altitude  float64  `json:"altitude"`
	Mode      string   `json:"mode"`
	Speed     float64  `json:"speed"`
}

type ImageData struct {
	Width     int   `json:"width"`
	Height    int   `json:"height"`
	Timestamp int64 `json:"timestamp"`
}

func NewDrone(client *AtlasClient, id, name string) *Drone {
	return &Drone{
		client: client,
		ID:     id,
		Name:   name,
	}
}

func (d *Drone) Takeoff(altitude float64) error {
	if altitude == 0 {
		altitude = 10
	}
	return d.client.EmitEvent("DRONE_TAKEOFF", d.Name, map[string]interface{}{
		"targetAltitude": altitude,
		"droneId":        d.ID,
	})
}

func (d *Drone) FlyTo(lat, lon, alt float64) error {
	return d.client.EmitEvent("DRONE_FLY_TO", d.Name, map[string]interface{}{
		"latitude":  lat,
		"longitude": lon,
		"altitude":  alt,
		"droneId":   d.ID,
	})
}

func (d *Drone) CaptureImage() error {
	return d.client.EmitEvent("IMAGE_CAPTURED", d.Name, map[string]interface{}{
		"camera":  "downward",
		"droneId": d.ID,
	})
}

func (d *Drone) ReturnHome() error {
	return d.client.EmitEvent("DRONE_RETURN", d.Name, map[string]interface{}{
		"droneId": d.ID,
	})
}

func (d *Drone) Land() error {
	return d.client.EmitEvent("DRONE_LAND", d.Name, map[string]interface{}{
		"droneId": d.ID,
	})
}

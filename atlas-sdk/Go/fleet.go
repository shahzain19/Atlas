package atlas

type Fleet struct {
	client  *AtlasClient
	members map[string]*FleetMember
}

type FleetMember struct {
	ID       string      `json:"id"`
	Type     string      `json:"type"`
	Status   RobotStatus `json:"status"`
	LastSeen int64       `json:"lastSeen"`
}

type FleetStatus struct {
	Members       []*FleetMember         `json:"members"`
	Healthy       int                    `json:"healthy"`
	Total         int                    `json:"total"`
	MissionActive bool                   `json:"missionActive"`
}

type MissionGoal struct {
	Description string `json:"description"`
	Priority    int    `json:"priority"`
}

type MissionDefinition struct {
	Name        string         `json:"name"`
	Description string         `json:"description,omitempty"`
	Goals       []MissionGoal  `json:"goals"`
}

func NewFleet(client *AtlasClient) *Fleet {
	return &Fleet{
		client:  client,
		members: make(map[string]*FleetMember),
	}
}

func (f *Fleet) Register(id, memberType string) {
	f.members[id] = &FleetMember{
		ID:       id,
		Type:     memberType,
		Status:   RobotStatus{Mode: "idle", Battery: 100},
		LastSeen: 0,
	}
	f.client.EmitEvent("entity:registered", "fleet", map[string]interface{}{
		"member_id": id,
		"type":      memberType,
	})
}

func (f *Fleet) Unregister(id string) {
	delete(f.members, id)
}

func (f *Fleet) Deploy(mission MissionDefinition) error {
	return f.client.EmitEvent("MISSION_RECEIVED", "Fleet", map[string]interface{}{
		"missionName": mission.Name,
		"goalCount":   len(mission.Goals),
		"memberCount": len(f.members),
	})
}

func (f *Fleet) Broadcast(signal string, data map[string]interface{}) error {
	if data == nil {
		data = make(map[string]interface{})
	}
	return f.client.EmitEvent("TASK_REQUEST", "Fleet", map[string]interface{}{
		"name":      signal,
		"data":      data,
		"broadcast": true,
	})
}

func (f *Fleet) Monitor() FleetStatus {
	healthy := 0
	for _, m := range f.members {
		if m.Status.Mode != "error" {
			healthy++
		}
	}
	return FleetStatus{
		Members:       f.getMemberList(),
		Healthy:       healthy,
		Total:         len(f.members),
		MissionActive: true,
	}
}

func (f *Fleet) getMemberList() []*FleetMember {
	result := make([]*FleetMember, 0, len(f.members))
	for _, m := range f.members {
		result = append(result, m)
	}
	return result
}

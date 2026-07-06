use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::client::AtlasClient;
use crate::robot::RobotStatus;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FleetMember {
    pub id: String,
    #[serde(rename = "type")]
    pub member_type: String,
    pub status: RobotStatus,
    pub last_seen: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FleetStatus {
    pub members: Vec<FleetMember>,
    pub healthy: i32,
    pub total: i32,
    pub mission_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MissionGoal {
    pub description: String,
    pub priority: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MissionDefinition {
    pub name: String,
    pub description: Option<String>,
    pub goals: Vec<MissionGoal>,
}

pub struct Fleet {
    client: AtlasClient,
    members: HashMap<String, FleetMember>,
}

impl Fleet {
    pub fn new(client: AtlasClient) -> Self {
        Self {
            client,
            members: HashMap::new(),
        }
    }

    pub fn register(&mut self, id: &str, member_type: &str) {
        let member = FleetMember {
            id: id.to_string(),
            member_type: member_type.to_string(),
            status: RobotStatus {
                position: crate::robot::Position { x: 0.0, y: 0.0, z: 0.0 },
                battery: 100.0,
                speed: 0.0,
                mode: "idle".to_string(),
                task_count: 0,
            },
            last_seen: 0,
        };
        self.members.insert(id.to_string(), member);
    }

    pub fn unregister(&mut self, id: &str) {
        self.members.remove(id);
    }

    pub async fn deploy(&self, mission: &MissionDefinition) -> Result<(), Box<dyn std::error::Error>> {
        let mut payload = HashMap::new();
        payload.insert("missionName".to_string(), serde_json::Value::String(mission.name.clone()));
        payload.insert("goalCount".to_string(), serde_json::Value::Number(serde_json::Number::from(mission.goals.len() as i32)));
        self.client.emit_event("MISSION_RECEIVED", "Fleet", Some(serde_json::Value::Object(payload.into_iter().collect()))).await
    }

    pub async fn broadcast(&self, signal: &str, data: Option<serde_json::Value>) -> Result<(), Box<dyn std::error::Error>> {
        let mut payload = HashMap::new();
        payload.insert("name".to_string(), serde_json::Value::String(signal.to_string()));
        payload.insert("data".to_string(), data.unwrap_or(serde_json::Value::Null));
        payload.insert("broadcast".to_string(), serde_json::Value::Bool(true));
        self.client.emit_event("TASK_REQUEST", "Fleet", Some(serde_json::Value::Object(payload.into_iter().collect()))).await
    }

    pub fn monitor(&self) -> FleetStatus {
        let healthy = self.members.values().filter(|m| m.status.mode != "error").count() as i32;
        FleetStatus {
            members: self.members.values().cloned().collect(),
            healthy,
            total: self.members.len() as i32,
            mission_active: true,
        }
    }
}

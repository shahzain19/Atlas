use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeoPosition {
    pub latitude: f64,
    pub longitude: f64,
    pub altitude: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedObject {
    pub label: String,
    pub confidence: f64,
    pub position: Position,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub objects: Vec<DetectedObject>,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RobotStatus {
    pub position: Position,
    pub battery: f64,
    pub speed: f64,
    pub mode: String,
    pub task_count: i32,
}

use crate::client::AtlasClient;

pub struct Robot {
    client: AtlasClient,
    pub id: String,
    pub name: String,
}

impl Robot {
    pub fn new(client: AtlasClient, id: &str, name: &str) -> Self {
        Self {
            client,
            id: id.to_string(),
            name: name.to_string(),
        }
    }

    pub async fn navigate_to(&self, target: &NavigateTarget) -> Result<(), Box<dyn std::error::Error>> {
        let mut payload = HashMap::new();
        payload.insert("robotId".to_string(), serde_json::Value::String(self.id.clone()));
        match target {
            NavigateTarget::Geo(g) => {
                let mut pos = HashMap::new();
                pos.insert("x".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(g.latitude).unwrap()));
                pos.insert("y".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(g.longitude).unwrap()));
                pos.insert("z".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(g.altitude.unwrap_or(0.0)).unwrap()));
                payload.insert("target".to_string(), serde_json::Value::Object(pos.into_iter().collect()));
            }
            NavigateTarget::Local(p) => {
                let mut pos = HashMap::new();
                pos.insert("x".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(p.x).unwrap()));
                pos.insert("y".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(p.y).unwrap()));
                pos.insert("z".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(p.z).unwrap()));
                payload.insert("target".to_string(), serde_json::Value::Object(pos.into_iter().collect()));
            }
        }
        self.client.emit_event("ROBOT_NAVIGATE", &self.name, Some(serde_json::Value::Object(payload.into_iter().collect()))).await
    }

    pub async fn scan(&self) -> Result<(), Box<dyn std::error::Error>> {
        let mut payload = HashMap::new();
        payload.insert("camera".to_string(), serde_json::Value::String("front".to_string()));
        payload.insert("robotId".to_string(), serde_json::Value::String(self.id.clone()));
        self.client.emit_event("IMAGE_CAPTURED", &self.name, Some(serde_json::Value::Object(payload.into_iter().collect()))).await
    }

    pub async fn explore(&self) -> Result<(), Box<dyn std::error::Error>> {
        let mut payload = HashMap::new();
        payload.insert("name".to_string(), serde_json::Value::String("Autonomous Survey".to_string()));
        payload.insert("robotId".to_string(), serde_json::Value::String(self.id.clone()));
        self.client.emit_event("TASK_REQUEST", &self.name, Some(serde_json::Value::Object(payload.into_iter().collect()))).await
    }
}

pub enum NavigateTarget {
    Geo(GeoPosition),
    Local(Position),
}

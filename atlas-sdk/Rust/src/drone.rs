use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::client::AtlasClient;
use crate::robot::Position;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DroneStatus {
    pub position: Position,
    pub battery: f64,
    pub altitude: f64,
    pub mode: String,
    pub speed: f64,
}

pub struct Drone {
    client: AtlasClient,
    pub id: String,
    pub name: String,
}

impl Drone {
    pub fn new(client: AtlasClient, id: &str, name: &str) -> Self {
        Self {
            client,
            id: id.to_string(),
            name: name.to_string(),
        }
    }

    pub async fn takeoff(&self, altitude: f64) -> Result<(), Box<dyn std::error::Error>> {
        let alt = if altitude == 0.0 { 10.0 } else { altitude };
        let mut payload = HashMap::new();
        payload.insert("targetAltitude".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(alt).unwrap()));
        payload.insert("droneId".to_string(), serde_json::Value::String(self.id.clone()));
        self.client.emit_event("DRONE_TAKEOFF", &self.name, Some(serde_json::Value::Object(payload.into_iter().collect()))).await
    }

    pub async fn fly_to(&self, lat: f64, lon: f64, alt: f64) -> Result<(), Box<dyn std::error::Error>> {
        let mut payload = HashMap::new();
        payload.insert("latitude".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(lat).unwrap()));
        payload.insert("longitude".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(lon).unwrap()));
        payload.insert("altitude".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(alt).unwrap()));
        payload.insert("droneId".to_string(), serde_json::Value::String(self.id.clone()));
        self.client.emit_event("DRONE_FLY_TO", &self.name, Some(serde_json::Value::Object(payload.into_iter().collect()))).await
    }

    pub async fn capture_image(&self) -> Result<(), Box<dyn std::error::Error>> {
        let mut payload = HashMap::new();
        payload.insert("camera".to_string(), serde_json::Value::String("downward".to_string()));
        payload.insert("droneId".to_string(), serde_json::Value::String(self.id.clone()));
        self.client.emit_event("IMAGE_CAPTURED", &self.name, Some(serde_json::Value::Object(payload.into_iter().collect()))).await
    }

    pub async fn return_home(&self) -> Result<(), Box<dyn std::error::Error>> {
        let mut payload = HashMap::new();
        payload.insert("droneId".to_string(), serde_json::Value::String(self.id.clone()));
        self.client.emit_event("DRONE_RETURN", &self.name, Some(serde_json::Value::Object(payload.into_iter().collect()))).await
    }

    pub async fn land(&self) -> Result<(), Box<dyn std::error::Error>> {
        let mut payload = HashMap::new();
        payload.insert("droneId".to_string(), serde_json::Value::String(self.id.clone()));
        self.client.emit_event("DRONE_LAND", &self.name, Some(serde_json::Value::Object(payload.into_iter().collect()))).await
    }
}

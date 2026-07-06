use serde::{Deserialize, Serialize};
use chrono::Utc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub id: String,
    #[serde(rename = "type")]
    pub event_type: String,
    pub source: String,
    pub payload: Option<serde_json::Value>,
    pub timestamp: i64,
    pub priority: String,
}

impl Event {
    pub fn new(event_type: &str, source: &str, payload: Option<serde_json::Value>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            event_type: event_type.to_string(),
            source: source.to_string(),
            payload,
            timestamp: Utc::now().timestamp_millis(),
            priority: "medium".to_string(),
        }
    }
}
